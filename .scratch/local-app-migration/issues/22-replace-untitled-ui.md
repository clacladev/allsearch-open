# 22 — Public-release UI provenance gate

Status: ready-for-human
Milestone: 8 — Public release gate

The legacy Untitled UI source and direct dependencies have been removed. Deliverable 10's local source, dependency, standalone-output, and package-content audits found no live Untitled UI source, `@untitledui/icons`, direct `react-aria`, React Aria Tailwind plugin, or `untitledui.com` references. The replacement is vendored shadcn/ui source built on Base UI, with Tailwind CSS v4 and Lucide icons.

`react-aria-components` remains deliberately: route integration, tables, and filters use it. Its `react-aria`, `react-stately`, and `@internationalized/*` entries remain transitive lockfile dependencies, not direct package dependencies.

## Remaining maintainer gates

- Review provenance and redistribution rights for local product assets under `app/`, `resources/`, and `public/`; Deliverable 10 did not replace, remove, or assert ownership of them.
- Give explicit public-release signoff after reviewing the completed migration and audits.

Until both gates are resolved, `package.json` must stay `private: true` and no agent may publish the package or repository.
