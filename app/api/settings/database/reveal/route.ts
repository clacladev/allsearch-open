import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
import { getDatabaseFileInfo } from '@/libs/database/paths';
import { getRevealCommand } from '@/libs/utils/fileManager';
import type { RevealDatabaseResponse } from '../types';

export const runtime = 'nodejs';

/** Opens the database's folder in the operating system's file manager.
 *
 * This route takes no input at all: the path comes from `getDatabaseFileInfo()` on the server, so
 * a request body can never steer which file gets opened. The command is spawned with an argument
 * array and no shell (`libs/utils/fileManager.ts`). */
export async function POST() {
  const { path, directory } = getDatabaseFileInfo();

  try {
    const { command, args } = getRevealCommand(process.platform, path);

    await new Promise<void>((resolve, reject) => {
      // `detached` so the file manager outlives this request, and stdio ignored so a chatty
      // launcher cannot fill the server's pipes and wedge the child.
      const child = spawn(command, args, { detached: true, stdio: 'ignore' });
      // Resolve on `spawn` rather than immediately: a missing launcher (common on headless Linux,
      // where there is no `xdg-open`) surfaces as an async `error` event, so returning early would
      // report success for a file manager that never opened.
      child.once('error', reject);
      child.once('spawn', () => {
        child.unref();
        resolve();
      });
    });

    const response: RevealDatabaseResponse = { directory };
    return NextResponse.json(response);
  } catch (error) {
    // Headless machines have no file manager to open. That is an expected outcome rather than a
    // bug, and the UI falls back to showing the path for copying.
    console.error(error);
    return NextResponse.json(
      { error: `Could not open a file manager. The database is at ${directory}` },
      { status: 500 }
    );
  }
}
