import { MAX_CONCURRENT_AI_CALLS } from './constants';

export type ConcurrencyLimiter = {
  run<T>(task: () => Promise<T>): Promise<T>;
  getInFlightCount(): number;
  /** Highest simultaneous in-flight count since the last `resetCounters()`. Exists so a test can
   *  assert the limit was never exceeded under load (issue 10 Done-when #3). */
  getPeakInFlightCount(): number;
  resetCounters(): void;
};

/** Hand-rolled FIFO limiter — no `p-limit` dependency (`bunfig.toml`'s `minimumReleaseAge` blocks
 *  adding one on short notice). A waiting caller's slot is granted by `release()` shifting the
 *  queue, so admission order matches call order. */
export function createConcurrencyLimiter(limit: number): ConcurrencyLimiter {
  const queue: Array<() => void> = [];
  let inFlight = 0;
  let peakInFlight = 0;

  const acquire = (): Promise<void> =>
    new Promise((resolve) => {
      const admit = () => {
        inFlight += 1;
        peakInFlight = Math.max(peakInFlight, inFlight);
        resolve();
      };
      if (inFlight < limit) {
        admit();
        return;
      }
      queue.push(admit);
    });

  const release = (): void => {
    inFlight -= 1;
    const admitNext = queue.shift();
    if (admitNext) admitNext();
  };

  return {
    async run<T>(task: () => Promise<T>): Promise<T> {
      await acquire();
      try {
        return await task();
      } finally {
        // Runs even when `task` rejects, so a failing call never leaks a slot.
        release();
      }
    },
    getInFlightCount: () => inFlight,
    getPeakInFlightCount: () => peakInFlight,
    resetCounters: () => {
      peakInFlight = inFlight;
    },
  };
}

/** The one limiter every LLM call in a Collection Run passes through — the grounded Chatbot call
 *  and the per-Prompt-Response Sentiment call alike. */
export const aiCallLimiter: ConcurrencyLimiter = createConcurrencyLimiter(MAX_CONCURRENT_AI_CALLS);
