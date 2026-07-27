# 15 — Sparse and gappy charts

Status: ready-for-agent
Milestone: 4 — Analysis correctness
Blocked by: 14

The charts were built for daily points. They now receive weekly points with gaps,
and a gap means *the app was not run*, not *the Brand lost visibility* (ADR 0002).

Rendered naively, a fortnight away looks like a collapse in visibility followed
by a recovery. That is the opposite of the truth and it is the kind of chart
someone puts in a client report.

Affected: `getVisibilityDataset.ts`, `getSentimentDataset.ts`, and the Recharts
components on the overview page.

Requirements:

- A missing period is drawn as a **gap**, never interpolated and never zero.
- The x-axis is Collection Runs or real dates, not an implied continuous daily
  series.
- Somewhere visible, a coverage statement: how many runs happened in the selected
  range.
- Ranges shorter than two runs degrade gracefully. A brand-new install has
  exactly one data point and must not render as a broken chart — this is the
  first thing a new user sees.

Trends now arrive at four points a month instead of thirty. The empty and
near-empty states are therefore a normal condition for weeks, not an edge case,
and should read as "collecting" rather than "no data".

## Done when

- A series with a two-week gap renders as a gap.
- A single-run install renders a sensible chart.
- The overview states how many Collection Runs the range covers.
