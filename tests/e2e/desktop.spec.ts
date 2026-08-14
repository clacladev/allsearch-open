import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { test, expect, _electron as electron } from '@playwright/test';

test('desktop shell serves hydrated assets, preserves its configured database, and cleans up on window close', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'allsearch-desktop-'));
  const databasePath = join(directory, 'allsearch.db');
  writeFileSync(databasePath, '');
  const databaseInode = statSync(databasePath).ino;
  const app = await electron.launch({
    args: [resolve(process.cwd(), 'dist', 'desktop', 'main.cjs')],
    env: { ...process.env, ALLSEARCH_DB_PATH: databasePath },
  });
  let closed = false;
  try {
    const page = await app.firstWindow();
    await expect(page).toHaveURL(/http:\/\/127\.0\.0\.1:\d+\//);
    const stylesheet = page.locator('link[rel="stylesheet"][href*="/_next/static/"]').first();
    const clientScript = page.locator('script[src*="/_next/static/"]').first();
    await expect(stylesheet).toBeAttached();
    await expect(clientScript).toBeAttached();
    await expect(page.locator('input').first()).toBeVisible();
    await page.locator('input').first().fill('desktop client is hydrated');
    await expect(page.locator('input').first()).toHaveValue('desktop client is hydrated');
    const stylesheetHref = await stylesheet.getAttribute('href');
    const clientScriptSrc = await clientScript.getAttribute('src');
    expect(stylesheetHref).not.toBeNull();
    expect(clientScriptSrc).not.toBeNull();
    if (!stylesheetHref || !clientScriptSrc) throw new Error('Desktop page did not load its client assets.');
    expect(await page.evaluate((href) => fetch(href).then((response) => response.ok), stylesheetHref)).toBe(true);
    expect(await page.evaluate((src) => fetch(src).then((response) => response.ok), clientScriptSrc)).toBe(true);

    // This is a real separate CLI process, not a second runtime object in the same test process.
    const cli = spawn(process.execPath, [resolve(process.cwd(), 'dist', 'cli.mjs'), '--no-open'], {
      env: { ...process.env, ALLSEARCH_DB_PATH: databasePath },
      stdio: 'ignore',
    });
    const cliExitCode = await new Promise<number | null>((resolveExit) => cli.once('exit', resolveExit));
    expect(cliExitCode).toBe(1);

    const electronExit = new Promise<void>((resolveExit) => app.process().once('exit', () => resolveExit()));
    await page.close();
    await electronExit;
    closed = true;
    expect(existsSync(join(directory, 'allsearch.lock'))).toBe(false);
    expect(statSync(databasePath).ino).toBe(databaseInode);
    expect(statSync(databasePath).size).toBeGreaterThan(0);
  } finally {
    if (!closed) await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
