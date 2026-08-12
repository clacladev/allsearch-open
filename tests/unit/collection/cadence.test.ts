// Must run before any `Date` use below: pins the process timezone to one that actually observes
// the US spring-forward transition the DST test exercises. Without this, the test is vacuous under
// any timezone that doesn't shift on this date (e.g. Europe/London, UTC) — verified against Bun
// 1.3.14, which reads `process.env.TZ` at Date-use time, not at process start.
process.env.TZ = 'America/New_York';

import { describe, expect, it } from 'bun:test';
import { deriveCollectionCadenceState } from '@/libs/collection/cadence';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('deriveCollectionCadenceState', () => {
  it('returns unknown when no Run has ever completed', () => {
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: null, now: Date.now() })).toEqual({
      kind: 'unknown',
    });
  });

  it('returns unknown for an unparseable timestamp', () => {
    expect(
      deriveCollectionCadenceState({ lastCompletedRunFinishedAt: 'not-a-date', now: Date.now() })
    ).toEqual({ kind: 'unknown' });
  });

  it('returns fresh at 0 ms elapsed (grace period)', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    expect(
      deriveCollectionCadenceState({ lastCompletedRunFinishedAt: '2026-01-01T00:00:00.000Z', now })
    ).toEqual({ kind: 'fresh' });
  });

  it('returns fresh just under the 24h grace period', () => {
    const anchor = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(anchor) + DAY_MS - 1;
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now })).toEqual({
      kind: 'fresh',
    });
  });

  it('returns a 6-day countdown at exactly the 24h grace period', () => {
    const anchor = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(anchor) + DAY_MS;
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now })).toEqual({
      kind: 'countdown',
      daysRemaining: 6,
    });
  });

  it('returns a 1-day countdown at 6 days elapsed', () => {
    const anchor = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(anchor) + 6 * DAY_MS;
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now })).toEqual({
      kind: 'countdown',
      daysRemaining: 1,
    });
  });

  it('returns a countdown at 7x24h minus 1 ms elapsed (boundary)', () => {
    const anchor = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(anchor) + 7 * DAY_MS - 1;
    const state = deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now });
    expect(state.kind).toBe('countdown');
  });

  it('returns stale at exactly 7x24h elapsed (criterion 12)', () => {
    const anchor = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(anchor) + 7 * DAY_MS;
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now })).toEqual({
      kind: 'stale',
    });
  });

  it('returns stale at 10 days elapsed', () => {
    const anchor = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(anchor) + 10 * DAY_MS;
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now })).toEqual({
      kind: 'stale',
    });
  });

  it('clamps a future anchor to fresh, never a negative countdown', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const anchor = '2026-01-02T00:00:00.000Z';
    expect(deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now })).toEqual({
      kind: 'fresh',
    });
  });

  it('treats the boundary as exactly 168 real hours, not a calendar-day count, across a DST transition', () => {
    // US DST spring-forward: 2026-03-08 is the transition date in America/New_York, but this
    // arithmetic is UTC-epoch-ms only and must not care about local calendars at all.
    const anchor = '2026-03-08T00:00:00.000Z';
    const anchorMs = Date.parse(anchor);
    const hourMs = 60 * 60 * 1000;

    const justUnder168h = anchorMs + 167 * hourMs;
    expect(
      deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now: justUnder168h }).kind
    ).toBe('countdown');

    const exactly168h = anchorMs + 168 * hourMs;
    expect(
      deriveCollectionCadenceState({ lastCompletedRunFinishedAt: anchor, now: exactly168h })
    ).toEqual({ kind: 'stale' });
  });
});
