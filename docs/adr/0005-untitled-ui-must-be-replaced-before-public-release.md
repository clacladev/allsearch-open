# Replace legacy UI before public release

## Status

Implemented locally; public release remains maintainer-gated.

## Decision

AllSearch vendors reviewed shadcn/ui source in `components/ui/`, using Base UI primitives, Tailwind CSS v4, and Lucide icons. The legacy Untitled UI source trees, the `@untitledui/icons` direct dependency, and the obsolete direct React Aria Tailwind plugin have been removed.

The canonical styling seam is `styles/shadcn-theme.css`, which contains the established product semantic catalog and the shadcn mappings. `libs/utils/cn.ts` is the only class-name merge helper. `react-aria-components` remains a direct dependency because application tables, filters, and route integration use it; its `react-aria` and internationalization packages remain legitimate transitive dependencies.

## Consequences

- `components/ui/` is vendored generated source, not a package. Update one reviewed component at a time with the pinned shadcn CLI's `--view`/`--diff` workflow; never bulk-overwrite it.
- `package.json` remains `private: true`. Agents may build and inspect packages locally but must not publish.
- Deliverable 10's source, dependency, standalone-output, and package-content audits found no live legacy UI, icon-package, or `untitledui.com` references.
- Local product assets still require maintainer provenance review, and public release requires the maintainer's explicit signoff. Those gates are not resolved by this implementation.
