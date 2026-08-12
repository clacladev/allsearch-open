import { createServer } from 'node:net';

/** Where the scan starts when the user did not pass `--port`. 3000 is what Next.js prints in
 * every tutorial, so it is the port a returning user is most likely to have bookmarked — worth
 * preferring, just never assuming (issue 20). */
export const PORT_SCAN_START = 3000;

/** How many consecutive ports to try before falling back to an OS-assigned ephemeral port. */
export const PORT_SCAN_COUNT = 20;

/** Whether `port` can be bound on `host` right now. Answered by actually binding it — the only
 * check that accounts for another process, another user's process, and the OS's own reservations
 * at the same time. */
export function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, host);
  });
}

/** Asks the OS for any free port by binding port 0 and reading back what it assigned. */
export function findEphemeralPort(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.once('listening', () => {
      const address = probe.address();
      if (address === null || typeof address === 'string') {
        probe.close(() => reject(new Error('The operating system did not report a bound port.')));
        return;
      }
      const { port } = address;
      probe.close(() => resolve(port));
    });
    probe.listen(0, host);
  });
}

export class PortUnavailableError extends Error {
  constructor(readonly port: number) {
    super(
      `Port ${port} is already in use. Pass a different --port, or omit --port and AllSearch will pick a free one.`
    );
    this.name = 'PortUnavailableError';
  }
}

/** Resolves the port to boot on.
 *
 * A `preferred` port comes from `--port` and is honoured exactly or not at all: silently moving a
 * pinned port would break whatever the user pinned it for. Without one, ports are scanned from
 * {@link PORT_SCAN_START} upwards and, if every candidate is taken, the OS is asked for an
 * ephemeral one so the app always starts.
 *
 * There is an unavoidable gap between this releasing the probe socket and Next binding the port,
 * so a racing process can still win it. The consequence is a clear "address in use" crash at
 * boot, not silent misbehaviour, and re-running the command picks a different port. */
export async function resolveServerPort(options: {
  host: string;
  preferred?: number;
  scanStart?: number;
  scanCount?: number;
}): Promise<number> {
  const { host, preferred, scanStart = PORT_SCAN_START, scanCount = PORT_SCAN_COUNT } = options;

  if (preferred !== undefined) {
    if (await isPortAvailable(preferred, host)) return preferred;
    throw new PortUnavailableError(preferred);
  }

  for (let port = scanStart; port < scanStart + scanCount && port <= 65535; port++) {
    if (await isPortAvailable(port, host)) return port;
  }

  return findEphemeralPort(host);
}
