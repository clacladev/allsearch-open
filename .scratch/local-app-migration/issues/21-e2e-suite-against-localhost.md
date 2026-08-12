# 21 — E2E suite against localhost

Status: ready-for-agent
Milestone: 7 — Ship it
Blocked by: 20

Restore Playwright coverage of the dashboard flows, driving the Next.js server
directly. The desktop shell is never launched in CI — the shell is a window
around something Playwright already knows how to test (ADR 0008).

**Delete** `tests/e2e/global.setup.ts` and `tests/e2e/helpers/auth.ts`; they exist
only to obtain a session through the magic-auth backdoor. Remove the `setup`
project, the `storageState` and the auth file from `playwright.config.ts`. Delete
`auth.spec.ts` and `ai-visibility-tracker.spec.ts` (a deleted marketing page).
Rewrite `ai-crawl-checker.spec.ts` for its new home (issue 18).

**Keep and port**, minus login: `navigation`, `overview`, `prompts`, `sources`,
`brands`, `opportunities`, `settings`, `new-article`, `onboarding`.

**Fixtures get much better.** Instead of a running local Supabase with seed data,
copy a golden `.db` file per test and point the app's database path at it. That
also unblocks real parallelism — the suite runs `fullyParallel: false, workers: 3`
today only because every spec shares one database. Build the golden database from
a script so it can be regenerated when the schema changes.

`baseURL` becomes `http://localhost:PORT`; drop `ignoreHTTPSErrors` and the
`--experimental-https` dev flag along with `certificates/`.

**AI-dependent specs are excluded from the default run.** There is no fake
provider (ADR 0008), so `onboarding.spec.ts` and anything invoking generation
makes real, billable, flaky provider calls. Tag them and run them on demand with
a live key. The continuously-green suite is the unit tests plus the specs that
never touch a provider — say so in the README so the gap is known rather than
assumed covered.

## Done when

- The non-AI specs pass against a golden database with no auth setup.
- Specs run in parallel.
- AI-dependent specs are tagged, excluded by default, and documented.

## Comments

- Implemented: `bun test:e2e` regenerates a golden SQLite image from the demo fixture, builds the
  production app, then gives every Playwright test its own database copy, loopback server and port.
  The default Chromium project is fully parallel (three workers) with no auth setup or HTTPS.

- Deleted the magic-auth setup/helpers/spec and obsolete marketing-page spec; moved crawl-checker
  coverage to the project-scoped Crawl health page. Onboarding and article-generation coverage are
  tagged `@ai`, excluded from the default command and available via `bun test:e2e:ai`.

- Verified with `bun test:e2e` (53 passed), `bun lint`, and `bun tsc`.
