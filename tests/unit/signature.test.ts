import { describe, expect, it } from 'bun:test';
import { getSignature, getUniqueId } from '@/libs/signature';

describe('getSignature', () => {
  it('returns a 44-character base64 string for string input', () => {
    const result = getSignature('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBe(44);
  });

  it('is deterministic — same input produces same output', () => {
    expect(getSignature('hello')).toBe(getSignature('hello'));
    expect(getSignature({ a: 1 })).toBe(getSignature({ a: 1 }));
  });

  it('produces different output for different inputs', () => {
    expect(getSignature('hello')).not.toBe(getSignature('world'));
  });

  it('stringifies object input before hashing', () => {
    const obj = { key: 'value' };
    const fromObj = getSignature(obj);
    const fromJson = getSignature(JSON.stringify(obj));
    // getSignature(obj) uses JSON.stringify, so these should match
    expect(fromObj).toBe(fromJson);
  });

  it('non-string input is JSON.stringify-ed before hashing', () => {
    // JSON.stringify(null) === 'null', so getSignature(null) === getSignature('null')
    expect(getSignature(null)).toBe(getSignature('null'));
    // JSON.stringify(42) === '42', so getSignature(42) === getSignature('42')
    expect(getSignature(42)).toBe(getSignature('42'));
  });

  it('handles empty string input', () => {
    const result = getSignature('');
    expect(result.length).toBe(44);
  });
});

describe('getUniqueId', () => {
  it('returns a 16-character hex string by default', () => {
    const result = getUniqueId('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBe(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('returns the requested length when specified', () => {
    expect(getUniqueId('test', 8).length).toBe(8);
    expect(getUniqueId('test', 32).length).toBe(32);
  });

  it('is deterministic — same input produces same output', () => {
    expect(getUniqueId('hello')).toBe(getUniqueId('hello'));
    expect(getUniqueId({ x: 1 })).toBe(getUniqueId({ x: 1 }));
  });

  it('produces different output for different inputs', () => {
    expect(getUniqueId('hello')).not.toBe(getUniqueId('world'));
  });

  it('handles numeric input by stringifying', () => {
    const result = getUniqueId(42);
    expect(result.length).toBe(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });
});
