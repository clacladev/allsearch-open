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
