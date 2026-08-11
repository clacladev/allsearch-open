import { describe, expect, it } from 'bun:test';
import { formatBytes } from '@/libs/numberFormatters';

describe('formatBytes', () => {
  it('reports whole bytes without a fraction', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('uses decimal units, matching what a file manager shows', () => {
    expect(formatBytes(1000)).toBe('1.0 KB');
    expect(formatBytes(1_000_000)).toBe('1.0 MB');
    expect(formatBytes(1_000_000_000)).toBe('1.0 GB');
  });

  it('drops the fraction once three significant digits are shown', () => {
    expect(formatBytes(250_000)).toBe('250 KB');
    expect(formatBytes(2_500_000)).toBe('2.5 MB');
  });

  it('treats an empty or missing database as zero rather than NaN', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });

  it('clamps at terabytes rather than running off the end of the unit list', () => {
    expect(formatBytes(10 ** 15)).toBe('1000 TB');
  });
});
