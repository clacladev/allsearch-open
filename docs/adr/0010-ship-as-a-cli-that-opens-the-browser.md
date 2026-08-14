# Ship as a CLI that opens the browser; defer the desktop shell

## Status

Superseded in part on 2026-08-14: the maintainer authorized starting the
Electron shell (issue 24) as a starting point, ahead of the adoption evidence
this ADR originally called for. The sequencing argument below (forced private
phase, non-technical reach not yet known to be the bottleneck) no longer gates
*starting* the work — it was a reason to wait, not a technical objection, and
the maintainer chose to stop waiting. The technology choice — **Electron
running the standalone Next.js server on localhost, not Tauri, not Nextron** —
is unchanged; the rest of this document, including the rejected options below,
still holds.

AllSearch needs a JS server at runtime (RSC, route handlers, streaming),
so every packaging option reduces to "a webview or browser plus a Node process".
For the first version the browser is the user's own, started by a CLI that boots
the Next.js server on a free port and opens the default browser at it. No desktop
shell is built yet.

The sequencing argument is decisive: the repository cannot go public until
Untitled UI is replaced (ADR 0005), so there is a forced private phase during
which every user is either us or a deliberate tester. The packaging decision does
not need making until public launch, by which point we will know whether reach to
non-technical users is actually the bottleneck rather than assuming it. ComfyUI,
Jupyter, Open WebUI and Drizzle Studio all serve large non-developer populations
through exactly this flow.

When a desktop shell is built, it will be **Electron running the standalone
Next.js server on localhost**, not Tauri.

## Considered options

- **Tauri v2 with a JS sidecar.** Rejected. Its headline advantage is bundle
  size, and that does not survive contact with a JS server: the team who shipped
  Next.js standalone in a Tauri sidecar report ~160 MB, of which Node is ~84 MB,
  which is Electron-class. Against that we would take on a **documented streaming
  failure** — SSE from a localhost server dies silently inside WebView2, and the
  known workaround is to bypass the webview's network stack entirely — on a
  product whose core interactions are a streamed article generation and a
  streamed Collection Run. Add DIY port allocation, DIY kill-on-quit (Tauri has
  an open feature request for sidecar lifecycle management), no maintained
  template, and a broken `bun build --compile` path for Next standalone.
- **Nextron.** Disqualified: it requires `output: 'export'`, which forecloses
  RSC, route handlers and server-side SQLite.
- **Electron now.** Viable and well-trodden, and the $99/year Apple Developer fee
  is trivial next to the Supabase and Vercel bills being retired. Deferred only
  because the private phase makes it unnecessary today, and the ongoing cost is
  the packaging matrix and CI, not the money.

## Consequences

- **Bun is the toolchain, Node is the runtime.** `bun install`, `bun run` and
  `bun test` all stay. Running the server *under* Bun is rejected: there is an
  open memory leak where JSC's garbage collector fails to reclaim heap under
  Next.js SSR load, which is disqualifying for a long-lived server process.
- No Homebrew formula is planned. Distribution is the npm package, run via
  `bunx` / `npx`.
- This defers rather than avoids a real problem: the stated goal is an app the
  user launches, and a terminal command does not deliver that for agency
  marketers. It is a debt to be paid at public launch, not a decision that it
  does not matter.
- Signing becomes unavoidable the moment a native app ships. macOS Sequoia
  removed the Control-click bypass, so an unsigned app costs the user a five-step
  trip through System Settings, and from **2026-09-01** Homebrew will no longer
  accept casks that fail Gatekeeper. Budget the $99/year at that point.
