# 19 — Settings screen

Status: ready-for-human
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

## Comments

- Implemented. `/settings` now carries all five sections. Sections 1 and 2 already
  existed from issues 08/09; this change added 3, 4 and 5.

- **Organization (3).** The form moved to `components/settings/OrganizationSettingsForm.tsx`
  and is rendered from both the app-level screen and the per-Project Organization tab.
  It edits the one settings row (ADR 0003), so duplicating the form would have meant two
  front-ends onto a single row. `SettingsFormHeader` moved alongside it — six components
  already imported it across the route boundary.

- **Data (4).** `getDatabaseFileInfo()` in `libs/database/paths.ts` reports path, size and
  existence. The size deliberately counts the `-wal` and `-shm` sidecars: in WAL mode recent
  writes live in the sidecar until a checkpoint, so the main file alone understates both disk
  usage and what has to be copied to move machines. Last-run time reuses
  `getCollectionCadenceAnchor()` rather than adding a query.

  Reveal-in-file-manager is `POST /api/settings/database/reveal`. It **takes no input**: the
  path is derived server-side, so a request body cannot steer which file is opened. The
  platform → argv mapping is a pure function (`libs/utils/fileManager.ts`) spawned without a
  shell. Verified on a headless box with no `xdg-open`: it returns 500 with the path in the
  message rather than reporting a false success, and the UI falls back to Copy path.

- **Developer (5).** Moved from the per-Project settings tab to app level, and the `developer`
  tab was dropped from `SETTINGS_TABS` — the issue lists competitors/brand/organization/others
  as the tabs that stay. Clone, pause, archive/restore and delete were already implemented as
  API routes but had never been wired to any UI or added to `ROUTES`; they are now. Delete stays
  gated on the Project already being archived (enforced server-side too) so erasing data is
  always a deliberate second step.

  The old tab's "Update project prompt responses" button was kept as **Force run**. It is the
  only caller passing `shouldForce`, without which a Project cannot be collected twice inside
  one weekly cadence.

- Also removed the commented-out trial/subscription sidebar card, the last reference to a plan.

- **Verified:** `bun lint`, `bun tsc` and `bun run build` clean. Unit tests 612 pass / 8 fail —
  the same 8 failed before this change (collection-run specs that pass individually but not
  under the full run); failure names diffed identical before and after. Rendered against a
  seeded demo DB and exercised pause, clone and delete against the running server.

- **Not done here:** e2e coverage of the new sections. `tests/e2e/settings.spec.ts` still needs
  the auth backdoor removed and a golden-DB fixture, which is issue 21's scope. The existing
  spec does not touch the Developer tab, so removing it breaks nothing today.
