# 20 — CLI: boot the server, open the browser

Status: ready-for-agent
Milestone: 7 — Ship it
Blocked by: 19

How v1 is distributed and launched (ADR 0010). No desktop shell.

`bunx allsearch` (or `npx`) starts the Next.js production server on a free port
and opens the user's default browser at it. The real browser is the UI, which is
why streaming works without any of the embedded-webview problems that ruled out
Tauri.

**Requirements:**

- Build with `output: 'standalone'`; publish an npm package containing the
  standalone output, `.next/static` and `public/`.
- Choose a free port rather than assuming 3000; print the URL so the user can
  reopen it.
- Open the default browser cross-platform.
- Create the application data directory and database on first launch, then run
  migrations with a backup first (issue 04).
- Handle a second instance gracefully — either refuse with a clear message or
  focus the existing one. Two servers on one SQLite file is a corruption route.
- Clean shutdown on Ctrl-C, including any in-flight Collection Run: mark the run
  interrupted so it resumes rather than looking failed (issue 10).
- `--port`, `--no-open`, `--version`.

**Runtime is Node, toolchain is Bun.** `bun install`, `bun run` and `bun test`
stay. Running the server under Bun is rejected: there is an open memory leak
where JSC's garbage collector fails to reclaim heap under Next.js SSR load, which
is disqualifying for a long-lived process.

No Homebrew formula is planned.

## Done when

- `bunx allsearch` on a clean machine with no repository checkout reaches
  onboarding in a browser.
- The port is free-chosen and printed.
- Ctrl-C leaves a resumable, not failed, run.

## Comments

- Implemented. `bunx allsearch` boots the standalone Next.js server on a free port,
  prints the URL and opens the default browser at it. Entry point is `cli/index.ts`,
  bundled to `dist/cli.mjs` by `bun run build:cli` (`scripts/buildCli.ts`).

- **The server runs in the CLI's own process**, not as a child. Ctrl-C then becomes one
  ordered sequence — return any in-flight Collection Run to `pending`, drop the lock, exit
  — instead of a signal relay between two processes that can each exit at the wrong moment.
  `NEXT_MANUAL_SIG_HANDLE=1` stops Next installing its own handlers, whose async cleanup
  ends in `process.exit()` and would otherwise race the database write.

- **`libs/shutdown.ts` is the seam between the two halves.** The CLI owns the signal but the
  work is server-side, and the two cannot import each other: the server is a pre-bundled
  `.next/standalone/server.js` with its own module graph, so a module-level array would be
  two arrays. The registry hangs off `globalThis` under a `Symbol.for` key instead, which
  both bundles resolve identically. `instrumentation.ts` registers the one hook.

- **`resumeInterruptedCollectionRuns` became `releaseRunningCollectionRuns`** and is now
  called from both ends of the process's life. Neither call subsumes the other: a `kill -9`
  never reaches the shutdown path, and a machine that never restarts the app never reaches
  the boot path. Verified end to end — a `running` Run row was `pending` after SIGINT, and
  after SIGTERM.

- **Binds `127.0.0.1` only.** The database holds provider keys in plaintext and the app has
  no authentication anywhere, so Next's `0.0.0.0` default would publish a user's keys and
  Brand data to their whole network.

- **Port**: `--port` is honoured exactly or refused (silently relocating a pinned port breaks
  whatever it was pinned for), otherwise 3000 upwards for 20 candidates, then an OS-assigned
  ephemeral port so the app always starts.

- **Second instance** is refused, not focused — there is no window to focus, and refusing is
  the safe half of the requirement's "either". The lock is an `O_EXCL` file next to the
  database (not next to the binary: the corruption risk is per database file, and
  `ALLSEARCH_DB_PATH` can move it). A lock left by a killed process names a dead pid and is
  reclaimed; `EPERM` from `kill(pid, 0)` counts as alive, since that is another user's live
  process.

- **Packaging.** `output: 'standalone'`, plus `scripts/buildCli.ts` copying `.next/static` and
  `public/` in (Next leaves them out, assuming a CDN) and pruning the rest. The tracer copies
  the entire repository into `.next/standalone/` — sources, tests, docs — because drizzle-orm's
  `readMigrationFiles()` does a `readdirSync()` it cannot resolve and its fallback is to claim
  the project root. `outputFileTracingExcludes` does not fix it: Next applies those per _route_,
  and the trace doing the claiming is `instrumentation.js`, which is not a route. The prune is
  an allowlist, so a newly added top-level directory is dropped by default rather than shipped.

- Migrations ship once, at the package root, with the CLI pointing `ALLSEARCH_MIGRATIONS_DIR`
  at them. The standalone server `chdir`s into its own directory before any of our code runs,
  so neither `process.cwd()` nor `import.meta.dirname` could have found them.

- **Verified:** `bun lint`, `bun tsc`, `bun test` (676 pass) clean. `npm pack` → 29 MB tarball
  → `npm install` into an empty directory with no repository checkout → `./node_modules/.bin/allsearch`
  → migrations ran, `/` redirected to `/organization` (onboarding) with 200, CSS and static
  chunks served. Ctrl-C and SIGTERM both printed the shutdown line, released the lock and left
  a resumable Run. The one part of "Done when" that cannot be verified here is `bunx allsearch`
  against the real registry, which needs a publish.

- **`private: true` was removed from `package.json`** so the package can be published, which is
  what `bunx allsearch` requires (ADR 0010 names npm as the distribution channel). Worth a
  maintainer's eye before the first publish: the name `allsearch` may be taken on npm, and
  publishing puts the compiled Untitled UI code in public view while ADR 0005 is still open.

- **Not done here:** the published package still declares the full `dependencies` list, so
  `npm install` resolves ~550 packages that the bundled `.next/standalone/node_modules`
  already contains. Harmless (resolution finds the bundled copy first) but wasteful; trimming
  it means proving the trace missed nothing, which is a separate piece of work.
