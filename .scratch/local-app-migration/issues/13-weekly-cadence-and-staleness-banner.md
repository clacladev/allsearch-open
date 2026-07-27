# 13 — Weekly cadence and staleness banner

Status: ready-for-agent
Milestone: 3 — Collection engine
Blocked by: 12

The product's replacement for a cron: tell the user when the data is stale and
give them one button (ADR 0002).

**Cadence is seven days, app-wide, hardcoded.** One countdown, one button, one
run covering every Project. Not per-Project: an agency with eight clients would
get a nag every couple of days and would learn to ignore the banner. Not
configurable: a setting invites someone to set it to daily and then be surprised
by their provider bill, and we have chosen not to show costs.

**The clock runs from the last completed app-wide Collection Run.** Before it
elapses, show a quiet countdown — "next update in 6 days". After it elapses, show
a banner asking the user to refresh, with the button.

**The button is always available.** A user who wants a data point today can take
one; it just costs them tokens.

**Adding a Project triggers an immediate run for that Project alone.** Otherwise
someone who finishes onboarding three days into the cycle lands on an empty
dashboard and waits four days for anything to appear. The new Project then joins
the app-wide cycle. This matches what the SaaS effectively did — `new-project/save`
started collection immediately.

**A failed run costs a whole week**, because there is no second cron an hour
later to sweep up failures as there was in the SaaS. A partial run must therefore
offer "retry the N Prompts that failed", driven by `collection_run_items` where
`status = 'failed'`.

## Done when

- The countdown reflects the last completed run and rolls over to the banner at
  seven days.
- The manual button works at any time.
- Creating a Project starts collection for it immediately.
- A partial run surfaces a retry that re-runs only the failed items.
