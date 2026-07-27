# 02 — Delete the SaaS surface

Status: ready-for-agent
Milestone: 0 — Import and safety net
Blocked by: 01

Roughly 18,000 lines that exist only because this was a hosted multi-tenant
product. Delete in reviewable commits, one group at a time.

| Delete | Approx lines |
|---|---|
| `app/(public)/` marketing pages, incl. `PricingCards` | 7,000 |
| `app/(landing-page)/` | 400 |
| `app/_blog/` and `app/blog/` (already unrouted) | 770 |
| `app/signin/`, `app/api/auth/`, `app/api/admin/magic-auth/`, `proxy.ts` | 300 |
| `app/(private)/subscription/`, `app/api/lemonsqueezy/`, `app/api/webhook/`, `libs/lemonsqueezy.ts`, `libs/subscriptions/` | 700 |
| `app/(private)/admin-panel/` | 400 |
| `libs/database/UserProfiles/`, `libs/database/UserSessions/`, `supabase/` | 900 |
| PostHog (`libs/posthog.ts`, `instrumentation-client.ts`, `@posthog/ai` tracing, `/ingest` rewrites), Crisp, Vercel Analytics, Speed Insights, GTM, OpenTelemetry | 300 |
| `libs/seo.tsx`, `sitemap.ts`, `robots`, `app/api/opengraph-image/`, `vercel.ts`, `backup_dump.sh`, `import_project.sh` | 500 |
| `app/(public)/ai-product-prompt-ideas/` and `app/api/tools/ai-product-prompt-ideas/` | 400 |

**Keep** `libs/aiCrawlChecker.ts` and `app/api/tools/ai-crawl-checker/` — they
move into the dashboard in issue 18.

**Keep** `app/(private)/account-settings/` as a shell; it becomes the settings
screen in issue 19.

Every `catch` block currently calls `getPostHogServer().captureException(...)`.
Replace with plain `console.error` — no telemetry leaves the machine.

Remove the corresponding dependencies from `package.json`.

## Done when

- `bun run tsc` and `bun run lint` pass.
- `bun run build` succeeds.
- No import of `posthog`, `crisp`, `lemonsqueezy`, `@vercel/analytics`,
  `@vercel/speed-insights` or `@opentelemetry` remains.
