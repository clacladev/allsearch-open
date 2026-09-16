# Packaging and release guide

This guide is for maintainers packaging AllSearch. For normal application
use, see the [README](../README.md).

## Verify the CLI package locally

```bash
bun run build:package
npm pack
bun run start:cli
```

`build:package` produces the files shipped by the npm package:

- the Next.js standalone server under `.next/standalone/`
- the CLI bundle at `dist/cli.mjs`
- database migrations under `drizzle/`

`npm pack` invokes `prepack`, which runs `bun run build:package` automatically.
The CLI bundle copies `.next/static` and `public/` into the standalone output;
the build rationale is documented in `next.config.ts`.

The package is not necessarily published just because this repository is public.
Until a version is published, `bunx allsearch` cannot resolve it.

## Stage or build the desktop app

```bash
bun run build:desktop:stage # Build and stage Electron resources
bun run start:desktop       # Launch the staged app
bun run test:desktop        # Run Electron runtime, asset, and cleanup coverage
bun run build:desktop       # Build unsigned Apple-Silicon DMG in release/desktop/
```

The desktop build and CLI share the local server runtime and database lock. The
desktop release is an unsigned Apple-Silicon DMG. The DMG also ships a
`Fix AllSearch.command` helper (`resources/dmg/`, wired via `dmg.contents` in
`electron-builder.yml`): after dragging the app to Applications, double-clicking
it runs `xattr -cr /Applications/AllSearch.app` and opens the app. Keep the
script executable (`chmod +x`) — git preserves the bit. The DMG window
background (`resources/dmg/background.tiff`, 1376×768 source used unmodified:
688×384 1x + 2x combined with
`tiffutil -cathidpicheck bg-1x.png bg-2x.png -out resources/dmg/background.tiff`).
The window is 688×420, slightly taller than the 688×384 image; the uncovered
36px strip at the bottom renders in Finder's default background, which blends
with the image's near-white (`#F0F1F3`) bottom edge. (Note: electron-builder
rejects setting `dmg.background` and `dmg.backgroundColor` together, so no
`backgroundColor` is set.) Icon positions in `dmg.contents` were measured against the
background's baked-in arrow/badges — re-measure if the image changes.

Electron's own `postinstall` (which downloads and unpacks `Electron.app` into
`node_modules/electron`) silently hangs on Node.js 26: `extract-zip` stalls
after the first file and the process exits 0 as if nothing were wrong, leaving
`node_modules/electron` without a real binary and `start:desktop` failing with
"Electron failed to install correctly". It works on Node 24. A `.node-version`
file pins this repo to 24.18.0; run `fnm use` (or let fnm's shell hook pick it
up automatically) before installing if `node_modules/electron` ever needs a
fresh download.

## Publish to npm

Publishing is a deliberate maintainer action. Before publishing, set a new
version in `package.json` because npm rejects an existing version.

```bash
npm login
npm publish
```

`npm publish` runs `prepack` and therefore rebuilds the package.
