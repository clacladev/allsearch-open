import type { AiErrorCode } from '@/libs/ai/errors';

// The article-body route (`[promptArticleId]/article/route.ts`) streams raw markdown text as the
// response body: by the time an upstream credential/rate-limit error can occur (the Google API
// call happens lazily, after `streamText()` returns), the 200 status and `text/plain` headers have
// already been sent to the client — there is no HTTP status code or JSON envelope left to carry a
// structured error through. This sentinel is the one place in the text body reserved for that: the
// route appends it when `toAiError` classifies a mid-stream error, and the client-side streaming
// hook strips it back out before treating the accumulated text as the article.
//
// A NUL character can't occur in valid markdown/LLM text output, so a match here is unambiguous.
const NUL = String.fromCharCode(0);
const SENTINEL_PATTERN = new RegExp(
  `${NUL}AI_STREAM_ERROR:(NO_KEY|INVALID_KEY|RATE_LIMITED|UPSTREAM_ERROR)${NUL}`
);

export function encodeStreamError(code: AiErrorCode): string {
  return `${NUL}AI_STREAM_ERROR:${code}${NUL}`;
}

/** Splits a sentinel (if present) off `text`, returning the text before it and the code it
 * carried. Returns `code: undefined` and the original text unchanged when no sentinel is found. */
export function extractStreamError(text: string): { text: string; code: AiErrorCode | undefined } {
  const match = text.match(SENTINEL_PATTERN);
  if (!match || match.index === undefined) return { text, code: undefined };
  return { text: text.slice(0, match.index), code: match[1] as AiErrorCode };
}
