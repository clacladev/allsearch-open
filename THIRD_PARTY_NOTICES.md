# Third-party notices

AllSearch Local vendors generated source from the following MIT/ISC-licensed
projects into `components/ui/` and `libs/utils/`. This is attribution, not a
legal license review — local product-asset provenance and explicit maintainer
public-release signoff remain required under ADR 0005 and issue 22.

## shadcn/ui

MIT License. https://ui.shadcn.com — generated component source is copied into
`components/ui/` per shadcn's own distribution model (copy-into-your-repo, not
an installed dependency).

## Base UI

MIT License. https://base-ui.com — the unstyled primitive layer shadcn/ui
generates against for this project (selected explicitly; see ADR 0005).

## Lucide

ISC License. https://lucide.dev — icon set used via `lucide-react`.

## Sonner

MIT License. https://sonner.emilkowalski.com — toast primitive generated as
`components/ui/sonner.tsx`.

Exact generated file inventory, versions, and generation dates are tracked in
`.scratch/untitled-ui-to-shadcn/inventory.md` ("Generated-source ledger").
Deliverable 10 removed the legacy Untitled UI source and direct package
dependencies; no Untitled notice remains required for shipped source.
