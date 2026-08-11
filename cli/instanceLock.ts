import { readFileSync, rmSync, writeFileSync } from 'node:fs';

/** What a running instance records so a second one can explain itself to the user. */
export type InstanceLockRecord = {
  pid: number;
  port: number;
  url: string;
  startedAt: string;
};

export type AcquiredLock = { acquired: true; release: () => void };
export type RefusedLock = { acquired: false; heldBy: InstanceLockRecord | undefined };
export type LockResult = AcquiredLock | RefusedLock;

/** Whether a process with this pid still exists. `kill(pid, 0)` performs the permission and
 * existence checks without delivering a signal; `EPERM` means the process exists but belongs to
 * another user, which still counts as alive. */
export function isProcessAlive(
  pid: number,
  kill: (pid: number, signal: number) => void = process.kill.bind(process)
): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException)?.code === 'EPERM';
  }
}

/** Reads a lock file, returning `undefined` if it is missing, unreadable, or not a lock record
 * this version wrote. A corrupt lock is treated as no lock: the file is only ever a hint about
 * who is running, and refusing to start because of unparseable JSON would be worse than the
 * problem it guards. */
export function readInstanceLock(lockPath: string): InstanceLockRecord | undefined {
  let raw: string;
  try {
    raw = readFileSync(lockPath, 'utf8');
  } catch {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const record = parsed as Partial<InstanceLockRecord>;
    if (typeof record.pid !== 'number' || typeof record.url !== 'string') return undefined;
    return {
      pid: record.pid,
      port: typeof record.port === 'number' ? record.port : 0,
      url: record.url,
      startedAt: typeof record.startedAt === 'string' ? record.startedAt : '',
    };
  } catch {
    return undefined;
  }
}

/** Takes the single-instance lock that sits next to the database file.
 *
 * Two servers writing one SQLite file is a corruption route (issue 20), and the app opens its
 * database in WAL mode from a long-lived process, so the second instance is refused rather than
 * allowed to race. The file is created with `wx`, whose create-or-fail is atomic in the
 * filesystem, so two instances starting in the same instant cannot both believe they won.
 *
 * A lock left behind by a killed process (no clean exit, so no release) names a pid that no
 * longer exists; that case is detected, the stale file removed, and the lock retried once. The
 * retry is deliberately not a loop: a second `EEXIST` means a live instance created the file in
 * between, which is exactly the case this guard exists for. */
export function acquireInstanceLock(lockPath: string, record: InstanceLockRecord): LockResult {
  const write = () =>
    writeFileSync(lockPath, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx', mode: 0o600 });

  try {
    write();
    return { acquired: true, release: () => releaseInstanceLock(lockPath, record.pid) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') throw error;
  }

  const existing = readInstanceLock(lockPath);
  if (existing && isProcessAlive(existing.pid)) return { acquired: false, heldBy: existing };

  // Stale (or unreadable) lock: its owner is gone, so reclaim it.
  try {
    rmSync(lockPath, { force: true });
    write();
    return { acquired: true, release: () => releaseInstanceLock(lockPath, record.pid) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') throw error;
    return { acquired: false, heldBy: readInstanceLock(lockPath) };
  }
}

/** Removes the lock file, but only when it still belongs to `pid`. Without the ownership check, a
 * slow exit could delete a lock that a newly started instance had already taken over after this
 * one's file was reclaimed as stale, leaving that instance unprotected. */
export function releaseInstanceLock(lockPath: string, pid: number): void {
  try {
    const existing = readInstanceLock(lockPath);
    if (existing && existing.pid !== pid) return;
    rmSync(lockPath, { force: true });
  } catch {
    // Best-effort: a lock file we failed to delete is reclaimed as stale by the next start.
  }
}
