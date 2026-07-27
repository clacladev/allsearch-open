import { PostHog } from 'posthog-node';

let posthogInstance: PostHog | undefined;

export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'not-defined', {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogInstance;
}

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}
