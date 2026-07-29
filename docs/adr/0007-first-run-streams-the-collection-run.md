# First run streams the Collection Run, and does not show a price

In the SaaS, the final onboarding step polled for a report that a server-side
cron had already produced. Locally that step becomes the moment the user watches
roughly 75 grounded LLM calls, 75 sentiment calls and a few hundred page fetches
execute against their own API key: five to ten minutes at sane concurrency.

We render that as a **streaming report** rather than a progress bar or a reduced
sample run. Results appear per Prompt as they land, with per-Chatbot state and a
running count. It is the only option where the wait does work for us: it is
watchable, it teaches the user what the product actually does, and it is the same
progress surface every weekly Collection Run needs, so it is built once rather
than thrown away after onboarding.

Key entry comes first, before every other step, because topic, prompt and
competitor suggestion are all Gemini calls. Keys are validated with a real test
call at entry, otherwise a typo surfaces three screens later as a confusing AI
failure.

**No cost estimate or running total is shown.** This was a deliberate call
against the alternative: a price tag on the button creates friction on exactly
the action we want users to take weekly, and the amounts are small. The accepted
risk is that the app spends the user's money without ever quantifying it, and
the first time someone is surprised by a provider bill, that is why. Revisit if
it happens.

## Consequences

- Chatbots are individually enabled by the user rather than always running all
  three. `SUPPORTED_CHATBOTS_IDS` is a hardcoded constant today; it becomes
  configuration, defaulting to whichever provider keys are present.
- Because Chatbots can be enabled and disabled, a Visibility percentage is only
  meaningful relative to the Chatbots that produced it. The UI must say which
  Chatbots a figure covers, and figures must not be compared across periods where
  the enabled set changed.
- Three failure states that never existed in the SaaS — no key, invalid key,
  quota exceeded — now need handling on every AI-dependent screen. This is a
  small change repeated in many places, which is exactly the kind of work that
  gets missed until beta.
