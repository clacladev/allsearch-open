# 17 — Configuration and routing cleanup

Status: ready-for-agent
Milestone: 5 — Onboarding
Blocked by: 16

The remnants of running on three hosted environments. Small, scattered, and it
will confuse every future reader if left.

**`config.ts`** — `domainName` switches between `localhost:3000`,
`mirage.allsearch.io` and `allsearch.io`; there is a `lemonsqueezy` block whose
product IDs are all the string `'TBD'`; `auth.loginUrl` and `auth.callbackUrl`
point at routes that no longer exist; `email.*` addresses go nowhere now that
nothing sends mail. Reduce to what a local app actually needs: app name,
description, brand colour. Keep the `keywords` array only if the project site
(issue 23) reuses it.

**`libs/env.ts`** — `isProdEnv` / `isPreviewEnv` / `isDevEnv` /
`isPreProductionEnv` derive from `NEXT_PUBLIC_VERCEL_ENV`. There is one
environment now. Keep only a development flag if something still needs it, and
remove the rest along with the guards that used them.

**`libs/routes.ts`** — `RouteHelper` still lists signin, blog, pricing, ToS,
privacy and `API.SEARCH_CREATE`, which was dead even in the SaaS. Prune to
surviving routes. The house rule that URLs are built with `RouteHelper` and never
by hand stays.

**`next.config.ts`** — remove the PostHog `/ingest` rewrites, the
`cdn.lemonsqueezy.com` remote image pattern, and `withWorkflow` if issue 11 left
it. Keep `serverExternalPackages` for `pdfmake`, `pdfkit` and `html-to-docx` —
the exporters need it.

**`app/api/new-project/*`** — verify each route works on the new provider layer
and the new query layer: `domain-metadata`, `topics-ideas`, `prompt-ideas`,
`competitors`, `save`. `report` is superseded by issue 12; delete it.

## Done when

- No reference to Vercel environments, LemonSqueezy, PostHog or magic auth
  remains in configuration.
- `bun run build` and `bun run lint` pass.
- Onboarding still completes end to end.
