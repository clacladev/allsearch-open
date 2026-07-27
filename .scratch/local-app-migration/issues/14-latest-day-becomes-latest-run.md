# 14 — "Latest day" becomes "latest completed run"

Status: ready-for-agent
Milestone: 4 — Analysis correctness
Blocked by: 13

The sharpest correctness bug inherited from the SaaS. Not optional.

`libs/utils/project-analysis/getRankingsSummary.ts` computes average Brand
position over **whatever rows share the maximum `created_at` date**. That was
sound when a cron guaranteed rows every day. With weekly manual collection, a
user who has not run a collection for a fortnight sees two-week-old rankings
presented as current, with nothing on screen saying so.

Audit every consumer of "the latest day" in `libs/utils/project-analysis/` and
`getOverviewData.ts`, and change the meaning to **the latest completed Collection
Run**, using `prompt_responses.run_id` rather than date arithmetic.

**Then date-stamp the result in the UI.** A number derived from a run that
finished nine days ago must say so — "as of 18 July" — wherever it appears.
Correct maths presented without provenance is still misleading.

**And when the data is stale, say so on the page itself**, not only in the
sidebar countdown. A message along the lines of *"Latest data is from 18 July"*
with an **Update data now** button that starts a Collection Run, placed where the
stale numbers are being read: the overview first, and any page whose headline
figures come from the latest run.

This is the same trigger and the same run as the weekly banner in issue 13 —
build it once and place it in both. The distinction is scope: issue 13 is the
app-level "your data is due" prompt driven by the seven-day cycle; this is the
in-context "the number you are looking at right now is nine days old" notice,
which must appear whenever the latest run is stale even if the cycle has not yet
elapsed.

Related: `analysePromptResponsesSources` and the "update last day of prompt
responses analysis" flow both operate on "today or yesterday" windows
(`libs/workflows/updateLastDayOfPromptResponsesAnalysis/steps.ts` picks today's
rows else yesterday's, and throws when there are none). Rework to target a run.

`tests/unit/project-analysis/getRankingsSummary.test.ts` must be extended to
cover the stale case: given rows from a run nine days old and none since, the
summary describes that run and reports its date.

## Done when

- No analysis code selects by max date to mean "most recent collection".
- Every headline metric carries the date of the run it came from.
- Unit tests cover a stale latest run.
