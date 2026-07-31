import { describe, it, expect } from 'bun:test';
import { createConcurrencyLimiter } from '@/libs/collection/concurrencyLimiter';

describe('createConcurrencyLimiter', () => {
  it('never runs more tasks than the limit at once, and reports the true peak', async () => {
    const limiter = createConcurrencyLimiter(3);
    let inFlight = 0;
    let observedMax = 0;

    const tasks = Array.from({ length: 50 }, () =>
      limiter.run(async () => {
        inFlight += 1;
        observedMax = Math.max(observedMax, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;
      })
    );

    await Promise.all(tasks);

    expect(observedMax).toBe(3);
    expect(limiter.getPeakInFlightCount()).toBe(3);
    expect(limiter.getInFlightCount()).toBe(0);
  });

  it('releases a slot when a task rejects, so the next queued task still runs', async () => {
    const limiter = createConcurrencyLimiter(1);

    await expect(
      limiter.run(async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    let didSecondTaskRun = false;
    await limiter.run(async () => {
      didSecondTaskRun = true;
    });

    expect(didSecondTaskRun).toBe(true);
    expect(limiter.getInFlightCount()).toBe(0);
  });

  it('admits queued tasks in FIFO order', async () => {
    const limiter = createConcurrencyLimiter(1);
    const order: string[] = [];
    let releaseFirst: () => void = () => {};

    const firstStarted = new Promise<void>((resolveStarted) => {
      void limiter.run(async () => {
        order.push('first');
        resolveStarted();
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      });
    });
    await firstStarted;

    // Enqueued while `first` is still holding the only slot, so admission order proves FIFO.
    const second = limiter.run(async () => {
      order.push('second');
    });
    const third = limiter.run(async () => {
      order.push('third');
    });

    releaseFirst();
    await Promise.all([second, third]);

    expect(order).toEqual(['first', 'second', 'third']);
  });

  it('propagates both the resolved value and the rejection reason', async () => {
    const limiter = createConcurrencyLimiter(2);

    await expect(limiter.run(async () => 'ok')).resolves.toBe('ok');
    await expect(
      limiter.run(async () => {
        throw new Error('specific failure');
      })
    ).rejects.toThrow('specific failure');
  });

  it('resetCounters brings the peak back down to the current in-flight count', async () => {
    const limiter = createConcurrencyLimiter(2);
    await limiter.run(async () => {});
    expect(limiter.getPeakInFlightCount()).toBe(1);

    limiter.resetCounters();
    expect(limiter.getPeakInFlightCount()).toBe(0);
  });
});
