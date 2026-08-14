# Replace legacy UI before public release

## Status

Implemented. The maintainer reviewed local product-asset provenance, gave explicit public-release
signoff, and removed the `private` guard from `package.json` on 2026-08-14 (see AGENTS.md).

## Decision

AllSearch vendors reviewed shadcn/ui source in `components/ui/`, using Base UI primitives, Tailwind CSS v4, and Lucide icons. The legacy Untitled UI source trees, the `@untitledui/icons` direct dependency, and the obsolete direct React Aria Tailwind plugin have been removed.

The canonical styling seam is `styles/shadcn-theme.css`, which contains the established product semantic catalog and the shadcn mappings. `libs/utils/cn.ts` is the only class-name merge helper. `react-aria-components` remains a direct dependency because application tables, filters, and route integration use it; its `react-aria` and internationalization packages remain legitimate transitive dependencies.

## Consequences

- `components/ui/` is vendored generated source, not a package. Update one reviewed component at a time with the pinned shadcn CLI's `--view`/`--diff` workflow; never bulk-overwrite it.
- `package.json`'s `private` guard was removed by the maintainer on 2026-08-14 once the gates below were resolved (AGENTS.md). Publishing to npm itself remains the maintainer's own deliberate action, not something an agent runs unprompted.
- Deliverable 10's source, dependency, standalone-output, and package-content audits found no live legacy UI, icon-package, or `untitledui.com` references.
- Local product-asset provenance review and the maintainer's explicit public-release signoff — both flagged as open by this implementation — were completed 2026-08-14. The unused SaaS-era marketing assets under `public/index/` were deleted as part of that review; the only assets remaining there are first-party dashboard screenshots.
