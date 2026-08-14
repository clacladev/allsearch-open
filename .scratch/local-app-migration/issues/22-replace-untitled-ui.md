# 22 — Public-release UI provenance gate

Status: ready-for-human
Milestone: 8 — Public release gate

The legacy Untitled UI source and direct dependencies have been removed. Deliverable 10's local source, dependency, standalone-output, and package-content audits found no live Untitled UI source, `@untitledui/icons`, direct `react-aria`, React Aria Tailwind plugin, or `untitledui.com` references. The replacement is vendored shadcn/ui source built on Base UI, with Tailwind CSS v4 and Lucide icons.

`react-aria-components` remains deliberately: route integration, tables, and filters use it. Its `react-aria`, `react-stately`, and `@internationalized/*` entries remain transitive lockfile dependencies, not direct package dependencies.

The unused SaaS-era marketing assets under `public/index/` (landing page, pricing, testimonials, AI-provider logos — 24 files, ~1.8 MB) were leftover from the pre-migration import and unreferenced anywhere in `app/`, `libs/`, or `components/`; they have been deleted. The only assets remaining under `public/index/` are `dashboard-desktop-light.webp` and `dashboard-desktop-dark.webp`, first-party screenshots of this product's own dashboard used in onboarding. `resources/` (favicons, logo) is the maintainer's own branding.

## Remaining maintainer gates

None. The maintainer reviewed the completed migration and audits and gave explicit public-release
signoff on 2026-08-14, removing the `private` guard from `package.json` (AGENTS.md). Publishing a
version to npm remains the maintainer's own deliberate action.
