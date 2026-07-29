# 11 — Remove Workflow DevKit

Status: ready-for-agent
Milestone: 3 — Collection engine
Blocked by: 10

With the worker loop in place, delete the durable workflow framework.

- Remove every `'use workflow'` and `'use step'` directive from
  `libs/workflows/` and from `libs/utils/sourcesAnalysis.ts`.
- Remove `withWorkflow(nextConfig)` from `next.config.ts` and the `workflow`
  dependency from `package.json`.
- Delete the generated `app/.well-known/workflow/` tree (build output, gitignored
  in the SaaS) and its exclusion from the proxy matcher.
- Replace the six `start(...)` call sites with calls that enqueue a Collection
  Run: `app/api/process-prompts/route.ts`,
  `app/api/process-prompts/[projectId]/route.ts`,
  `app/api/process-prompts/[projectId]/force-one/route.ts`,
  `app/api/project/[projectId]/fetch-new-prompt-responses/route.ts`,
  `app/api/project/[projectId]/update-last-day-of-prompt-responses-analysis/route.ts`,
  `app/api/new-project/save/route.ts`.
- Delete `CRON_SECRET` and the bearer check on `/api/process-prompts` — there is
  no cron.
- Collapse the route surface: five ways to start collection existed because
  three of them were admin or debug affordances. Keep "run everything now" and
  "run one Project now".

The `workflow_id` string on `prompt_responses` is replaced by `run_id` in issue
10; drop the column.

## Done when

- `grep -r "use workflow\|use step\|workflow/api\|withWorkflow"` returns nothing.
- `bun run build` produces no `.well-known/workflow` output.
- Collection still works end to end through the new endpoints.
