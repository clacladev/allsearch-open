import { describe, expect, it } from 'bun:test';
import { getRevealCommand } from '@/libs/utils/fileManager';

describe('getRevealCommand', () => {
  it('selects the file itself on macOS', () => {
    expect(
      getRevealCommand('darwin', '/Users/me/Library/Application Support/AllSearch/a.db')
    ).toEqual({
      command: 'open',
      args: ['-R', '/Users/me/Library/Application Support/AllSearch/a.db'],
    });
  });

  it('passes the flag and path to explorer as a single argument on Windows', () => {
    const { command, args } = getRevealCommand('win32', 'C:\\Users\\me\\AppData\\AllSearch\\a.db');
    expect(command).toBe('explorer');
    expect(args).toEqual(['/select,C:\\Users\\me\\AppData\\AllSearch\\a.db']);
  });

  it('normalises forward slashes to backslashes for explorer', () => {
    const { args } = getRevealCommand('win32', 'C:/Users/me/AllSearch/a.db');
    expect(args).toEqual(['/select,C:\\Users\\me\\AllSearch\\a.db']);
  });

  it('opens the containing directory on Linux, since there is no cross-desktop select', () => {
    expect(getRevealCommand('linux', '/home/me/.local/share/AllSearch/a.db')).toEqual({
      command: 'xdg-open',
      args: ['/home/me/.local/share/AllSearch'],
    });
  });

  it('keeps the path out of a shell string so spaces need no quoting', () => {
    const { args } = getRevealCommand('darwin', '/Users/me/Application Support/a.db');
    expect(args[1]).toBe('/Users/me/Application Support/a.db');
  });

  // A path a shell would mangle. It arrives at the file manager byte-for-byte because it travels
  // as an argv entry rather than being interpolated into a command line.
  it('passes metacharacters through untouched', () => {
    const hostilePath = '/home/me/AllSearch$(whoami); rm -rf ~/`id`/a.db';
    expect(getRevealCommand('linux', hostilePath).args[0]).toBe(
      '/home/me/AllSearch$(whoami); rm -rf ~/`id`'
    );
  });
});
