import { dirname } from 'node:path';

export type RevealCommand = {
  command: string;
  args: string[];
};

/** Builds the argv for showing `filePath` in the operating system's file manager.
 *
 * Returned as a command plus a separate argument array so callers can `spawn` without a shell —
 * the path is a real filesystem path that may contain spaces, quotes or shell metacharacters, and
 * interpolating it into a shell string would be an injection route.
 *
 * macOS and Windows can select the file itself; on Linux there is no cross-desktop way to do that,
 * so the containing directory is opened instead. */
export function getRevealCommand(platform: NodeJS.Platform, filePath: string): RevealCommand {
  switch (platform) {
    case 'darwin':
      return { command: 'open', args: ['-R', filePath] };
    case 'win32':
      // Explorer is particular here: the flag and the path must arrive as a single argument, and
      // it rejects forward slashes even though the rest of Windows accepts them.
      return { command: 'explorer', args: [`/select,${filePath.replace(/\//g, '\\')}`] };
    default:
      return { command: 'xdg-open', args: [dirname(filePath)] };
  }
}
