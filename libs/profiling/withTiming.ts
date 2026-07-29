export interface TimingResult<T> {
  result: T;
  durationMs: number;
  label: string;
}

export async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<TimingResult<T>> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs, label };
}
