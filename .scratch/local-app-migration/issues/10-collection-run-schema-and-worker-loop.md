# 10 — Collection Run schema and worker loop

Status: ready-for-agent
Milestone: 3 — Collection engine
Blocked by: 09

The core of the migration. Replaces Vercel Cron, Workflow DevKit and Vercel
Queues with a job table and a worker loop (ADR 0009).

**Schema.**

`collection_runs`: `id`, `status` (`pending` / `running` / `completed` /
`failed` / `cancelled`), `started_at`, `finished_at`, `items_total`,
`items_completed`, `items_failed`, `error`.

`collection_run_items`: `id`, `run_id`, `project_id`, `prompt_id`, `chatbot_id`,
`status`, `attempts`, `error`, `started_at`, `finished_at`. One row per
(Prompt × Chatbot).

`prompt_responses` gains `run_id` as a real foreign key, replacing the
`workflow_id` text column that held `fetchDailyPromptsWorkflow-<projectId>-<date>`
and was never queried.

**Worker loop.** Claim pending items, execute with a concurrency limit
(`p-limit`), write results, update counters. The steps are already correctly
decomposed in `libs/workflows/fetchDailyPromptsForProject/steps.ts` — keep the
decomposition, drop the framework:

1. fetch the Chatbot response (grounded)
2. compute Brand Ranking from the text
3. fetch and analyse each unique cited Source URL
4. analyse sentiment per Brand
5. persist Prompt Response and Sources

**Concurrency is the point of this ticket.** The SaaS fanned every Prompt out at
once, each spawning three parallel engine calls — around 75 simultaneous
requests. Against a personal API key that fails immediately. Default to a small
limit, make it a constant, and back off on 429.

**Resumption after quit** is a query, not a distributed systems property: on
startup, any run left `running` has its unfinished items reset to `pending` and
the loop picks up where it stopped. **Retrying only what failed** is a query for
`status = 'failed'`.

Partial runs are legitimate and must be recorded honestly — a run that covered 12
of 25 Prompts is `completed` with `items_failed = 13`, not silently successful.

## Done when

- A run of N prompts × M chatbots creates N×M items and completes them all.
- Killing the process mid-run and restarting resumes without duplicating work.
- Concurrency never exceeds the configured limit under load.
- A provider 429 marks items failed and retryable without failing the run.
