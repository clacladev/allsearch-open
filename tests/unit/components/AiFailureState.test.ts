import { describe, expect, it } from 'bun:test';
import { getAiFailureStateCopy } from '@/app/components/AiFailureState';
import { isAiErrorCode, type AiErrorCode } from '@/libs/ai/errors';
import { AppFetchError } from '@/hooks/appFetch';
import {
  getChatbotCoverageCaption,
} from '@/app/(private)/components/ChatbotCoverageCaption';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import {
  encodeStreamError,
  extractStreamError,
} from '@/libs/ai/promptArticles/streamErrorSentinel';

describe('getAiFailureStateCopy', () => {
  it('produces distinct copy per code, naming the given provider', () => {
    const noKey = getAiFailureStateCopy('NO_KEY', 'google');
    const invalidKey = getAiFailureStateCopy('INVALID_KEY', 'google');
    const rateLimited = getAiFailureStateCopy('RATE_LIMITED', 'google');

    // All three must read distinctly from one another.
    const titles = [noKey.title, invalidKey.title, rateLimited.title];
    expect(new Set(titles).size).toBe(3);
    const descriptions = [noKey.description, invalidKey.description, rateLimited.description];
    expect(new Set(descriptions).size).toBe(3);

    // Every code names the provider so the user knows which key to touch.
    expect(noKey.description).toContain('Google');
    expect(invalidKey.description).toContain('Google');
    expect(rateLimited.description).toContain('Google');
  });

  it('names a different provider for openai and perplexity', () => {
    expect(getAiFailureStateCopy('NO_KEY', 'openai').description).toContain('OpenAI');
    expect(getAiFailureStateCopy('NO_KEY', 'perplexity').description).toContain('Perplexity');
  });

  it('uses warning severity for NO_KEY and RATE_LIMITED, error severity for INVALID_KEY', () => {
    expect(getAiFailureStateCopy('NO_KEY', 'google').iconColor).toBe('warning');
    expect(getAiFailureStateCopy('INVALID_KEY', 'google').iconColor).toBe('error');
    expect(getAiFailureStateCopy('RATE_LIMITED', 'google').iconColor).toBe('warning');
  });
});

describe('isAiErrorCode', () => {
  it('accepts exactly the three credential codes', () => {
    expect(isAiErrorCode('NO_KEY')).toBe(true);
    expect(isAiErrorCode('INVALID_KEY')).toBe(true);
    expect(isAiErrorCode('RATE_LIMITED')).toBe(true);
  });

  it('rejects unrelated codes and undefined', () => {
    expect(isAiErrorCode('NOT_ENOUGH_SOURCES')).toBe(false);
    expect(isAiErrorCode(undefined)).toBe(false);
    expect(isAiErrorCode('')).toBe(false);
  });
});

// Mirrors the pattern every onboarding form (TopicsForm/PromptsForm/CompetitorsForm) uses to
// decide between rendering AiFailureState and keeping its existing generic error text.
function classifyOnboardingError(error: unknown): AiErrorCode | undefined {
  return error instanceof AppFetchError && isAiErrorCode(error.code) ? error.code : undefined;
}

describe('onboarding form credential-vs-generic classification', () => {
  it('picks out the credential code from an AppFetchError', () => {
    const error = new AppFetchError('The google API key was rejected.', 401, 'INVALID_KEY');
    expect(classifyOnboardingError(error)).toBe('INVALID_KEY');
  });

  it('falls back to generic (undefined) for a non-credential AppFetchError code', () => {
    const error = new AppFetchError('Failed to fetch topics ideas', 500, 'INTERNAL_ERROR');
    expect(classifyOnboardingError(error)).toBeUndefined();
  });

  it('falls back to generic (undefined) for an AppFetchError with no code at all', () => {
    const error = new AppFetchError('Failed to fetch topics ideas', 500);
    expect(classifyOnboardingError(error)).toBeUndefined();
  });

  it('falls back to generic (undefined) for a plain Error (e.g. client-side validation)', () => {
    expect(classifyOnboardingError(new Error('Invalid URL'))).toBeUndefined();
  });
});

describe('getChatbotCoverageCaption', () => {
  it('names a single enabled chatbot', () => {
    expect(getChatbotCoverageCaption([ChatbotId.ChatGPT])).toBe('Based on ChatGPT.');
  });

  it('joins two enabled chatbots with "and"', () => {
    expect(getChatbotCoverageCaption([ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview])).toBe(
      'Based on ChatGPT and Google AI.'
    );
  });

  it('joins three enabled chatbots with a comma list and a trailing "and"', () => {
    expect(
      getChatbotCoverageCaption([
        ChatbotId.ChatGPT,
        ChatbotId.GoogleAIOverview,
        ChatbotId.Perplexity,
      ])
    ).toBe('Based on ChatGPT, Google AI and Perplexity.');
  });

  it('handles the degenerate none-enabled case distinctly, pointing at Settings', () => {
    const caption = getChatbotCoverageCaption([]);
    expect(caption).not.toContain('Based on');
    expect(caption.toLowerCase()).toContain('settings');
  });
});

describe('article-stream error sentinel', () => {
  it('round-trips each AI error code through encode/extract', () => {
    for (const code of ['NO_KEY', 'INVALID_KEY', 'RATE_LIMITED'] as const) {
      const encoded = `# Partial article\n\nSome streamed text.${encodeStreamError(code)}`;
      const { text, code: extracted } = extractStreamError(encoded);
      expect(extracted).toBe(code);
      expect(text).toBe('# Partial article\n\nSome streamed text.');
    }
  });

  it('leaves ordinary article text untouched when there is no sentinel', () => {
    const article = '# Title\n\nJust a normal article, no errors here.';
    const { text, code } = extractStreamError(article);
    expect(code).toBeUndefined();
    expect(text).toBe(article);
  });
});
