import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { createAiGatewayModel, AIAnalyticsProps } from '../models';
import { getPrompt, logNoObjectGeneratedError } from '../utils';
import { OutlineGenerationSchema, OutlineGenerationResult } from './schema';
import { PromptArticleError } from './errors';
import type { SourceItem } from '@/libs/database/Sources/types';
import type { PageHeading } from '@/libs/utils/urlAnalysis';

// Verify against https://vercel.com/ai-gateway/models when bumping.
export const OUTLINE_MODEL_ID = 'google/gemini-3-flash';
const SYSTEM_PROMPT_PATH = 'libs/ai/promptArticles/outlineSystemPrompt.md';

export type OutlineGenerationMode = 'create-new' | 'improve-existing';

export type OutlineGenerationInput = {
  projectName: string;
  projectDomain: string;
  promptName: string;
  mode: OutlineGenerationMode;
  ourSource?: { cleanUrl: string; title?: string; headings?: PageHeading[] };
  sourcesToInspireFrom: SourceItem[];
  /** User-controlled settings that steer outline shape, voice, and SEO.
   * Style guide is included so heading text and key points pick up the
   * brand's voice (e.g. "use 'we' not 'you'", "avoid 'leverage'"); the
   * model treats it as a tone hint, not a structural directive. */
  settings?: {
    targetWordCount: number;
    styleGuide: string | null;
    pagesToLink: string[];
    targetKeywords: string[];
  };
};

/**
 * Render a source into a compact block for the prompt. Only include sources that
 * have headings; filter beforehand.
 */
function renderSourceBlock(source: SourceItem, index: number): string {
  const lines = [
    `### Source ${index + 1}: ${source.title ?? source.cleanUrl}`,
    `- URL: ${source.cleanUrl}`,
  ];
  if (source.description) lines.push(`- Description: ${source.description}`);
  if (source.headings?.length) {
    lines.push(`- Headings:`);
    source.headings.forEach((h) => {
      lines.push(`  - ${h.tag.toUpperCase()}: ${h.text}`);
    });
  }
  return lines.join('\n');
}

function buildUserPrompt(input: OutlineGenerationInput): string {
  const sections: string[] = [];

  sections.push('## Brand');
  sections.push(`- Name: ${input.projectName}`);
  sections.push(`- Domain: ${input.projectDomain}`);

  sections.push('\n## Target prompt');
  sections.push(`"${input.promptName}"`);

  sections.push('\n## Mode');
  sections.push(input.mode);

  if (input.mode === 'improve-existing' && input.ourSource) {
    sections.push('\n## Our existing article (underperforming)');
    sections.push(`- URL: ${input.ourSource.cleanUrl}`);
    if (input.ourSource.title) sections.push(`- Title: ${input.ourSource.title}`);
    if (input.ourSource.headings?.length) {
      sections.push('- Current headings:');
      input.ourSource.headings.forEach((h) => {
        sections.push(`  - ${h.tag.toUpperCase()}: ${h.text}`);
      });
    }
  }

  sections.push('\n## Competing sources (cited in AI answers for this prompt)');
  if (input.sourcesToInspireFrom.length === 0) {
    sections.push('(none)');
  } else {
    input.sourcesToInspireFrom.forEach((source, index) => {
      sections.push(renderSourceBlock(source, index));
    });
  }

  if (input.settings) {
    const { targetWordCount, styleGuide, pagesToLink, targetKeywords } = input.settings;
    const settingsLines: string[] = [];
    settingsLines.push(`- Target word count: ~${targetWordCount}`);
    if (styleGuide && styleGuide.trim().length) {
      settingsLines.push(
        '- Style guide (apply to heading text and key-point voice — the article writer will see it too):'
      );
      settingsLines.push('```');
      settingsLines.push(styleGuide.trim());
      settingsLines.push('```');
    }
    if (targetKeywords.length) {
      settingsLines.push('- Target keywords (cover naturally in headings or key points):');
      targetKeywords.forEach((k) => settingsLines.push(`  - ${k}`));
    }
    if (pagesToLink.length) {
      settingsLines.push(
        '- Pages the article will internally link to (plan sections where these fit):'
      );
      pagesToLink.forEach((u) => settingsLines.push(`  - ${u}`));
    }
    sections.push('\n## Article settings');
    sections.push(settingsLines.join('\n'));
  }

  return sections.join('\n');
}

export async function generateOutline(
  input: OutlineGenerationInput,
  aiAnalyticsProps?: AIAnalyticsProps
): Promise<OutlineGenerationResult> {
  const systemPrompt = await getPrompt(SYSTEM_PROMPT_PATH);
  const userPrompt = buildUserPrompt(input);

  const analyticsProps: AIAnalyticsProps = {
    ...aiAnalyticsProps,
    operationId: 'article-outline',
  };

  try {
    const { output } = await generateText({
      model: createAiGatewayModel(OUTLINE_MODEL_ID, analyticsProps),
      output: Output.object({ schema: OutlineGenerationSchema }),
      system: systemPrompt,
      prompt: userPrompt,
    });

    if (!output?.headings?.length) {
      throw new PromptArticleError(
        'GENERATION_FAILED',
        'The outline generation returned no headings.'
      );
    }

    return output;
  } catch (error) {
    if (error instanceof PromptArticleError) throw error;

    if (NoObjectGeneratedError.isInstance(error)) {
      logNoObjectGeneratedError(error);
      throw new PromptArticleError(
        'GENERATION_FAILED',
        'The outline generator could not produce a valid structured response.',
        error
      );
    }

    // Detect rate limit / overloaded responses from the upstream gateway.
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (
      message.includes('rate') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('overload') ||
      message.includes('busy')
    ) {
      throw new PromptArticleError(
        'GENERATION_RATE_LIMIT',
        'The outline generation service is currently busy. Try again in a moment.',
        error
      );
    }

    // Do not pass through the raw upstream message — it can leak model/vendor
    // details into user-visible error responses.
    throw new PromptArticleError('GENERATION_FAILED', 'Failed to generate the outline.', error);
  }
}
