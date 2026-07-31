/** The single global cap on simultaneous LLM calls, across every Prompt in flight. This is the
 *  throttle the whole run is built around (ADR 0009): the SaaS fanned out ~75 at once, which
 *  fails immediately against a personal API key. */
export const MAX_CONCURRENT_AI_CALLS = 5;
/** Total attempts per (Prompt x Chatbot) item, including the first. */
export const MAX_ITEM_ATTEMPTS = 3;
export const RATE_LIMIT_BACKOFF_BASE_MS = 2_000;
export const PROVIDER_COOLDOWN_MS = 30_000;
/** How many Prompt groups may be claimed at once. Not a throttle — it bounds the limiter's queue
 *  depth so a cancellation takes effect promptly. Deliberately the same number so there is one
 *  tunable, not two. */
export const MAX_CONCURRENT_PROMPT_GROUPS = MAX_CONCURRENT_AI_CALLS;
