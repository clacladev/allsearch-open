# Spec: AllSearch Local

Port the AllSearch SaaS (`clacladev/allsearch`, Next.js 16 + Supabase + Vercel)
into a single-user application that runs entirely on the user's own machine,
against the user's own AI provider keys, with no hosted services of any kind.

Decisions behind this spec are recorded in `docs/adr/0001`–`0010`. Vocabulary is
in `CONTEXT.md`. This document says what to build; the ADRs say why.

## Goal

A marketing or agency user installs AllSearch, pastes a Google AI key, adds the
brand they want to track, and within ten minutes is looking at real data about
how AI chatbots talk about that brand. Once a week the app tells them the data is
stale and they press one button to refresh it. Nothing they do touches a server
we operate.

## Non-goals

- Multi-user, teams, sharing, or any login. There is exactly one user.
- Background or scheduled collection. Collection is always user-initiated.
- Billing, plans, quotas, trials.
- Cross-machine sync. Database file export/import covers this later.
- Claude as a fourth Chatbot. Wishlist.
- A desktop shell. Deferred to public launch (ADR 0010).

## What carries over unchanged

About 80% of 57,600 lines. Specifically: the entire dashboard under
`app/(private)/project/[projectId]/*`, the analysis layer
`libs/utils/project-analysis/*`, the article generation pipeline, every CSV/ZIP/
PDF/DOCX exporter, the URL scraping in `libs/utils/urlAnalysis.ts`, and roughly
30 of the 40 unit test files.

## What changes

| Area | From | To |
|---|---|---|
| Database | Supabase Postgres, PostgREST client, RLS | SQLite via Drizzle on `node:sqlite` |
| Identity | GoTrue, `user_profiles`, `author_id`, RLS | None. Organization is a settings row |
| AI | Vercel AI Gateway, one key we own | OpenAI + Google + Perplexity keys the user owns |
| Collection | Vercel Cron twice daily → Workflow DevKit → Vercel Queues | A `collection_runs` job table and a worker loop, triggered by the user |
| Cadence | Daily, automatic, guaranteed | Weekly, manual, gappy and honest about it |
| Chatbots | All three, always | Whichever the user enables and has keys for |
| Packaging | Vercel deploy | `bunx allsearch` boots the server and opens the browser |
| Telemetry | PostHog, Crisp, Vercel Analytics, OTel | None |

## The one genuinely new concept

**Collection Run.** The SaaS had no notion of a run: it inferred "today's batch"
from `created_at` and carried an unqueried `workflow_id` string. Everything the
local app needs — the staleness countdown, progress, resumption after quit,
partial results, retrying only what failed — hangs off making a Run a real thing,
with a `collection_run_items` row per (Prompt × Chatbot).

Consequently every metric that currently means "the latest day" must come to mean
"the latest completed Collection Run". `getRankingsSummary` is the sharp edge: it
takes whatever rows share the maximum date, so after a fortnight away it will
present two-week-old numbers as today's without saying so.

## Risks

1. **Silent metric staleness.** Above. Fixing it is Milestone 4 and it is not
   optional.
2. **Charts assume daily points.** Weekly collection with gaps will render as
   dips that read as *the brand lost visibility* rather than *the app was not
   run*.
3. **Rate limits against a personal key.** The current code fans every Prompt out
   concurrently, each spawning three engine calls. Unthrottled that is ~75
   simultaneous requests and will fail immediately on a personal account.
4. **The Untitled UI swap is a hard gate on going public** and touches every page
   in the dashboard.
5. **No fake AI provider** (deliberately, ADR 0008), so AI-dependent e2e specs
   cost money and cannot run in CI.

## Milestones

Ordered by dependency. Each should leave the app working.

| # | Milestone | Issues | Outcome |
|---|---|---|---|
| 0 | Import and safety net | 01–03 | Code is here, SaaS surface deleted, unit tests green |
| 1 | Data layer | 04–06 | Runs on SQLite, no Supabase, no identity |
| 2 | AI providers | 07–09 | Runs on the user's own keys, degrades per Chatbot |
| 3 | Collection engine | 10–13 | Weekly manual Collection Runs with streaming progress |
| 4 | Analysis correctness | 14–15 | Metrics and charts honest about runs and gaps |
| 5 | Onboarding | 16–17 | First run works end to end from a fresh install |
| 6 | Feature moves | 18–19 | Crawl checker in the dashboard, settings rebuilt |
| 7 | Ship it | 20–21 | `bunx allsearch` works, e2e suite runs |
| 8 | Public release gate | 22–24 | Untitled UI replaced, site up, Electron decided |

## Definition of done for v1

A fresh machine runs `bunx allsearch`, is asked for a Google AI key, completes
onboarding for one brand, watches a Collection Run stream to completion, and sees
a populated dashboard. Seven days later the app says the data is stale and one
button refreshes it. Quitting mid-run and reopening resumes where it left off.
