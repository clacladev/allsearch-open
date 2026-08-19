export class AppFetchError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AppFetchError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Marks the request as coming from this app's own client-side JS. Cross-site requests that
 * suppress Origin/Referer (e.g. `fetch(url, { mode: 'no-cors', referrerPolicy: 'no-referrer' })`
 * or an `<img>` tag) cannot set custom headers, so proxy.ts uses this to lock down GET routes
 * with paid side effects that would otherwise fall through the "no headers = trusted" case.
 */
const APP_FETCH_HEADER = { 'X-Requested-With': 'AllSearch' };

export async function appFetch<T>(
  input: string | URL | Request,
  init?: RequestInit,
  genericError?: string
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { ...APP_FETCH_HEADER, ...init?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      genericError ||
      'Unknown error';
    const code = typeof data.code === 'string' ? data.code : undefined;
    throw new AppFetchError(message, response.status, code);
  }
  return data as T;
}
