import { describe, expect, it } from 'bun:test';
import { getShouldShowLatestRunNotice } from '@/libs/collection/latestRunStaleness';

const NOW = Date.parse('2026-01-10T12:00:00.000Z'); // today is '2026-01-10'

describe('getShouldShowLatestRunNotice', () => {
  it('returns false when latestRunDate is null', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: null,
        rangeEndDate: '2026-01-10',
        lastCompletedRunFinishedAt: null,
        now: NOW,
      })
    ).toBe(false);
  });

  it('condition (a), boundary: true at exactly 7 days old', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: '2026-01-03',
        rangeEndDate: '2026-01-10',
        lastCompletedRunFinishedAt: null,
        now: NOW,
      })
    ).toBe(true);
  });

  it('condition (a), just inside: false at 6 days old', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: '2026-01-04',
        rangeEndDate: '2026-01-10',
        lastCompletedRunFinishedAt: null,
        now: NOW,
      })
    ).toBe(false);
  });

  it('condition (b): true when a newer completed Run exists app-wide', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: '2026-01-09',
        rangeEndDate: '2026-01-10',
        lastCompletedRunFinishedAt: '2026-01-10T09:00:00.000Z',
        now: NOW,
      })
    ).toBe(true);
  });

  it('condition (b) does not fire on the same day', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: '2026-01-09',
        rangeEndDate: '2026-01-10',
        lastCompletedRunFinishedAt: '2026-01-09T23:00:00.000Z',
        now: NOW,
      })
    ).toBe(false);
  });

  it('criterion 10: suppresses the notice on a historical range even if both triggers would fire', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: '2025-12-01',
        rangeEndDate: '2025-12-05',
        lastCompletedRunFinishedAt: '2026-01-10T09:00:00.000Z',
        now: NOW,
      })
    ).toBe(false);
  });

  it('returns false without crashing when lastCompletedRunFinishedAt is undefined', () => {
    expect(
      getShouldShowLatestRunNotice({
        latestRunDate: '2026-01-04',
        rangeEndDate: '2026-01-10',
        lastCompletedRunFinishedAt: undefined,
        now: NOW,
      })
    ).toBe(false);
  });
});
