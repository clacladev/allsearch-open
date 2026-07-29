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

export async function appFetch<T>(
  input: string | URL | Request,
  init?: RequestInit,
  genericError?: string
): Promise<T> {
  const response = await fetch(input, init);
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
