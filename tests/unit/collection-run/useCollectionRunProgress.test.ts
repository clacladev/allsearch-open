import { describe, expect, it } from 'bun:test';

import { deriveIsRunInProgress } from '@/components/collection-run/useCollectionRunProgress';
import type { CollectionRunProgress } from '@/libs/collection/progress';

function makeProgress(overrides: Partial<CollectionRunProgress> = {}): CollectionRunProgress {
  return {
    runId: 'run-1',
    status: 'running',
    isTerminal: false,
    promptsTotal: 2,
    promptsCompleted: 0,
    promptsFailed: 0,
    promptsFinished: 0,
    projects: [],
    ...overrides,
  };
}

describe('deriveIsRunInProgress', () => {
  it('is undefined before discovery has responded and no runId is known (initial render)', () => {
    expect(
      deriveIsRunInProgress({
        runId: undefined,
        hasDiscoveryResponse: false,
        activeRunId: undefined,
        isStreamError: false,
        progress: undefined,
      })
    ).toBeUndefined();
  });

  it('is undefined once a runId is known but the first progress frame has not landed yet (finding 1 regression)', () => {
    // This is the exact race from issue 12 finding 1: the `/active` response has resolved with a
    // runId, but the `setRunId` effect and the first SSE frame have not committed yet.
    expect(
      deriveIsRunInProgress({
        runId: undefined,
        hasDiscoveryResponse: true,
        activeRunId: 'run-1',
        isStreamError: false,
        progress: undefined,
      })
    ).toBeUndefined();
  });

  it('is undefined for a directly-provided runId (onboarding ?runId=) until the first frame arrives', () => {
    expect(
      deriveIsRunInProgress({
        runId: 'run-1',
        hasDiscoveryResponse: false,
        activeRunId: undefined,
        isStreamError: false,
        progress: undefined,
      })
    ).toBeUndefined();
  });

  it('is false once discovery has responded with no active Run', () => {
    expect(
      deriveIsRunInProgress({
        runId: undefined,
        hasDiscoveryResponse: true,
        activeRunId: null,
        isStreamError: false,
        progress: undefined,
      })
    ).toBe(false);
  });

  it('is true while a known Run has a non-terminal progress frame', () => {
    expect(
      deriveIsRunInProgress({
        runId: 'run-1',
        hasDiscoveryResponse: true,
        activeRunId: 'run-1',
        isStreamError: false,
        progress: makeProgress({ isTerminal: false }),
      })
    ).toBe(true);
  });

  it('is false once the progress frame is terminal', () => {
    expect(
      deriveIsRunInProgress({
        runId: 'run-1',
        hasDiscoveryResponse: true,
        activeRunId: 'run-1',
        isStreamError: false,
        progress: makeProgress({ isTerminal: true, status: 'completed' }),
      })
    ).toBe(false);
  });

  it('is false when the stream closed permanently, even if a runId is known and no progress arrived', () => {
    // A 404 on reconnect: the stream will never deliver a frame for this runId again, so this must
    // fall through to false (not hang on undefined) regardless of whether progress ever arrived.
    expect(
      deriveIsRunInProgress({
        runId: 'run-1',
        hasDiscoveryResponse: true,
        activeRunId: 'run-1',
        isStreamError: true,
        progress: undefined,
      })
    ).toBe(false);
  });

  it('is false when the stream closed permanently even with a stale non-terminal progress frame', () => {
    expect(
      deriveIsRunInProgress({
        runId: 'run-1',
        hasDiscoveryResponse: true,
        activeRunId: 'run-1',
        isStreamError: true,
        progress: makeProgress({ isTerminal: false }),
      })
    ).toBe(false);
  });
});
