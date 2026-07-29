# Replace Workflow DevKit with a SQLite job table and a worker loop

The SaaS ran collection through Vercel's Workflow DevKit (`'use workflow'` /
`'use step'`, `start()`, generated `.well-known/workflow/v1/` routes, Vercel
Queues). We investigated keeping it, because the SDK is Apache-2.0, actively
developed, and its `World` interface (`World extends Storage, Queue, Streamer`)
is a genuine, documented, conformance-tested extension point with a community
Turso/libSQL world that accepts `file:workflow.db`. Running it locally is
architecturally possible. We are not doing it.

Four reasons, in order of weight:

1. **Concurrency limiting does not exist.** Throttling LLM calls against the
   user's own API key is our hardest runtime requirement. The concurrency RFC has
   been open since November 2025 and is still unshipped; the flow-control issue
   has been open since February 2026; the discussion titled "Throttling" has
   never received a reply. `world-local` defaults to a concurrency of 100.
2. **`world-local` is documented as not for production**, with an in-memory queue
   that does not survive a restart, filesystem JSON storage, and a queue that
   fires work from a detached, never-awaited IIFE. Surviving the user quitting
   mid-run is a core requirement here, and that design fails it outright.
3. **Desktop is an unsupported blank spot.** Tauri appears zero times across all
   issues and discussions; Electron appears once as a user aside. Questions about
   running outside Vercel routinely go unanswered for months, while Vercel-World
   bugs are answered same-day.
4. **It fails silently.** With nothing consuming the queue topic, runs sit in
   `pending` forever with no error and no log. Combined with our decision to ship
   no telemetry, that is unsupportable: a user reports "it just spins" and there
   is nothing to inspect.

Instead, `collection_runs` gains a `collection_run_items` child row per
(Prompt × Chatbot), and a worker loop drives it with a concurrency limiter.
Resume-after-quit becomes a query for pending items rather than a distributed
systems property; retrying only the failed Prompts becomes a query for failed
items; concurrency becomes a number.

## Consequences

- All `'use workflow'` and `'use step'` directives are removed from
  `libs/workflows/`, along with `withWorkflow()` in `next.config.ts` and the
  generated `app/.well-known/workflow/` output. The step *decomposition* is kept:
  it is a sound description of the work and maps directly onto job items.
- We own retry, backoff and cancellation. The requirement is modest enough that
  this is a few hundred lines rather than a subsystem.
- This removes the last Vercel-shaped dependency from the product.
