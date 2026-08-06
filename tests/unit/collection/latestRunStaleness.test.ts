import { describe, expect, it } from 'bun:test';
import { getShouldShowLatestRunNotice } from '@/libs/collection/latestRunStaleness';
import { getLocalISODateString } from '@/libs/database/shared/ISODateString';

const NOW = Date.parse('2026-01-10T12:00:00.000Z');

type Input = Parameters<typeof getShouldShowLatestRunNotice>[0];

function makeInput(overrides: Partial<Input> = {}): Input {
  return {
    latestRunDate: '2026-01-04',
    latestRunFinishedAt: '2026-01-04T10:00:00.000Z',
    latestRunId: 'run-latest',
    rangeEndDate: '2026-01-10',
    lastCompletedRunFinishedAt: null,
    lastCompletedRunId: null,
    appWideStale: false,
    now: NOW,
    ...overrides,
  };
}

describe('getShouldShowLatestRunNotice', () => {
  it('returns false when latestRunDate is null', () => {
    expect(getShouldShowLatestRunNotice(makeInput({ latestRunDate: null }))).toBe(false);
  });

  it('condition (a), boundary: true at exactly 7 days old', () => {
    const today = getLocalISODateString(new Date(NOW));
    const sevenDaysAgo = new Date(NOW - 7 * 24 * 60 * 60 * 1000);
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: getLocalISODateString(sevenDaysAgo),
          latestRunFinishedAt: sevenDaysAgo.toISOString(),
          rangeEndDate: today,
          lastCompletedRunFinishedAt: null,
        })
      )
    ).toBe(true);
  });

  it('condition (a), just inside: false at 6 days old', () => {
    const today = getLocalISODateString(new Date(NOW));
    const sixDaysAgo = new Date(NOW - 6 * 24 * 60 * 60 * 1000);
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: getLocalISODateString(sixDaysAgo),
          latestRunFinishedAt: sixDaysAgo.toISOString(),
          rangeEndDate: today,
          lastCompletedRunFinishedAt: null,
        })
      )
    ).toBe(false);
  });

  it('condition (b): true when a newer completed Run exists app-wide (date fallback)', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: '2026-01-09',
          latestRunFinishedAt: '2026-01-09T10:00:00.000Z',
          latestRunId: null,
          rangeEndDate: '2026-01-10',
          lastCompletedRunFinishedAt: '2026-01-10T09:00:00.000Z',
          lastCompletedRunId: null,
        })
      )
    ).toBe(true);
  });

  it('condition (b) does not fire on the same day', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: '2026-01-09',
          latestRunFinishedAt: '2026-01-09T10:00:00.000Z',
          latestRunId: null,
          rangeEndDate: '2026-01-10',
          lastCompletedRunFinishedAt: '2026-01-09T23:00:00.000Z',
          lastCompletedRunId: null,
        })
      )
    ).toBe(false);
  });

  it('criterion 10: suppresses the notice on a historical range even if both triggers would fire', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: '2025-12-01',
          latestRunFinishedAt: '2025-12-01T10:00:00.000Z',
          rangeEndDate: '2025-12-05',
          lastCompletedRunFinishedAt: '2026-01-10T09:00:00.000Z',
          lastCompletedRunId: 'run-newer',
        })
      )
    ).toBe(false);
  });

  it('returns false without crashing when lastCompletedRunFinishedAt is undefined', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({ lastCompletedRunFinishedAt: undefined, lastCompletedRunId: undefined })
      )
    ).toBe(false);
  });

  it('finding 2: returns false (no throw) on an unparseable lastCompletedRunFinishedAt', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({ lastCompletedRunFinishedAt: 'not-a-date', lastCompletedRunId: 'run-x' })
      )
    ).toBe(false);
  });

  it('finding 5: suppresses when appWideStale is true even if condition (a) would fire', () => {
    const sevenDaysAgo = new Date(NOW - 7 * 24 * 60 * 60 * 1000);
    const today = getLocalISODateString(new Date(NOW));
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: getLocalISODateString(sevenDaysAgo),
          latestRunFinishedAt: sevenDaysAgo.toISOString(),
          rangeEndDate: today,
          appWideStale: true,
        })
      )
    ).toBe(false);
  });

  it('finding 5: appWideStale also suppresses a condition (b)-only case', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: '2026-01-09',
          latestRunFinishedAt: '2026-01-09T10:00:00.000Z',
          latestRunId: 'run-project',
          rangeEndDate: '2026-01-10',
          lastCompletedRunFinishedAt: '2026-01-10T09:00:00.000Z',
          lastCompletedRunId: 'run-newer',
          appWideStale: true,
        })
      )
    ).toBe(false);
  });

  it('finding 4: run-identity — different lastCompletedRunId on the same day returns true', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: '2026-01-10',
          latestRunFinishedAt: '2026-01-10T08:00:00.000Z',
          latestRunId: 'run-project',
          rangeEndDate: '2026-01-10',
          lastCompletedRunFinishedAt: '2026-01-10T11:00:00.000Z',
          lastCompletedRunId: 'run-newer',
        })
      )
    ).toBe(true);
  });

  it('finding 4: null latestRunId falls back to date-string comparison (false on same day)', () => {
    expect(
      getShouldShowLatestRunNotice(
        makeInput({
          latestRunDate: '2026-01-09',
          latestRunFinishedAt: '2026-01-09T10:00:00.000Z',
          latestRunId: null,
          rangeEndDate: '2026-01-10',
          lastCompletedRunFinishedAt: '2026-01-09T23:00:00.000Z',
          lastCompletedRunId: 'run-newer',
        })
      )
    ).toBe(false);
  });
});