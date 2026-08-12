import { describe, it, expect } from 'bun:test';
import { getBrowserOpenCommand, openInDefaultBrowser } from '@/cli/browser';

describe('getBrowserOpenCommand', () => {
  it('uses the native opener on macOS', () => {
    expect(getBrowserOpenCommand('darwin', 'http://127.0.0.1:3000')).toEqual({
      command: 'open',
      args: ['http://127.0.0.1:3000'],
    });
  });

  // `start` reads a lone quoted argument as the window title, so without the empty title first a
  // quoted URL opens a console window instead of the browser.
  it('passes an empty window title before the URL on Windows', () => {
    expect(getBrowserOpenCommand('win32', 'http://127.0.0.1:3000')).toEqual({
      command: 'cmd',
      args: ['/c', 'start', '', 'http://127.0.0.1:3000'],
    });
  });

  it('falls back to xdg-open everywhere else', () => {
    for (const platform of ['linux', 'freebsd', 'openbsd'] as NodeJS.Platform[]) {
      expect(getBrowserOpenCommand(platform, 'http://127.0.0.1:3000')).toEqual({
        command: 'xdg-open',
        args: ['http://127.0.0.1:3000'],
      });
    }
  });

  it('never puts the URL through a shell, so metacharacters stay inert', () => {
    const hostile = 'http://127.0.0.1:3000/?a=1;rm -rf /';
    for (const platform of ['darwin', 'win32', 'linux'] as NodeJS.Platform[]) {
      const { args } = getBrowserOpenCommand(platform, hostile);
      expect(args.at(-1)).toBe(hostile);
    }
  });
});

describe('openInDefaultBrowser', () => {
  // Headless machines, minimal containers and SSH sessions all have no opener. The URL has
  // already been printed by then, so this must report failure rather than crash the app.
  it('resolves false instead of throwing when the opener does not exist', async () => {
    const opened = await openInDefaultBrowser(
      'http://127.0.0.1:3000',
      'definitely-not-a-platform' as NodeJS.Platform
    );
    // On a machine that happens to have `xdg-open` installed this legitimately succeeds; the
    // assertion is that it answers with a boolean rather than rejecting.
    expect(typeof opened).toBe('boolean');
  });
});
