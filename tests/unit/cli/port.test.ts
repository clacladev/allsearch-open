import { createServer, type Server } from 'node:net';

import { describe, it, expect, afterEach } from 'bun:test';
import {
  findEphemeralPort,
  isPortAvailable,
  PortUnavailableError,
  resolveServerPort,
} from '@/cli/port';

const HOST = '127.0.0.1';

const openServers = new Set<Server>();

/** Binds a real socket, because a real bind is exactly what the code under test does — a mocked
 * `net` would only prove the mock's behaviour, and the whole point of the check is agreeing with
 * what the OS will let Next.js do a moment later.
 *
 * `EADDRINUSE` resolves rather than throwing: the caller only wants the port occupied, and a port
 * already held by something else on the machine satisfies that just as well. */
function occupy(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') return resolve(port);
      reject(error);
    });
    server.listen(port, HOST, () => {
      openServers.add(server);
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : port);
    });
  });
}

function close(server: Server): Promise<void> {
  openServers.delete(server);
  return new Promise((resolve) => server.close(() => resolve()));
}

afterEach(async () => {
  await Promise.all([...openServers].map(close));
});

describe('isPortAvailable', () => {
  it('is false while something is listening and true once it lets go', async () => {
    const port = await findEphemeralPort(HOST);
    await occupy(port);
    expect(await isPortAvailable(port, HOST)).toBe(false);

    await Promise.all([...openServers].map(close));
    expect(await isPortAvailable(port, HOST)).toBe(true);
  });
});

describe('findEphemeralPort', () => {
  it('returns a port that is genuinely bindable', async () => {
    const port = await findEphemeralPort(HOST);
    expect(port).toBeGreaterThan(0);
    expect(await isPortAvailable(port, HOST)).toBe(true);
  });
});

describe('resolveServerPort', () => {
  it('honours a free --port exactly', async () => {
    const free = await findEphemeralPort(HOST);
    expect(await resolveServerPort({ host: HOST, preferred: free })).toBe(free);
  });

  // Silently relocating a pinned port would be worse than failing: whatever the user pinned it
  // for — a bookmark, a firewall rule — breaks with no indication of why.
  it('refuses rather than relocating when --port is taken', async () => {
    const taken = await occupy(await findEphemeralPort(HOST));
    await expect(resolveServerPort({ host: HOST, preferred: taken })).rejects.toBeInstanceOf(
      PortUnavailableError
    );
    await expect(resolveServerPort({ host: HOST, preferred: taken })).rejects.toThrow(
      String(taken)
    );
  });

  it('scans upwards from the start port, skipping ones already in use', async () => {
    const scanStart = await findEphemeralPort(HOST);
    await occupy(scanStart);

    const resolved = await resolveServerPort({ host: HOST, scanStart, scanCount: 10 });

    expect(resolved).toBeGreaterThan(scanStart);
    expect(resolved).toBeLessThan(scanStart + 10);
  });

  it('falls back to an OS-assigned port when every scanned candidate is taken', async () => {
    const scanStart = await findEphemeralPort(HOST);
    await occupy(scanStart);
    await occupy(scanStart + 1);
    await occupy(scanStart + 2);

    const resolved = await resolveServerPort({ host: HOST, scanStart, scanCount: 3 });

    expect([scanStart, scanStart + 1, scanStart + 2]).not.toContain(resolved);
    expect(await isPortAvailable(resolved, HOST)).toBe(true);
  });
});
