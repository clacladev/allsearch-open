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
