import { describe, expect, it } from 'bun:test';
import { deriveCadenceSurfaces } from '@/components/collection-run/CollectionCadenceSurfaces';
import type { CollectionCadenceResponse } from '@/app/api/collection-runs/cadence/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-01-08T00:00:00.000Z');

function makeCadenceData(
  overrides: Partial<CollectionCadenceResponse> = {}
): CollectionCadenceResponse {
  return { lastCompletedRunFinishedAt: null, failedRun: null, ...overrides };
}

describe('deriveCadenceSurfaces', () => {
  it('hides all three surfaces before Project discovery resolves (isRunInProgress undefined)', () => {
    // Guards against the exact regression a reviewer flagged: flipping the component's
    // `isRunInProgress !== false` guard to `!isRunInProgress` would leave this pre-discovery case
    // hidden too (`!undefined` is true), but would wrongly show everything once a Run actually
    // starts (`!true` is false) — see the next case, which is what actually catches that mutation.
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: undefined,
      cadenceData: makeCadenceData({ failedRun: { runId: 'run-1', failedPromptCount: 2 } }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result).toEqual({
      shouldShowRetry: false,
      failedRun: null,
      cadenceState: { kind: 'unknown' },
    });
  });

  it('hides all three surfaces while a Run is in progress (criterion 10)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: true,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 10 * DAY_MS).toISOString(),
        failedRun: { runId: 'run-1', failedPromptCount: 2 },
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result).toEqual({
      shouldShowRetry: false,
      failedRun: null,
      cadenceState: { kind: 'unknown' },
    });
  });

  it('hides all three surfaces when there are no Projects, even with a stale anchor and a failed Run (criterion 11)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: false,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 10 * DAY_MS).toISOString(),
        failedRun: { runId: 'run-1', failedPromptCount: 2 },
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result).toEqual({
      shouldShowRetry: false,
      failedRun: null,
      cadenceState: { kind: 'unknown' },
    });
  });

  it('hides all three surfaces while the cadence data has not loaded yet', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: undefined,
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result).toEqual({
      shouldShowRetry: false,
      failedRun: null,
      cadenceState: { kind: 'unknown' },
    });
  });

  it('shows the countdown once a Run is not in progress and the anchor is within 7 days (criterion 3)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 6 * DAY_MS).toISOString(),
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result.cadenceState).toEqual({ kind: 'countdown', daysRemaining: 1 });
  });

  it('shows the staleness banner instead of the countdown once 7x24h have elapsed (criterion 4)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 7 * DAY_MS).toISOString(),
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result.cadenceState).toEqual({ kind: 'stale' });
  });

  it('offers the retry surface for an undismissed failed Run, alongside the countdown (criteria 5, 9)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 6 * DAY_MS).toISOString(),
        failedRun: { runId: 'run-1', failedPromptCount: 3 },
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result.shouldShowRetry).toBe(true);
    expect(result.failedRun).toEqual({ runId: 'run-1', failedPromptCount: 3 });
    expect(result.cadenceState).toEqual({ kind: 'countdown', daysRemaining: 1 });
  });

  it('offers the retry surface alongside the staleness banner too (criteria 5, 9)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 7 * DAY_MS).toISOString(),
        failedRun: { runId: 'run-1', failedPromptCount: 3 },
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result.shouldShowRetry).toBe(true);
    expect(result.cadenceState).toEqual({ kind: 'stale' });
  });

  it('hides only the retry surface once its Run id has been dismissed, leaving the banner untouched (criterion 9)', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 7 * DAY_MS).toISOString(),
        failedRun: { runId: 'run-1', failedPromptCount: 3 },
      }),
      dismissedRetryRunId: 'run-1',
      now: NOW,
    });
    expect(result.shouldShowRetry).toBe(false);
    expect(result.cadenceState).toEqual({ kind: 'stale' });
  });

  it('does not offer retry when the latest terminal Run has no failed Prompts', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 6 * DAY_MS).toISOString(),
      }),
      dismissedRetryRunId: undefined,
      now: NOW,
    });
    expect(result.shouldShowRetry).toBe(false);
    expect(result.failedRun).toBeNull();
  });

  it('re-offers retry once a different Run id fails, even if a previous Run id is still dismissed', () => {
    const result = deriveCadenceSurfaces({
      hasProjects: true,
      isRunInProgress: false,
      cadenceData: makeCadenceData({
        lastCompletedRunFinishedAt: new Date(NOW - 6 * DAY_MS).toISOString(),
        failedRun: { runId: 'run-2', failedPromptCount: 1 },
      }),
      dismissedRetryRunId: 'run-1',
      now: NOW,
    });
    expect(result.shouldShowRetry).toBe(true);
  });
});
