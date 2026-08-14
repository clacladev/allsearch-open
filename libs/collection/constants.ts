/** The single global cap on simultaneous LLM calls, across every Prompt in flight. This is the
 *  throttle the whole run is built around: fanning out ~75 at once, as the old multi-tenant
 *  setup did, fails immediately against a personal API key. */
export const MAX_CONCURRENT_AI_CALLS = 5;
/** Total attempts per (Prompt x Chatbot) item, including the first. */
export const MAX_ITEM_ATTEMPTS = 3;
export const RATE_LIMIT_BACKOFF_BASE_MS = 2_000;
export const PROVIDER_COOLDOWN_MS = 30_000;
/** How many Prompt groups may be claimed at once. Not a throttle — it bounds the limiter's queue
 *  depth so a cancellation takes effect promptly. Deliberately the same number so there is one
 *  tunable, not two. */
export const MAX_CONCURRENT_PROMPT_GROUPS = MAX_CONCURRENT_AI_CALLS;

/** How often the SSE endpoint re-reads the Run's items. One cheap indexed query per second per
 * open stream; the endpoint only writes a frame when the snapshot actually changed. */
export const COLLECTION_RUN_PROGRESS_POLL_INTERVAL_MS = 1_000;
/** Comment frame cadence when nothing changed, so idle connections are not dropped. */
export const COLLECTION_RUN_PROGRESS_HEARTBEAT_MS = 15_000;
/** `retry:` hint sent to EventSource — how long the browser waits before reconnecting. */
export const COLLECTION_RUN_PROGRESS_RETRY_MS = 3_000;

/** The single, hardcoded, app-wide collection cadence (issue 13, criterion 1). Not configurable,
 * not per-Project, not surfaced as a setting. Measured as exact elapsed milliseconds, never in
 * calendar days, so DST transitions cannot shift it. */
export const COLLECTION_CADENCE_DAYS = 7;
export const COLLECTION_CADENCE_MS = COLLECTION_CADENCE_DAYS * 24 * 60 * 60 * 1000;

/** How long after a Run completes before the sidebar countdown card reappears — long enough
 *  that finishing onboarding (or a manual refresh) doesn't immediately nag for another one. */
export const COLLECTION_CADENCE_GRACE_PERIOD_DAYS = 1;
export const COLLECTION_CADENCE_GRACE_PERIOD_MS =
  COLLECTION_CADENCE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
