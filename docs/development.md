# Development guide

This guide is for contributors working from a source checkout. For installing
and running AllSearch, start with the [README](../README.md).

## Set up a local development environment

```bash
bun install
bun run db:seed:demo # Optional: migrate and load demo data
bun dev
```

Open the URL Next.js prints (normally `http://localhost:3000`). Database
migrations run when the server starts through `instrumentation.ts`. Skip the
seed command if you want to test the empty-state onboarding flow.

### Demo data

```bash
bun run db:seed:demo            # Refuses when the database has user data
bun run db:seed:demo -- --force # Wipes user rows, then re-seeds
```

After seeding, the dashboard opens with sample Projects instead of onboarding.

### Development database

The standard database locations and the `ALLSEARCH_DB_PATH` override are in the
[README](../README.md#your-data). Tests and local experiments commonly set that
variable to use an isolated database.

## Everyday commands

```bash
bun lint                 # ESLint
bun tsc                  # Typecheck
bun prettier             # Format with Prettier
bun test                 # Unit tests
bun test:watch           # Unit tests in watch mode
bun test:coverage        # Unit tests with coverage
bun test:e2e             # Playwright's standard browser suite
bun test:e2e:ai          # On-demand AI-tagged Playwright specs
bun test:e2e:visual      # Screenshot regression suite
bun test:e2e:ui          # Interactive Playwright UI
bun run verify:providers # Smoke-check configured providers
```

See [all commands](./commands.md) for the full command reference, including
database and package commands.

### End-to-end tests

`bun test:e2e` builds a golden SQLite database from
`scripts/fixtures/demo-data.json`. Each test gets its own copy and local
production server, so no manually started server, login, or provider key is
needed. The tests can run in parallel.

Specs tagged `@ai` are excluded because they exercise generation flows. Run
them on demand with `bun test:e2e:ai` and a live provider key when required;
this keeps normal test runs free of provider costs and network flakiness.

## Database changes

1. Edit `libs/database/schema.ts`.
2. Run `bun run db:generate`.
3. Review the generated SQL under `drizzle/`.
4. Start the app (or run `bun run db:seed:demo`) to apply the forward-only
   migration. The migration process creates a backup first.

For the underlying data-access rules, see [Key patterns](./patterns.md) and
[ADR 0006](./adr/0006-sqlite-with-drizzle.md).

## Codebase references

- [Development guidelines](./development-guidelines.md) — package manager, code style, component, and testing conventions.
- [Key patterns](./patterns.md) — routing, environment detection, data access, and fetching rules.
- [Project structure](./project-structure.md) — directory and key-file map.
- [Tech stack](./tech-stack.md) — framework and dependency choices.
- [Domain language](../CONTEXT.md) — product terminology.
- [Architecture decisions](./adr/) — recorded design decisions.
- [Agent instructions](../AGENTS.md) — issue tracker and repository-specific guidance.
