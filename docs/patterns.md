# Key Patterns

## Route Navigation

Always use `RouteHelper` to build URLs — never construct paths manually:

```ts
// ✅ Correct
RouteHelper.Project.getOverview(projectId)
RouteHelper.Project.getPromptDetails(projectId, promptId, startDate, endDate)

// ❌ Wrong
`/project/${projectId}`
```

All route constants live in `ROUTES` (`libs/routes.ts`).

## Environment Detection

There is one environment. `isDevEnv` (from `libs/env.ts`) gates developer-only
surfaces on `NODE_ENV !== 'production'`; never reach for `process.env.NODE_ENV`
directly:

```ts
import { isDevEnv } from '@/libs/env';
```

## Database Access

- Queries and types are organized by table under `/libs/database/`.
- Data access goes through Drizzle on SQLite (ADR 0006).

## UI Pattern Reuse

- Before implementing a UI pattern, always read the existing implementation of that same pattern in the codebase first. For example, check how onboarding steps handle Retry buttons before building one in a slideout. This ensures consistency and avoids unnecessary iterations.

## Data Fetching

- Fetch in Server Components or Route Handlers by default.
- Use `SWR` for client-side data fetching and caching.
- Backend logic goes in Next.js Route Handlers under `/app/api`.
