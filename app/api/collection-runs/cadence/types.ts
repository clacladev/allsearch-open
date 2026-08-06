export type CollectionCadenceResponse = {
  /** ISO finish timestamp the 7-day clock is anchored on; null when no Run has ever completed. */
  lastCompletedRunFinishedAt: string | null;
  lastCompletedRunId: string | null;
  /** The latest terminal Run, only when it left one or more Prompts failed. */
  failedRun: { runId: string; failedPromptCount: number } | null;
};
