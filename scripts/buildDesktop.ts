/** Stages the Electron main bundle and its executable Next standalone server outside ASAR. */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const STANDALONE_DIR = join(REPO_ROOT, '.next', 'standalone');
const DESKTOP_DIR = join(REPO_ROOT, 'dist', 'desktop');

export async function main(): Promise<void> {
  requireStandaloneBuild();
  rmSync(DESKTOP_DIR, { recursive: true, force: true });
  mkdirSync(DESKTOP_DIR, { recursive: true });
  await bundleMain();
  stageRuntimeAssets();
  console.log(`build:desktop: staged Electron assets in ${DESKTOP_DIR}`);
}

function requireStandaloneBuild(): void {
  const serverEntry = join(STANDALONE_DIR, 'server.js');
  if (existsSync(serverEntry)) return;
  throw new Error(`No standalone server at ${serverEntry}. Run \`bun run build\` first.`);
}

async function bundleMain(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(REPO_ROOT, 'desktop', 'main.ts'), join(REPO_ROOT, 'cli', 'serverRunner.ts')],
    outdir: DESKTOP_DIR,
    naming: '[name].cjs',
    target: 'node',
    format: 'cjs',
    external: ['electron'],
  });
  if (result.success) return;
  for (const log of result.logs) console.error(log);
  throw new Error('build:desktop: bundling desktop/main.ts failed.');
}

function stageRuntimeAssets(): void {
  cpSync(STANDALONE_DIR, join(DESKTOP_DIR, 'standalone'), { recursive: true, force: true });
  cpSync(join(REPO_ROOT, 'drizzle'), join(DESKTOP_DIR, 'drizzle'), { recursive: true, force: true });
  const expected = [
    join(DESKTOP_DIR, 'main.cjs'),
    join(DESKTOP_DIR, 'serverRunner.cjs'),
    join(DESKTOP_DIR, 'standalone', 'server.js'),
    join(DESKTOP_DIR, 'drizzle'),
  ];
  const missing = expected.filter((path) => !existsSync(path));
  if (missing.length > 0) throw new Error(`build:desktop: staging failed; missing ${missing.join(', ')}.`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
