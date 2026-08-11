import { spawn } from 'node:child_process';

export type BrowserOpenCommand = { command: string; args: string[] };

/** The platform's "open this with whatever is registered for it" command.
 *
 * On Windows the URL is passed to `cmd /c start` with an empty title argument first: `start`
 * treats a lone quoted argument as the window title, so omitting it makes a quoted URL open a
 * console window instead of a browser. `shell: false` at the call site plus this explicit argv is
 * what keeps a URL containing shell metacharacters from being interpreted. */
export function getBrowserOpenCommand(platform: NodeJS.Platform, url: string): BrowserOpenCommand {
  switch (platform) {
    case 'darwin':
      return { command: 'open', args: [url] };
    case 'win32':
      return { command: 'cmd', args: ['/c', 'start', '', url] };
    default:
      return { command: 'xdg-open', args: [url] };
  }
}

/** Opens `url` in the user's default browser. Resolves `false` when the platform's opener is
 * missing or fails — headless machines, minimal Linux images and SSH sessions all hit this, and
 * none of them are errors: the caller has already printed the URL, which is the fallback. */
export function openInDefaultBrowser(
  url: string,
  platform: NodeJS.Platform = process.platform
): Promise<boolean> {
  const { command, args } = getBrowserOpenCommand(platform, url);

  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, {
        // Detached and fully redirected so the browser's lifetime is not tied to this process,
        // and so an opener that chatters on stdout cannot interleave with the CLI's own output.
        detached: true,
        stdio: 'ignore',
        shell: false,
      });
      child.once('error', () => resolve(false));
      child.once('spawn', () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}
