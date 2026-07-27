export function routerPushShallow(path: string, query?: Record<string, string>) {
  window.history.pushState(
    null,
    '',
    path + (query ? '?' + new URLSearchParams(query).toString() : '')
  );
}
