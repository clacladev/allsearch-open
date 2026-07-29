import { describe, expect, it } from 'bun:test';
import { isPromptUnique, normalizePromptName } from '@/libs/utils/prompts';

describe('normalizePromptName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizePromptName('  hello  ')).toBe('hello');
  });

  it('converts to lowercase', () => {
    expect(normalizePromptName('Hello World')).toBe('hello world');
  });

  it('trims and lowercases in one step', () => {
    expect(normalizePromptName('  BEST AI TOOLS  ')).toBe('best ai tools');
  });

  it('returns an empty string for a blank input', () => {
    expect(normalizePromptName('   ')).toBe('');
  });

  it('is idempotent on already-normalized strings', () => {
    expect(normalizePromptName('already normalized')).toBe('already normalized');
  });
});

describe('isPromptUnique', () => {
  it('returns true when the new prompt is not in the list', () => {
    expect(isPromptUnique(['what is ai?', 'best tools'], 'new prompt')).toBe(true);
  });

  it('returns false when the new prompt exactly matches an existing prompt', () => {
    expect(isPromptUnique(['what is ai?', 'best tools'], 'best tools')).toBe(false);
  });

  it('returns false when the new prompt matches case-insensitively', () => {
    expect(isPromptUnique(['Best Tools'], 'best tools')).toBe(false);
    expect(isPromptUnique(['best tools'], 'BEST TOOLS')).toBe(false);
  });

  it('returns false when the new prompt matches after trimming whitespace', () => {
    expect(isPromptUnique(['best tools'], '  best tools  ')).toBe(false);
  });

  it('returns true for an empty list', () => {
    expect(isPromptUnique([], 'any prompt')).toBe(true);
  });

  it('returns false when existing prompt has mixed case and new prompt has different casing', () => {
    expect(isPromptUnique(['What Is AI?'], 'what is ai?')).toBe(false);
  });
});
