/**
 * `bun run build:cli` — turns a completed `next build` into something `bunx allsearch` can run.
 *
 * Three jobs:
 *
 *  1. Bundle `cli/` to `dist/cli.mjs` with a Node shebang. The published package is executed by
 *     whatever `bunx`/`npx` finds on the user's PATH, so the entry point has to be plain Node
 *     JavaScript rather than the TypeScript the repo is written in.
 *  2. Copy `.next/static` and `public/` into `.next/standalone/`. Next.js deliberately leaves
 *     these out of the standalone trace — it assumes a CDN serves them — so without this step the
 *     app boots with no CSS, no client JS and no images.
 *  3. Prune everything else out of `.next/standalone/`. See {@link STANDALONE_KEEP}.
 *
 * The migrations under `drizzle/` are not copied into `dist/`: they ship at the package root and
 * the CLI points `ALLSEARCH_MIGRATIONS_DIR` straight at them, which keeps one copy rather than
 * two that can drift.
 *
 * Run: bun run build:cli   (after `bun run build`)
 */

import { cpSync, existsSync, readdirSync, readlinkSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const STANDALONE_DIR = join(REPO_ROOT, '.next', 'standalone');
const DIST_DIR = join(REPO_ROOT, 'dist');

/** The only entries `.next/standalone/` is allowed to contain once this script has run.
 *
 * Next's file tracer copies the entire repository in — sources, tests, docs, `.scratch/` — because
 * drizzle-orm's `readMigrationFiles()` does a `readdirSync()` the tracer cannot resolve, and its
 * fallback for an unresolvable read is to claim the whole project root (see `next.config.ts`).
 * None of it is read at runtime: the server runs the compiled bundles under `.next/server/`.
 *
 * An allowlist rather than a list of things to delete, so a newly added top-level directory is
 * pruned by default instead of silently shipping. The entries are: the compiled server and its
 * entry point, the `package.json` Next writes beside it (which fixes the module type the server
 * is loaded as), the pruned `node_modules` the trace produced, the static assets the server
 * serves from disk. Migration SQL is deliberately kept at the package root, outside the
 * standalone runtime tree, and the launcher passes that path to the server explicitly. */
const STANDALONE_KEEP = new Set([
  '.next',
  'node_modules',
  'package.json',
  'public',
  'server.js',
]);

export async function main(): Promise<void> {
  requireNextBuild();
  await bundleCli();
  prepareStandaloneRuntimeAssets();
  console.log('build:cli: done — run `bunx allsearch` (or `node dist/cli.mjs`) to start the app.');
}

/** The standalone server is what the CLI boots, so a missing one means `next build` has not run
 * (or ran without `output: 'standalone'`). Caught here, with the fix in the message, rather than
 * producing a `dist/cli.mjs` that fails for the user later. */
function requireNextBuild(): void {
  if (existsSync(join(STANDALONE_DIR, 'server.js'))) return;
  throw new Error(
    `No standalone server at ${join(STANDALONE_DIR, 'server.js')}. Run \`bun run build\` first.`
  );
}

async function bundleCli(): Promise<void> {
  rmSync(DIST_DIR, { recursive: true, force: true });

  const result = await Bun.build({
    entrypoints: [join(REPO_ROOT, 'cli', 'index.ts')],
    outdir: DIST_DIR,
    naming: 'cli.mjs',
    target: 'node',
    format: 'esm',
    banner: '#!/usr/bin/env node',
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error('build:cli: bundling cli/index.ts failed.');
  }

  const runner = await Bun.build({
    entrypoints: [join(REPO_ROOT, 'cli', 'serverRunner.ts')],
    outdir: DIST_DIR,
    naming: 'serverRunner.cjs',
    target: 'node',
    format: 'cjs',
  });
  if (!runner.success) {
    for (const log of runner.logs) console.error(log);
    throw new Error('build:cli: bundling cli/serverRunner.ts failed.');
  }

  // `bin` entries are symlinked, not copied, by npm/bun — the link target itself has to be
  // executable or the shell reports "permission denied" instead of running it.
  await Bun.$`chmod +x ${join(DIST_DIR, 'cli.mjs')}`;
  console.log(`build:cli: bundled cli/index.ts -> ${join(DIST_DIR, 'cli.mjs')}`);
}

/** Adds the assets Next's standalone trace intentionally omits, then removes everything that is
 * not required to run that server. Both the CLI package and desktop resources consume this exact
 * tree, so keeping the preparation here prevents their runtime contents from drifting. */
export function prepareStandaloneRuntimeAssets(): void {
  copyStaticAssets();
  pruneStandalone();
  dereferenceStandaloneSymlinks();
  assertServerDependencies();
}

function copyStaticAssets(): void {
  const copies: Array<{ from: string; to: string }> = [
    { from: join(REPO_ROOT, '.next', 'static'), to: join(STANDALONE_DIR, '.next', 'static') },
    { from: join(REPO_ROOT, 'public'), to: join(STANDALONE_DIR, 'public') },
  ];

  for (const { from, to } of copies) {
    if (!existsSync(from)) {
      console.warn(`build:cli: nothing to copy from ${from} — skipped.`);
      continue;
    }
    // `force` because the file tracer may already have placed some of these; the freshly built
    // copies are the authoritative ones.
    cpSync(from, to, { recursive: true, force: true });
    console.log(`build:cli: copied ${from} -> ${to}`);
  }
}

/** Deletes everything in `.next/standalone/` that is not in {@link STANDALONE_KEEP}, logging what
 * went so an unexpected entry shows up in the build output rather than in a published tarball. */
function pruneStandalone(): void {
  const pruned = readdirSync(STANDALONE_DIR).filter((entry) => !STANDALONE_KEEP.has(entry));
  if (pruned.length === 0) return;

  for (const entry of pruned) {
    rmSync(join(STANDALONE_DIR, entry), { recursive: true, force: true });
  }
  console.log(`build:cli: pruned ${pruned.length} untraced entries from .next/standalone/:`);
  console.log(`  ${pruned.sort().join(', ')}`);
}

/** Replaces every symlink in the standalone tree with a real copy of its target.
 *
 * Next's file tracer preserves `node_modules` entries as symlinks when it copies the trace, and
 * under some installs (bun, pnpm) those symlinks carry absolute targets rooted at the build
 * machine. `cpSync` copies symlinks verbatim, so a bundle that ships them then moves to another
 * machine (a DMG download, an npm tarball) ends up with dead links — `server.js` cannot resolve
 * `require('next')` and the server never starts. Dereferencing makes the bundle self-contained.
 */
function dereferenceStandaloneSymlinks(): void {
  const stack = [STANDALONE_DIR];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const child of readdirSync(dir, { withFileTypes: true })) {
      const childPath = join(dir, child.name);
      if (child.isSymbolicLink()) {
        const target = resolve(dir, readlinkSync(childPath));
        if (!existsSync(target)) {
          console.warn(`build:cli: broken symlink left as-is (missing target): ${childPath} -> ${target}`);
        } else {
          rmSync(childPath, { force: true });
          cpSync(target, childPath, { recursive: true, force: true, dereference: true });
        }
      } else if (child.isDirectory()) {
        stack.push(childPath);
      }
    }
  }
}

/** The standalone server boots by `require('next')`, so a bundle without `node_modules/next` can
 * never start. Next's tracer normally copies it; failing loudly here beats shipping a DMG that
 * times out with "Cannot find module 'next'" on the user's machine. */
function assertServerDependencies(): void {
  const missing = ['next']
    .map((pkg) => join(STANDALONE_DIR, 'node_modules', pkg, 'package.json'))
    .filter((path) => !existsSync(path));
  if (missing.length > 0) {
    throw new Error(
      `build:cli: standalone server is missing required packages: ${missing.join(', ')}. ` +
        'Re-run `bun install` and `bun run build` so the trace picks up node_modules/next.'
    );
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
