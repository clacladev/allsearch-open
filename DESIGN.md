# AllSearch Design System

AllSearch uses Tailwind CSS v4, shadcn/ui's vendored Base UI primitives, and Lucide icons. Keep product UI direct, calm, and accessible.

## Foundations

| Need | Location |
| --- | --- |
| Product semantic tokens and shadcn mappings | `styles/shadcn-theme.css` |
| Global base styles and variants | `styles/globals.css` |
| Typography | `styles/typography.css` |
| Generated primitives | `components/ui/` |
| Class-name merge helper | `libs/utils/cn.ts` |
| Icons | `lucide-react` |

Use Tailwind utilities and the semantic tokens in `styles/shadcn-theme.css`. The catalog retains the established product color roles and adds collision-safe `shadcn-primary` and `shadcn-secondary` roles for generated primitives. Do not add a second theme file or a compatibility helper.

Use existing `components/ui/` primitives before writing a custom control. They are vendored source: inspect the pinned shadcn CLI's `--view` and `--diff` output before applying a reviewed update. Never bulk-overwrite generated components.

Use `cn` from `@/libs/utils/cn` for conditional or merged class names. Use `lucide-react` icons; custom product SVGs remain under `public/` or `resources/` and require maintainer provenance review before public release.

## Accessibility and behavior

Build interactive controls from the existing Base UI or React Aria Components seam. Keep labels associated with inputs, support keyboard navigation, and preserve visible focus. Test affected surfaces in the behavioral and visual Playwright suites.

## Release boundary

The legacy Untitled UI source and direct packages were removed in Deliverable 10. The unused SaaS-era marketing assets under `public/index/` (landing page, pricing, testimonials, AI-provider logos) were removed as dead weight; the only assets remaining under `public/index/` are the two first-party dashboard screenshots used in onboarding (`dashboard-desktop-{light,dark}.webp`). The maintainer gave explicit public-release signoff on 2026-08-14 and removed the `private` guard from `package.json` (see `AGENTS.md`); this repository is no longer private-by-policy.
