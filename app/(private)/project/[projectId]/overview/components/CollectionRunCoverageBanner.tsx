/** Criteria item 4/5: always visible, shared by both trend charts, and framed as "collecting"
 * rather than "no data" for the 0- and 1-run ranges a weekly, user-triggered cadence makes normal. */
export function getCollectionRunCoverageText(runCount: number): string {
  if (runCount <= 0) return 'No Collection Runs in this date range yet — still collecting.';
  if (runCount === 1)
    return '1 Collection Run collected in this date range — check back after your next run to see a trend.';
  return `Covers ${runCount} Collection Runs in this date range.`;
}

export function CollectionRunCoverageBanner({ runCount }: { runCount: number }) {
  return (
    <div
      className="border-border bg-muted/40 text-muted-foreground rounded-md border px-3 py-2 text-sm"
      data-testid="overview-collection-run-coverage"
    >
      {getCollectionRunCoverageText(runCount)}
    </div>
  );
}
