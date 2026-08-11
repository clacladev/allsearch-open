import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  acquireInstanceLock,
  isProcessAlive,
  readInstanceLock,
  releaseInstanceLock,
  type InstanceLockRecord,
} from '@/cli/instanceLock';

let lockPath: string;

beforeEach(() => {
  lockPath = join(mkdtempSync(join(tmpdir(), 'allsearch-lock-')), 'allsearch.lock');
});

function record(overrides: Partial<InstanceLockRecord> = {}): InstanceLockRecord {
  return {
    pid: process.pid,
    port: 3000,
    url: 'http://127.0.0.1:3000',
    startedAt: '2026-08-11T10:00:00.000Z',
    ...overrides,
  };
}

/** A pid that is almost certainly free. Chosen above the default `pid_max` on Linux and macOS so
 * it cannot collide with a real process on the machine running the tests. */
const DEAD_PID = 4_294_967_000;

describe('isProcessAlive', () => {
  it('recognises this very process', () => {
    expect(isProcessAlive(process.pid)).toBe(true);
  });

  it('is false for a pid nothing is using, and for nonsense pids', () => {
    expect(isProcessAlive(DEAD_PID)).toBe(false);
    expect(isProcessAlive(0)).toBe(false);
    expect(isProcessAlive(-1)).toBe(false);
    expect(isProcessAlive(1.5)).toBe(false);
  });

  // `kill` reports EPERM for a live process owned by another user. Treating that as "not running"
  // would let a second instance start against a database the first one is still writing.
  it('counts a process owned by another user as alive', () => {
    const denied = () => {
      throw Object.assign(new Error('operation not permitted'), { code: 'EPERM' });
    };
    expect(isProcessAlive(1234, denied)).toBe(true);
  });
});

describe('acquireInstanceLock', () => {
  it('takes a free lock and writes a record a second instance can read', () => {
    const result = acquireInstanceLock(lockPath, record());

    expect(result.acquired).toBe(true);
    expect(readInstanceLock(lockPath)).toEqual(record());
  });

  it('refuses when the lock is held by a live process, and says who holds it', () => {
    acquireInstanceLock(lockPath, record());

    const second = acquireInstanceLock(lockPath, record({ port: 3001 }));

    expect(second.acquired).toBe(false);
    if (!second.acquired) expect(second.heldBy?.url).toBe('http://127.0.0.1:3000');
  });

  // A killed instance leaves its lock file behind. If that permanently blocked startup, a single
  // crash would take the app out until the user found and deleted a file they have never heard of.
  it('reclaims a lock whose owning process is gone', () => {
    writeFileSync(lockPath, JSON.stringify(record({ pid: DEAD_PID })));

    const result = acquireInstanceLock(lockPath, record());

    expect(result.acquired).toBe(true);
    expect(readInstanceLock(lockPath)?.pid).toBe(process.pid);
  });

  it('reclaims a corrupt lock rather than refusing to start over unparseable JSON', () => {
    writeFileSync(lockPath, 'not json at all');

    expect(acquireInstanceLock(lockPath, record()).acquired).toBe(true);
  });

  it('releases the lock file it took', () => {
    const result = acquireInstanceLock(lockPath, record());
    expect(result.acquired).toBe(true);
    if (!result.acquired) return;

    result.release();

    expect(existsSync(lockPath)).toBe(false);
  });
});

describe('releaseInstanceLock', () => {
  // A slow exit must not delete a lock that a newly started instance already took over after this
  // one's file was reclaimed as stale — that would leave the new instance unprotected.
  it('leaves a lock alone when it now belongs to a different process', () => {
    writeFileSync(lockPath, JSON.stringify(record({ pid: DEAD_PID })));

    releaseInstanceLock(lockPath, process.pid);

    expect(existsSync(lockPath)).toBe(true);
    expect(readInstanceLock(lockPath)?.pid).toBe(DEAD_PID);
  });

  it('is a no-op when there is no lock file', () => {
    expect(() => releaseInstanceLock(lockPath, process.pid)).not.toThrow();
  });
});

describe('readInstanceLock', () => {
  it('returns undefined for a missing file', () => {
    expect(readInstanceLock(join(lockPath, 'nope'))).toBeUndefined();
  });

  it('returns undefined for JSON that is not a lock record', () => {
    writeFileSync(lockPath, JSON.stringify({ unrelated: true }));
    expect(readInstanceLock(lockPath)).toBeUndefined();
  });

  it('round-trips what acquire wrote', () => {
    acquireInstanceLock(lockPath, record());
    expect(JSON.parse(readFileSync(lockPath, 'utf8'))).toEqual(record());
  });
});
