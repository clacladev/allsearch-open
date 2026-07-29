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

Use helpers from `libs/env.ts` — never check `process.env.NODE_ENV` directly:

```ts
import { isProdEnv, isDevEnv, isPreviewEnv } from '@/libs/env';
```

## Database Access

- Queries and types are organized by table under `/libs/database/`.
- Use the Supabase client from `/libs/supabase/` (separate server and browser clients).
- Migrations live in `/supabase/migrations/`.

## UI Pattern Reuse

- Before implementing a UI pattern, always read the existing implementation of that same pattern in the codebase first. For example, check how onboarding steps handle Retry buttons before building one in a slideout. This ensures consistency and avoids unnecessary iterations.

## Data Fetching

- Fetch in Server Components or Route Handlers by default.
- Use `SWR` for client-side data fetching and caching.
- Backend logic goes in Next.js Route Handlers under `/app/api`.
