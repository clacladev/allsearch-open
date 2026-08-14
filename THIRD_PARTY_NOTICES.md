# Third-party notices

AllSearch vendors generated source from the following MIT/ISC-licensed
projects into `components/ui/` and `libs/utils/`. This is attribution, not a
legal license review. Local product-asset provenance was reviewed and the
maintainer gave explicit public-release signoff on 2026-08-14 (ADR 0005, issue 22).

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

## Product assets

The unused SaaS-era marketing assets under `public/index/` (landing page,
pricing, testimonials, AI-provider logos) have been removed. The only assets
remaining there are `dashboard-desktop-light.webp` and
`dashboard-desktop-dark.webp`, first-party screenshots of this product's own
dashboard used in onboarding — not third-party content.
