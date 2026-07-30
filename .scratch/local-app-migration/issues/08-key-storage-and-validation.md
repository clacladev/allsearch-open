# 08 — Key storage and validation

Status: ready-for-agent
Milestone: 2 — AI providers
Blocked by: 07

Somewhere for the user to paste their provider keys, and confidence that they
work before anything depends on them.

**Storage.** Keys go in the local database or an OS keychain, never in `.env` and
never in a file committed anywhere. `.env.example` documents only development
variables. Keys are never rendered back to the client in full: show the last four
characters.

**Validation is required, not a nicety.** Every key is verified with a cheap live
call at the moment it is entered. Onboarding asks for a key and then immediately
makes Gemini calls for topic and prompt suggestions; without validation a typo
surfaces three screens later as a confusing AI failure with no obvious cause.

**Google is the required key. OpenAI and Perplexity are optional.** Google alone
yields a fully working product: it powers the Google AI Overview Chatbot *and*
sentiment, topic ideas, prompt ideas, competitor discovery, article outlines and
article generation. OpenAI and Perplexity each unlock exactly one further
Chatbot. The UI must reflect that asymmetry rather than presenting three equal
empty boxes — ask for Google, then offer the other two as "track another AI
platform".

Each key field links to where that provider issues keys.

## Done when

- Keys persist across restarts and survive a migration.
- An invalid key is rejected at entry with a message naming the provider.
- The app starts and is usable with only a Google key.
- No key value appears in any log or server response.

## Comments

**2026-07-30 — implemented alongside issue 09.**

Keys live in a singleton `settings` row, in a `provider_keys` JSON column
rather than enumerated per-provider columns, so a fourth provider is a value
change instead of a migration. The database file and its WAL siblings are
chmod 0600 after migration. Not encrypted at rest: without a keychain the key
would sit next to the ciphertext. Note the consequence for issue 19 — a
database export would carry the keys with it.

`getProviderKey` reads storage first and falls back to the env var, which is
now a documented development affordance rather than the supported path. That
keeps `bun run verify:providers` and the unit tests working unchanged.

Validation calls each provider's free list-models endpoint. 401/403 rejects
the key and it is never saved; 429 saves it as `rate_limited`, because a
rate-limited key is a working key; a network failure saves it as `unverified`
rather than blocking a user who is offline. **Perplexity is saved unverified
without any call at all** — it has no free endpoint, and validating it would
spend the user's money at key-entry time.

Two defects found in review, both fixed in cb0e99e and both worth
remembering. `DrizzleQueryError.message` embeds bound query parameters, so a
failed write put the plaintext key into a log line and an HTTP response —
every settings write now goes through a guard that rethrows without the
parameters. And the singleton row was created read-then-insert, so the
Settings page's own `Promise.all` created two rows on a fresh install, while
the read-modify-write of `provider_keys` lost concurrent saves; it now uses a
fixed primary key with an atomic insert and mutates the JSON in place with
`json_set`. "Single-user" does not mean "single-request".
