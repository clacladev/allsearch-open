export type PromptArticleErrorCode =
  | 'NOT_ENOUGH_SOURCES'
  | 'PROMPT_NOT_FOUND'
  | 'OPPORTUNITY_NOT_FOUND'
  | 'PROMPT_ARTICLE_NOT_FOUND'
  | 'GENERATION_FAILED'
  | 'GENERATION_RATE_LIMIT'
  | 'ARTICLE_GENERATION_FAILED'
  | 'ARTICLE_GENERATION_RATE_LIMIT'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED';

export class PromptArticleError extends Error {
  code: PromptArticleErrorCode;

  constructor(code: PromptArticleErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'PromptArticleError';
    this.code = code;
  }
}

export function errorCodeToStatus(code: PromptArticleErrorCode): number {
  switch (code) {
    case 'UNAUTHORIZED':
      return 403;
    case 'PROMPT_NOT_FOUND':
    case 'OPPORTUNITY_NOT_FOUND':
    case 'PROMPT_ARTICLE_NOT_FOUND':
      return 410;
    case 'NOT_ENOUGH_SOURCES':
      return 422;
    case 'VALIDATION_FAILED':
      return 400;
    case 'GENERATION_FAILED':
    case 'ARTICLE_GENERATION_FAILED':
      return 502;
    case 'GENERATION_RATE_LIMIT':
    case 'ARTICLE_GENERATION_RATE_LIMIT':
      return 503;
  }
}
