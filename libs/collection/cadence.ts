// Client-safe: this file must not import `server-only`, `@/libs/database/client`, or any
// `queries.ts`. Client components import it directly, never via the `@/libs/collection` barrel
// (that barrel pulls in server-only modules).

import { COLLECTION_CADENCE_MS } from './constants';

export type CollectionCadenceState =
  | { kind: 'unknown' } // no Run has ever completed — show nothing
  | { kind: 'countdown'; daysRemaining: number }
  | { kind: 'stale' };

export function deriveCollectionCadenceState(input: {
  lastCompletedRunFinishedAt: string | null;
  now: number;
}): CollectionCadenceState {
  if (input.lastCompletedRunFinishedAt === null) return { kind: 'unknown' };

  const parsed = Date.parse(input.lastCompletedRunFinishedAt);
  if (Number.isNaN(parsed)) return { kind: 'unknown' };

  // Clamps a stored timestamp ahead of the client clock — never render a negative countdown.
  const elapsedMs = Math.max(0, input.now - parsed);
  const remainingMs = COLLECTION_CADENCE_MS - elapsedMs;

  // Exactly 7x24h elapsed is stale — criterion 12.
  if (remainingMs <= 0) return { kind: 'stale' };

  return { kind: 'countdown', daysRemaining: Math.max(1, Math.ceil(remainingMs / 86_400_000)) };
}
