# [MEDIUM] shell.openExternal called with attacker-influenced URLs and no scheme allowlist

**File:** [`desktop/main.ts`](https://github.com/clacladev/allsearch-open/blob/clacladev/san-salvador/blob/clacladev/desktop/main.ts#L70-L71) (lines 70, 71)
**Project:** san-salvador
**Severity:** MEDIUM  •  **Confidence:** medium  •  **Slug:** `other-unsafe-external-open`

**Status:** resolved

## Owners

**Suggested assignee:** `claudio@tugulab.org` _(via last-committer)_

## Finding

In createWindow(), the setWindowOpenHandler intercepts any renderer-initiated window.open / target="_blank" navigation and, when the target URL's origin differs from the loopback allowedOrigin, passes the raw URL straight to shell.openExternal with no scheme validation:

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (new URL(targetUrl).origin !== allowedOrigin) void shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

The only guard is an origin inequality check. For non-http(s) schemes (file://, custom protocol handlers, etc.) new URL(...).origin is the string "null", which never equals the loopback origin, so those URLs are forwarded to shell.openExternal. The Electron security guidance is to restrict shell.openExternal to http(s) and reject/normalize everything else, because shell.openExternal delegates to the OS handler for the scheme.

This sink is reachable from attacker-influenced content. The app renders scraped competitor/citation URLs and chatbot-response markdown links directly as <a href={source.url} target="_blank" rel="noopener noreferrer nofollow"> (e.g. app/(private)/project/[projectId]/sources/[sourceId]/components/SourceDetails.tsx, .../opportunities/.../OpportunityDetails.tsx, and the markdown `a` renderer in PromptResponseDetailModal.tsx which passes through arbitrary href values from chatbot output). The Markdown component in particular forwards any href produced by a chatbot response, and the project's own threat model notes that scraped competitor HTML / chatbot citations are a prompt-injection surface. A malicious scraped page or injected chatbot citation can therefore supply a link such as file:///path or a registered custom-scheme URL; when the single user clicks it, shell.openExternal invokes the OS handler for that scheme — opening local files in their default application or launching any registered protocol handler. CitationsPanel.tsx pins `https://${source.cleanUrl}` and is safe, but the other render sites use raw source.url / markdown hrefs.

Exploitation requires user interaction (clicking a link in the local UI) and a malicious URL reaching a rendered link, so impact is bounded, but the missing scheme allowlist is a well-known Electron anti-pattern and the data path from scraped/chatbot content to the handler is real.

## Recommendation

Before calling shell.openExternal, parse the URL and restrict to http: and https: schemes only (e.g. `const u = new URL(targetUrl); if (u.protocol === 'http:' || u.protocol === 'https:') shell.openExternal(u.href);`). For any other scheme, drop the request or show the URL as non-clickable text. Additionally, consider sanitizing rendered href values (source.url and markdown link hrefs) to http(s) only so non-web schemes never appear as clickable links in the first place.

## Revalidation

**Verdict:** true-positive

desktop/main.ts L70-71 confirms setWindowOpenHandler only guards `new URL(targetUrl).origin !== allowedOrigin` before calling shell.openExternal(targetUrl) with no scheme validation. For non-http(s) schemes new URL(...).origin is the string "null", which never equals the loopback origin, so file:// and custom-protocol URLs are forwarded to the OS handler. The data path from attacker-influenced content to this sink is real: SourceDetails.tsx (SourceHeader), OpportunityDetails.tsx (TargetSourceSection), and PromptResponseDetailModal.tsx (SourcesList and the react-markdown `a` renderer, which forwards arbitrary chatbot-produced hrefs including processPerplexityCitations output) all render `<a href={source.url} target="_blank">`. source.url is stored verbatim from chatbot provider responses (libs/ai/responseSources.ts) and from scraped pages, with no scheme validation; getSafeNewUrl only prepends https:// for cleanUrl computation, not for the stored url field. CitationsPanel.tsx is safe (pins https://${source.cleanUrl}), but the other render sites are not. This is a well-known Electron anti-pattern (missing scheme allowlist on shell.openExternal) reachable via prompt-injection-exposed scraped/chatbot content, bounded by requiring a user click. MEDIUM is appropriate.

## Recent committers (`git log`)

- clacladev <claudio@tugulab.org> (2026-08-14)
