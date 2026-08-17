import 'server-only';

import { streamText } from 'ai';
import { googleModel } from '../models';
import { getPrompt } from '../utils';
import type {
  ArticleOutline,
  ArticleOutlineHeadingTag,
} from '@/libs/database/PromptArticles/types';

// Same model the outline generator uses; keeping symmetry until we have eval
// evidence to justify a different one.
export const ARTICLE_MODEL_ID = 'gemini-flash-latest';
const SYSTEM_PROMPT_PATH = 'libs/ai/promptArticles/articleSystemPrompt.md';

// Soft cap. Most outlines produce ~2000 words. Going higher than 8000 tokens
// (~6000 words) is rarely useful and risks finishReason='length' that wastes
// the LLM call. This is also at the upper bound of Gemini Flash's per-call
// output limit, so we always pass it as the ceiling regardless of the user's
// target word count: a smaller target shortens the prompt's instruction, not
// the safety budget. Scaling the cap down with target_word_count truncates
// the model mid-article (finishReason='length') and onFinish then skips
// persistence, leaving the user with the empty-state fallback.
export const ARTICLE_MAX_OUTPUT_TOKENS = 8000;

export type ArticleSourceForPrompt = {
  title: string;
  cleanUrl: string;
  description?: string;
};

export type StreamArticleInput = {
  projectName: string;
  projectDomain: string;
  promptName: string;
  outline: ArticleOutline;
  sourcesToReference: ArticleSourceForPrompt[];
  /** User-controlled settings that steer prose length, voice, link targets,
   * and SEO keywords. All four flow into the article prompt; word count also
   * scales `maxOutputTokens`. Optional so callers without settings (tests,
   * legacy paths) get the prior default behavior. */
  settings?: {
    targetWordCount: number;
    styleGuide: string | null;
    pagesToLink: string[];
    targetKeywords: string[];
  };
};

function tagToMarkdownPrefix(tag: ArticleOutlineHeadingTag): string {
  // h1..h6 → '#'..'######'. Render headings as literal markdown so the LLM
  // can reproduce them verbatim instead of inferring level depth from a label.
  // Earlier versions passed "H1:" / "H2:" prefixes; the model would frequently
  // emit `# ...` for H2 because it treated the label as a category, not as
  // markdown syntax.
  return '#'.repeat(Number(tag.slice(1)));
}

function renderOutlineForPrompt(outline: ArticleOutline): string {
  return outline.headings
    .map((h) => `${tagToMarkdownPrefix(h.tag)} ${h.text}\nKey point: ${h.keyPoint}`)
    .join('\n\n');
}

function renderSourceForPrompt(s: ArticleSourceForPrompt, index: number): string {
  const lines = [`### Source ${index + 1}: ${s.title}`, `- URL: ${s.cleanUrl}`];
  if (s.description) lines.push(`- Description: ${s.description}`);
  return lines.join('\n');
}

function buildUserPrompt(input: StreamArticleInput): string {
  const sections: string[] = [];

  sections.push('## Brand');
  sections.push(`- Name: ${input.projectName}`);
  sections.push(`- Domain: ${input.projectDomain}`);

  sections.push('\n## Target prompt');
  sections.push(`"${input.promptName}"`);

  // The outline ships as literal markdown headings (`#`, `##`, ...). Wrap in a
  // fenced block so the surrounding `## Brand` / `## Outline` wrapper headings
  // don't blur with the outline's own heading levels and the model can reliably
  // reproduce each line verbatim.
  sections.push(
    '\n## Outline (reproduce each heading line below VERBATIM, at the exact level shown)'
  );
  sections.push('```markdown');
  sections.push(renderOutlineForPrompt(input.outline));
  sections.push('```');

  sections.push('\n## Competing sources currently ranking for this prompt');
  if (input.sourcesToReference.length === 0) {
    sections.push('(none provided)');
  } else {
    input.sourcesToReference.forEach((s, i) => sections.push(renderSourceForPrompt(s, i)));
  }

  if (input.settings) {
    const { targetWordCount, styleGuide, pagesToLink, targetKeywords } = input.settings;
    const lines: string[] = [];

    // Provide both the global target and the per-heading budget. The model
    // tends to overshoot when given only a single number; a per-section
    // ceiling makes the cap concrete and easier to track while writing.
    const headingsCount = input.outline.headings.length || 1;
    const wordsPerHeading = Math.max(1, Math.round(targetWordCount / headingsCount));
    const minWords = Math.round(targetWordCount * 0.9);
    const maxWords = Math.round(targetWordCount * 1.1);
    lines.push(
      `- Target word count: ${targetWordCount} (acceptable range: ${minWords}-${maxWords}). Count words after writing and trim if you exceed ${maxWords}.`
    );
    lines.push(
      `- This outline has ${headingsCount} headings. Aim for ~${wordsPerHeading} words per heading section. Treat that as a soft ceiling, not a floor — shorter sections are fine when the key point is short.`
    );
    if (styleGuide && styleGuide.trim().length) {
      lines.push('- Style guide (apply to voice, vocabulary, structure):');
      lines.push('```');
      lines.push(styleGuide.trim());
      lines.push('```');
    }
    if (targetKeywords.length) {
      lines.push('- Target keywords (integrate naturally, no stuffing):');
      targetKeywords.forEach((k) => lines.push(`  - ${k}`));
    }
    if (pagesToLink.length) {
      lines.push(
        '- Pages to link to (use markdown links inline where they fit naturally; never force):'
      );
      pagesToLink.forEach((u) => lines.push(`  - ${u}`));
    }
    sections.push('\n## Article settings');
    sections.push(lines.join('\n'));
  }

  return sections.join('\n');
}

/**
 * Build a streamText invocation for article generation. Caller is responsible
 * for providing onFinish + abortSignal and converting the result to a Response
 * (`result.toTextStreamResponse()`).
 *
 * Why we expose the result rather than the response: the route handler needs
 * access to result.toTextStreamResponse() AND to wire onFinish/abortSignal at
 * the call site (where the outlineId, user, and req.signal live). Encapsulating
 * the streamText call here keeps the prompt-construction logic testable and out
 * of the route file.
 */
export async function startArticleStream(
  input: StreamArticleInput,
  options: {
    abortSignal?: AbortSignal;
    onFinish: Parameters<typeof streamText>[0]['onFinish'];
  }
) {
  const systemPrompt = await getPrompt(SYSTEM_PROMPT_PATH);
  const userPrompt = buildUserPrompt(input);

  return streamText({
    model: await googleModel(ARTICLE_MODEL_ID),
    system: systemPrompt,
    prompt: userPrompt,
    abortSignal: options.abortSignal,
    maxOutputTokens: ARTICLE_MAX_OUTPUT_TOKENS,
    onFinish: options.onFinish,
  });
}
