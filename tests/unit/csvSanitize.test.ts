import { describe, expect, it } from 'bun:test';
import { sanitizeCsvCell, sanitizeCsvRow } from '@/libs/utils/csvSanitize';

describe('sanitizeCsvCell', () => {
  it('prefixes values starting with a formula trigger', () => {
    expect(sanitizeCsvCell('=HYPERLINK("http://evil","x")')).toBe(
      "'=HYPERLINK(\"http://evil\",\"x\")"
    );
    expect(sanitizeCsvCell('+1234')).toBe("'+1234");
    expect(sanitizeCsvCell('-1234')).toBe("'-1234");
    expect(sanitizeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(sanitizeCsvCell('\tcmd')).toBe("'\tcmd");
    expect(sanitizeCsvCell('\rcmd')).toBe("'\rcmd");
  });

  it('leaves ordinary text untouched', () => {
    expect(sanitizeCsvCell('Nike')).toBe('Nike');
    expect(sanitizeCsvCell('https://example.com')).toBe('https://example.com');
    expect(sanitizeCsvCell('')).toBe('');
  });

  it('does not flag a formula-trigger character in the middle of a value', () => {
    expect(sanitizeCsvCell('foo=bar')).toBe('foo=bar');
  });
});

describe('sanitizeCsvRow', () => {
  it('sanitizes only string fields, leaving other types untouched', () => {
    const row = { Title: '=cmd|/c calc', Count: 5, Active: true, Note: null };
    expect(sanitizeCsvRow(row)).toEqual({
      Title: "'=cmd|/c calc",
      Count: 5,
      Active: true,
      Note: null,
    });
  });

  it('does not mutate the input row', () => {
    const row = { Title: '=evil' };
    const sanitized = sanitizeCsvRow(row);
    expect(row.Title).toBe('=evil');
    expect(sanitized.Title).toBe("'=evil");
  });
});
