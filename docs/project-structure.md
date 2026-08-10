# Project Structure

```
/app
  (private)/      # Authenticated routes (dashboard, project, account, admin)
  (public)/       # Marketing pages (landing, blog, legal)
  (landing-page)/ # Landing page route group
  (new-project)/  # Multi-step new project wizard
  api/            # Route Handlers
/components
  application/    # App-specific components
  base/           # Generic reusable components
  foundations/    # Design system primitives
/libs
  /database/      # Table-scoped query files and TypeScript types
  /supabase/      # Supabase client (server + browser)
  routes.ts       # All route constants (ROUTES) and RouteHelper
  env.ts          # Environment detection helpers
/supabase
  /migrations/    # SQL migration files
/public           # Static assets
config.ts         # Central app config (name, domain, auth URLs, LemonSqueezy IDs)
proxy.ts          # Vercel dev proxy configuration
```

## Key Files

| File / Folder         | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `config.ts`           | Central app config — name, description, brand colour, SEO keywords |
| `libs/routes.ts`      | All route constants (`ROUTES`) and `RouteHelper`         |
| `libs/env.ts`         | `isDevEnv` — gates developer-only surfaces on `NODE_ENV`  |
| `libs/database/`      | Table-scoped Supabase query files and TypeScript types   |
| `libs/supabase/`      | Supabase client instances (server + browser)             |
| `supabase/migrations/`| SQL migration files                                      |
