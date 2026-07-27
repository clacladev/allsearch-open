# 19 — Settings screen

Status: ready-for-agent
Milestone: 6 — Feature moves
Blocked by: 18

`app/(private)/account-settings/` currently renders one thing: the signed-in
user's email address. There is no user any more, but the route is the right home
for everything a local app needs to expose.

**Sections:**

1. **Provider keys** — Google (required), OpenAI, Perplexity. Add, replace,
   remove; validated on entry; masked to the last four characters (issue 08).
2. **Chatbots** — which are enabled, defaulted from the keys present (issue 09).
3. **Organization** — agency or in-house, name, URL, icon. The single settings
   row (ADR 0003).
4. **Data** — where the database file lives, its size, when the last Collection
   Run completed, and a reveal-in-file-manager action. Users of a local-first
   app should be able to find and copy their own data. Database export and
   import is the eventual answer to using two machines, and this is where it
   will live.
5. **Developer** — the surviving `admin-tools` actions, ungated: clone a Project,
   fill Prompt Responses, pause, archive, delete. These were staff tools; locally
   the user is staff.

The existing per-Project settings tabs (competitors, brand, organization,
others) stay where they are. This screen is app-level.

## Done when

- Every key can be added, replaced and removed, with validation.
- Chatbot toggles persist and affect the next Collection Run.
- The database path is shown and can be revealed in the file manager.
- Nothing references an account, a plan or a subscription.
