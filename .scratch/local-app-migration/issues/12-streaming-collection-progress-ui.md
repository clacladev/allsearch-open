# 12 — Streaming Collection Run progress UI

Status: ready-for-agent
Milestone: 3 — Collection engine
Blocked by: 11

A Collection Run takes five to ten minutes at sane concurrency. The user watches
it. Build the surface once and use it in both places it is needed: the final
onboarding step and the weekly refresh (ADR 0007).

**It streams.** Results appear per Prompt as they land, with per-Chatbot state
and a running count — "12 of 25 · ChatGPT done, Google done, Perplexity
running". A ten-minute spinner on first use is where people leave; watching real
answers arrive is interesting and teaches the product.

Replace the SaaS's mechanism entirely. `app/api/new-project/report/route.ts`
returned 503 with a retry code until `projects.prompts_updated_at` was set, and
the client polled every five seconds with a Retry button after sixty. Drive the
new UI off `collection_run_items` instead.

**No cost estimate and no running total** — deliberately (ADR 0007). The accepted
risk is that the app spends the user's money without quantifying it.

Must handle: individual items failing without killing the run; the user
navigating away and returning to a run in progress; the user quitting and
reopening to find it resumed; and a run that finishes partially, which reports
what it covered rather than claiming success.

Streaming works because the CLI opens the user's real browser (ADR 0010). Note
for later: if Electron is ever added, verify streaming survives the embedded
webview — SSE dying silently inside an embedded webview is a documented failure
mode elsewhere.

## Done when

- Progress updates without a page refresh, from onboarding and from the
  dashboard.
- Navigating away and back reattaches to a running run.
- A partial run's final state names how many Prompts were covered.
