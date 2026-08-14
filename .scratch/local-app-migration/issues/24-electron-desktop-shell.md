# 24 — Electron desktop shell

Status: ready-for-agent
Milestone: 8 — Public release gate
Blocked by: 23

**Was deferred deliberately, gated on adoption evidence (ADR 0010). The
maintainer reversed that on 2026-08-14 and authorized starting this as a
starting point** — see the Status note added to ADR 0010. The rest of this
ticket's technical guidance (Electron, not Tauri/Nextron; budget items) still
applies.

The stated goal for this product is an app the user launches, and `bunx allsearch`
does not deliver that for the agency marketers who are the intended audience.
This ticket is the debt. It is deferred, not dismissed, because the repository
cannot go public until issue 22 lands anyway, so during the private phase every
user is technical and a CLI is fine.

**When it happens, it is Electron running the standalone Next.js server on
localhost.** Not Tauri, not Nextron — both were assessed and rejected in ADR
0010. Nextron requires `output: 'export'`, which forecloses RSC and route
handlers. Tauri's size advantage evaporates once a JS server sidecar is added
(~160 MB, of which Node is ~84 MB), and streaming over SSE into WebView2 is a
documented silent-failure mode whose known workaround is to bypass the webview's
network stack entirely — unacceptable for a product whose two core interactions
are a streamed article and a streamed Collection Run.

**Work involved:** boot the standalone server on a dynamic port in the main
process or a forked child, point a `BrowserWindow` at it, kill the server on
quit, and package with electron-builder. `node:sqlite` (issue 04) means no native
module rebuilds, no `asarUnpack` and no ABI churn — that decision was made partly
for this ticket.

**Then verify streaming actually works inside Chromium-in-Electron**, especially
the Collection Run progress and article generation. It should, since Electron is
the engine you develop against, but prove it rather than assume it.

**Budget the costs before committing:**

- **Apple Developer Program, $99/year.** Effectively mandatory. macOS Sequoia
  removed the Control-click bypass, so an unsigned app costs the user a five-step
  trip through System Settings, and from **2026-09-01** Homebrew no longer accepts
  casks that fail Gatekeeper.
- **Windows signing** is optional at first; SmartScreen is frightening but
  survivable, and signing does not confer instant reputation anyway.
- **Auto-update** via electron-updater against GitHub Releases is free, but
  macOS auto-update requires the app to be signed — a Squirrel.Mac requirement,
  not a policy.

The real ongoing cost is not the money, it is a packaging matrix and a CI
pipeline maintained forever by one person. That is the thing to weigh.

## Done when

- Decided, with a reason, based on evidence about who is failing to install the
  CLI. Not before.
