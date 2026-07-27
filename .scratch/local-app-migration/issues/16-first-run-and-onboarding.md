# 16 — First run and onboarding

Status: ready-for-agent
Milestone: 5 — Onboarding
Blocked by: 15

The path from a fresh install to a populated dashboard. The SaaS sequence
survives; two things are inserted and one is replaced (ADR 0007).

**Sequence:** keys → organization → brand → topics → prompts → competitors →
save → streaming run.

**Keys come first**, before everything, because the topic, prompt and competitor
steps are all Gemini calls. Google is required; OpenAI and Perplexity are
offered as optional "track another AI platform" and can be added later in
settings. Validate on entry (issue 08).

**The organization step survives** as the first real question — agency or
in-house, plus name, URL and icon for an agency. It now writes the single
settings row rather than creating a tenant. Keep the domain-metadata lookup that
auto-fills name and favicon.

**Brand, topics, prompts and competitors keep their current shape**, including
the localStorage draft (`new-project:draft`, two-day TTL — drop the user
segment), the pre-selection defaults (first two topics, two prompts per topic),
the custom-entry limits, and `getCorrectStep()` forward-guarding.

**The save step** writes Project, Topics, Prompts and Competitors, then starts a
Collection Run for that Project (issue 13).

**The report step is replaced** by the streaming progress UI from issue 12.

There is no sign-in screen and no account creation, ever (ADR 0003).

## Done when

- A fresh database plus a Google key reaches a populated dashboard without any
  other configuration.
- Abandoning midway and returning restores the draft.
- Every AI step handles a missing or rejected key per issue 09.
