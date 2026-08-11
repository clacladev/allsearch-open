# Project Structure

```
/app
  (private)/      # Authenticated-style app shell (dashboard, project, settings)
  (new-project)/  # Multi-step new project wizard
  api/            # Route Handlers
/components
  application/    # App-specific components
  base/           # Generic reusable components
  foundations/    # Design system primitives
  collection-run/ # Collection Run UI
/libs
  /database/      # Drizzle schema, client, migrate, table-scoped queries + types
  /collection/    # Collection Run loop, progress, cadence
  /ai/            # Provider calls, articles, ideas generation
  routes.ts       # Route constants (ROUTES) and RouteHelper
  env.ts          # isDevEnv and related helpers
/drizzle          # SQL migrations (forward-only; applied on boot)
/scripts          # db:seed:demo, db:snapshot, verifyProviders
/tests
  unit/           # bun test
  e2e/            # Playwright
/docs             # Stack, patterns, ADRs, agent tracker docs
config.ts         # Central app config (name, domain, copy)
CONTEXT.md        # Domain language
DESIGN.md         # UI system
```

## Key files

| File / folder | Purpose |
| ------------- | ------- |
| `config.ts` | App name, description, brand colour, SEO keywords |
| `instrumentation.ts` | On boot: open DB, migrate, resume Collection Runs |
| `libs/routes.ts` | `ROUTES` + `RouteHelper` |
| `libs/env.ts` | `isDevEnv` (`NODE_ENV`) |
| `libs/database/schema.ts` | Drizzle schema source of truth |
| `libs/database/client.ts` | SQLite client (`node:sqlite` / `bun:sqlite`) |
| `libs/database/paths.ts` | Default DB path + `ALLSEARCH_DB_PATH` |
| `drizzle/` | Generated migrations |
| `CONTEXT.md` | Ubiquitous language |
