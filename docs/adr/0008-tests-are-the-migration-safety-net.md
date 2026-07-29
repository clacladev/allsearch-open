# Tests are the migration safety net, and e2e bypasses the desktop shell

Around 30 of the SaaS's 40 unit test files port unchanged, because they test pure
functions over row arrays and offline HTML fixtures rather than infrastructure.
The seven files under `tests/unit/project-analysis/` are the only executable
specification of the visibility, ranking, sentiment and opportunity logic, which
is the part of this product that took longest to get right and is easiest to
break silently during a database migration.

So the first milestone is to import the code and get those tests green *before*
changing anything, and to keep them green through the Supabase to SQLite swap.
Nothing else provides confidence over a port of this size.

For end-to-end tests, we drive the Next.js server directly at `localhost` and
never launch the desktop shell in CI. Because the desktop app is a Next.js server
inside a webview, the shell is a window around something Playwright already knows
how to test. This avoids Tauri's WebDriver and Electron's Playwright integration
entirely, and holds regardless of which shell we pick.

## Consequences

- The Playwright auth setup project, `tests/e2e/global.setup.ts` and
  `tests/e2e/helpers/auth.ts` are deleted outright: they exist only to obtain a
  session through the magic-auth backdoor.
- SQLite replaces a running local Supabase for fixtures. Tests copy a golden
  database file per run, which finally allows real parallelism: the suite runs
  `fullyParallel: false` today only because every spec shares one database.
- **A fake AI provider was considered and rejected.** The consequence is
  accepted deliberately: `onboarding.spec.ts` and the other AI-dependent specs
  make real provider calls, so they cost money, they are flaky, and they cannot
  run in CI without a live key. They are therefore run locally on demand rather
  than on every push, and the continuously-green suite is the unit tests plus the
  e2e specs that do not touch a provider. Revisit if CI coverage of onboarding
  turns out to matter.
- Deleted with their subjects: `auth.spec.ts`, `ai-visibility-tracker.spec.ts`
  (a marketing page), `magic-auth`, `verifyWebhookSignature`, `opengraph`.
