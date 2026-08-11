import { describe, it, expect } from 'bun:test';
import { parseCliArgs } from '@/cli/args';

describe('parseCliArgs', () => {
  it('defaults to picking a free port and opening a browser', () => {
    expect(parseCliArgs([])).toEqual({ kind: 'run', options: { open: true } });
  });

  it('accepts --port and -p in both the spaced and the = form', () => {
    for (const argv of [['--port', '4000'], ['--port=4000'], ['-p', '4000'], ['-p=4000']]) {
      expect(parseCliArgs(argv)).toEqual({ kind: 'run', options: { open: true, port: 4000 } });
    }
  });

  it('turns the browser off with --no-open, leaving the port unpinned', () => {
    expect(parseCliArgs(['--no-open'])).toEqual({ kind: 'run', options: { open: false } });
    expect(parseCliArgs(['--no-open', '--port', '4000'])).toEqual({
      kind: 'run',
      options: { open: false, port: 4000 },
    });
  });

  it('reports --help and --version regardless of what else was passed', () => {
    expect(parseCliArgs(['--help'])).toEqual({ kind: 'help' });
    expect(parseCliArgs(['-h'])).toEqual({ kind: 'help' });
    expect(parseCliArgs(['--version'])).toEqual({ kind: 'version' });
    expect(parseCliArgs(['-v'])).toEqual({ kind: 'version' });
    expect(parseCliArgs(['--port', '4000', '--help'])).toEqual({ kind: 'help' });
  });

  // A port silently coerced to something else is the worst outcome available here: the URL is the
  // only handle the user has on their own app, so a mistyped flag has to be told, not guessed at.
  it.each([
    ['abc', 'not numeric'],
    ['0x1f', 'hex, which parseInt would have accepted as 0'],
    ['3000abc', 'trailing junk, which parseInt would have accepted as 3000'],
    ['0', 'below the valid range'],
    ['65536', 'above the valid range'],
    ['-1', 'negative'],
    ['3.5', 'fractional'],
  ])('rejects --port %s (%s)', (value) => {
    const parsed = parseCliArgs(['--port', value]);
    expect(parsed.kind).toBe('error');
  });

  it('rejects --port with nothing after it', () => {
    const parsed = parseCliArgs(['--port']);
    expect(parsed.kind).toBe('error');
    if (parsed.kind === 'error') expect(parsed.message).toContain('Missing a port number');
  });

  it('rejects an unknown flag rather than ignoring it', () => {
    const parsed = parseCliArgs(['--porrt', '4000']);
    expect(parsed.kind).toBe('error');
    if (parsed.kind === 'error') expect(parsed.message).toContain('--porrt');
  });

  it('lets a later flag win over an earlier one', () => {
    expect(parseCliArgs(['--port', '4000', '--port', '4100'])).toEqual({
      kind: 'run',
      options: { open: true, port: 4100 },
    });
    expect(parseCliArgs(['--no-open', '--open'])).toEqual({ kind: 'run', options: { open: true } });
  });
});
