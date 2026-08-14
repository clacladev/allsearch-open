# Untitled UI to shadcn/ui migration

Status: ready-for-human
Parent gate: `.scratch/local-app-migration/issues/22-replace-untitled-ui.md`
External prerequisite: the end-to-end UI suite being completed in a separate workspace
Research date: 2026-08-12

Implementation status: complete. The provenance review for retained product assets (`BLOCK-004` in
`inventory.md`) is resolved: the unused SaaS-era marketing assets were deleted, and the maintainer
gave explicit public-release signoff on 2026-08-14, removing the `private` guard from
`package.json` (AGENTS.md).

## Objective

Replace every Untitled UI runtime and source dependency with an AllSearch-owned UI layer seeded
from shadcn/ui's Base UI implementation. Preserve AllSearch's product identity, information
hierarchy, density, responsive behavior, accessibility, and workflows while accepting normal
shadcn geometry and interaction details.

The migration is complete only when the repository can be published without distributing
Untitled UI source or assets. This plan is not legal advice; the final public-release review must
confirm the applicable licence terms and retained third-party notices.

## Agreed decisions

1. Use shadcn/ui with **Base UI**, selected explicitly rather than inherited from a changing CLI
   default.
2. Preserve AllSearch's brand and behavior, not pixel-level Untitled parity. This is not a product
   redesign.
3. Remove all Untitled runtime and code dependencies, including `@untitledui/icons`, remote image
   URLs, copied assets, implementation source, and derived theme source. Historical ADRs and
   migration records may continue to name Untitled UI.
4. Freeze routes, terminology, workflows, and business behavior. Record unrelated UX improvements
   as later work.
5. Put generated shadcn primitives in `components/ui/`. Put genuine app-wide composites in
   `components/shared/`. Keep feature-specific compositions beside their routes.
6. Build the new tree beside the old one. Do not convert a licensed source file in place and do
   not reproduce the old component interfaces as a compatibility facade.
7. Foundation work may start before the E2E suite lands. No production screen crosses to the new
   UI until its E2E behavior and screenshot baseline are merged and green.
8. Use the official shadcn skill after `components.json` exists. Do not require the shadcn MCP
   server initially.

## Non-goals

- Redesigning navigation, flows, copy, data presentation, or responsive information hierarchy.
- Migrating database, AI, routing, or business logic as part of UI slices.
- Recreating every Untitled variant or preserving its prop interfaces.
- Introducing a monorepo or a separately published component package. AllSearch has one UI
  consumer, so the UI remains app-local.
- Adding Storybook or a production component-gallery route solely for this migration.
- Publishing the package or repository. Publication remains a manual maintainer action.

## Current footprint

The initial audit found:

| Surface                                                                             | Current size |
| ----------------------------------------------------------------------------------- | -----------: |
| Files under `components/`                                                           |          133 |
| TypeScript/TSX lines under `components/`                                            |       17,876 |
| Files importing `components/base`, `application`, `foundations`, or `shared-assets` |          137 |
| Application files importing those shared trees                                      |          100 |
| Files importing `@untitledui/icons`                                                 |          102 |
| `styles/theme.css`                                                                  |    877 lines |
| Direct `untitledui.com` runtime/sample references                                   |            5 |

The highest-volume shared imports are Button (53), LoadingIndicator (31), Badge (24), Input (15),
InputGroup (11), and Table (10). The component dependency graph also identifies Button as the main
cross-community bridge, followed by shared icon, label, hint, badge, select, and tooltip types.

These numbers are planning baselines, not a licence classification. The first deliverable must
classify each file as one of:

- licensed legacy implementation;
- AllSearch-specific module that only consumes legacy UI;
- asset requiring provenance review;
- framework/provider glue that may remain;
- unused code that should be deleted rather than migrated.

The inventory should record path, callers, old primitives, proposed target, interaction risk,
test coverage, asset provenance, and deletion status. It becomes the authoritative burn-down list.

## Target UI architecture

```text
app/**/components/         Route-specific compositions and behavior
          │
          ├── components/shared/   Reused AllSearch modules with product semantics
          │          │
          │          └── components/ui/   Generated and locally maintained shadcn primitives
          │
          └─────────────────────────────── components/ui/ (simple direct use is allowed)
```

### `components/ui/`

This is the locally owned shadcn source layer. Keep its interfaces close to the upstream Base UI
registry so `shadcn diff`, documentation, and future updates stay useful. Token changes belong in
the theme; product behavior does not belong in copied primitives.

### `components/shared/`

Create a module here only when it earns leverage across real callers. Likely examples are a
validated form field, save/status feedback, confirmation dialog, data-table shell, page header,
and application navigation shell. Do not wrap Button, Badge, or every other primitive merely to
hide that shadcn is in use.

### Route-local modules

Keep feature vocabulary and behavior close to the route. A Prompt table, Opportunity details
panel, or Collection Run status surface may use shared modules and primitives, but it should not
turn `components/shared/` into a second generic design system.

### Clean-source rule

New files may use the old application only as an observable behavior and visual reference. Do not
copy old implementation code, comments, class lists, SVG paths, prop definitions, or internal
structure. Generate shadcn source from the pinned registry configuration, compose it using
AllSearch domain needs, switch callers, and delete the old source separately.

## Foundation configuration

The foundation deliverable must preview and then freeze all initialization-time choices before it
adds production components. The planned defaults are:

| Setting                 | Planned value                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Primitive base          | Base UI, explicit                                                                     |
| Style                   | Current standard shadcn style (`new-york` unless the pinned CLI names it differently) |
| Base color              | Neutral                                                                               |
| CSS variables           | Enabled                                                                               |
| Language                | TSX                                                                                   |
| React Server Components | Enabled; add `use client` only where generated behavior requires it                   |
| UI alias                | `@/components/ui`                                                                     |
| Shared modules          | `@/components/shared`                                                                 |
| Utility alias           | `@/libs/utils` or a dedicated `@/libs/ui`, decided before `init`                      |
| Global CSS              | `styles/globals.css`                                                                  |
| Icons                   | Lucide                                                                                |
| Brand                   | Existing seafoam identity expressed through semantic tokens                           |
| Dark mode selector      | Continue `.dark-mode` during coexistence unless the pilot proves a safe atomic switch |

Before accepting `init`, save its dry-run or isolated-workspace diff and inspect every dependency,
CSS edit, alias, and generated file. Record the resolved CLI version, preset, base, icon set, and
generation date. Never run broad `add --all --overwrite` or `apply` across customized components.

### Theme seam

Create a clean semantic token set for background/foreground, card, popover, primary, secondary,
muted, accent, destructive, border, input, ring, charts, radius, typography, and AllSearch status
colors. Map the seafoam brand into `primary` and related semantic roles. Define light and dark
values once and expose them to Tailwind v4 with `@theme inline`.

The existing 877-line `styles/theme.css` remains legacy during coexistence. New components must
use only the clean semantic tokens. Remove legacy variables only after their final caller is gone;
do not perform a repository-wide class rename before the vertical slices.

## Component-family mapping

This is a planning map. Every slice must confirm the current Base UI registry interface before
implementation.

| Legacy family                           | Planned shadcn/AllSearch target                                    | Notes                                                                          |
| --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Buttons, close buttons, utility buttons | Button and IconButton-style composition                            | Establish variants early; avoid recreating every old size/variant.             |
| Form, label, hint, input, input group   | Field, FieldGroup, Input, InputGroup, Textarea                     | Preserve accessible names, validation, required state, and adornments.         |
| Checkbox and radio controls             | Checkbox, RadioGroup                                               | Test keyboard, disabled, invalid, checked, and indeterminate states.           |
| Button groups and option selectors      | ToggleGroup or purpose-built shared module                         | Choose by semantics rather than appearance.                                    |
| Select, native select, tags, combobox   | Select, NativeSelect, Combobox, Command/Popover as appropriate     | Dedicated high-interaction slice; do not force one primitive onto every use.   |
| Dropdown                                | DropdownMenu                                                       | Verify destructive items, links, focus return, and Escape.                     |
| Tooltip                                 | Tooltip                                                            | Central provider/delay policy belongs in the app shell.                        |
| Badge and dot variants                  | Badge plus a small AllSearch status variant map                    | Replace icon-type coupling with Lucide types or rendered nodes.                |
| Avatar                                  | Avatar                                                             | Remove Untitled sample accounts and remote avatars.                            |
| PIN input                               | InputOTP                                                           | Retain only if still used.                                                     |
| Progress and loading                    | Progress, Spinner, Skeleton, and button pending state              | Prefer contextual pending feedback over one universal spinner.                 |
| Alerts and toast helpers                | Alert and Sonner                                                   | Preserve success/error announcements and async feedback.                       |
| Modal and confirmation                  | Dialog and AlertDialog                                             | Test initial focus, trap, Escape, outside interaction, and return focus.       |
| Slideout                                | Sheet                                                              | Treat as a separate overlay migration.                                         |
| Tabs                                    | Tabs                                                               | Preserve accessible labels and activation behavior.                            |
| Empty states                            | Empty plus AllSearch composition                                   | Recreate illustrations only from clean, licensed sources.                      |
| Pagination                              | Pagination plus a shared data-navigation module                    | Preserve URL/search-param behavior outside the primitive.                      |
| Tables and filters                      | Table plus TanStack-based AllSearch data-table modules             | Separate display, sorting/filtering state, and pagination responsibilities.    |
| Date range picker                       | Calendar, DatePicker composition, and date utilities               | Exceptional module; preserve locale, range, presets, and keyboard behavior.    |
| Charts and metrics                      | shadcn Chart/Recharts plus AllSearch metric cards                  | Keep data calculation out of UI modules.                                       |
| Navigation                              | Sidebar/navigation primitives plus AllSearch shell                 | Dedicated responsive slice; preserve RouteHelper usage.                        |
| Carousel                                | Carousel                                                           | Migrate only if a live consumer remains.                                       |
| Section headers                         | Small shared AllSearch page/section header modules                 | Product composition, not a copied primitive.                                   |
| Social/payment/illustration assets      | Delete if unused; otherwise replace from verified licensed sources | Do not assume copied SVG paths can remain. Record notices and trademarks.      |
| `@untitledui/icons`                     | Lucide                                                             | Maintain an explicit semantic icon map; verify meaning, not visual similarity. |

## Delivery strategy

The migration uses one horizontal foundation followed by vertical product flows. A deliverable is
normally one coherent flow or one exceptional high-interaction module, covering roughly one to
three screens. Each must leave the app runnable and should delete an identifiable legacy cluster
when its final caller moves.

### Candidate deliverables

These are planning boundaries, not implementation tickets yet. Re-slice them against the merged
E2E inventory before marking any `ready-for-agent`.

#### 0. Inventory, baselines, and legal/provenance ledger

- Build the authoritative file/caller/component mapping.
- Mark unused source for deletion rather than migration.
- Record current package, asset, font, icon, and remote-URL provenance.
- Map every covered screen to its E2E behavior and light/dark visual baselines.
- Confirm which AI-dependent flows are excluded from continuous E2E and why.

This may proceed alongside the separate E2E effort, but its coverage columns cannot be finalized
until that work merges.

#### 1. shadcn/Base UI foundation

- Amend ADR 0005 to select Base UI and record the source-update policy.
- Preview and approve the preset; initialize `components.json` with explicit choices.
- Add `cn`, clean semantic theme tokens, Lucide, licence notices, and the minimum generated source.
- Install the official shadcn skill with `bunx skills add shadcn/ui` after `components.json`
  exists.
- Add Button, Field/Input, RadioGroup, Spinner, and toast support for the pilot only.
- Document the controlled update workflow: clean tree, pinned CLI, `view`/`dry-run`/`diff`, reviewed
  source changes, and targeted verification.

This deliverable must not switch a production page unless the relevant E2E baseline has merged.

#### 2. Foundation pilot: Organization settings

- Migrate `OrganizationSettingsForm`, which appears in both app-level and Project settings.
- Exercise Button, fields, radio selection, URL validation, async metadata loading, favicon adornment,
  pending save state, and success/error toast feedback.
- Provide before/after light and dark screenshots at fixed desktop and mobile viewports.
- Use the pilot result to freeze form composition, focus styling, density, error placement, pending
  behavior, and icon sizing before broader work.

#### 3. Settings and onboarding forms

- Migrate provider keys, Organization onboarding, Project creation, Brand, Competitors, Topics, and
  settings tabs in small flow-based tasks.
- Keep AI-backed onboarding specs tagged/on-demand according to ADR 0008.
- Extract a shared module only after the second real use demonstrates the seam.

#### 4. Application shell and navigation

- Migrate theme toggle, mobile header, side navigation, Project selector, account/settings links,
  tooltips, and responsive shell behavior.
- Establish the final overlay root, stacking, portal, tooltip-provider, and mobile focus conventions.
- Do not change routes or build paths outside `RouteHelper`/`ROUTES`.

#### 5. Dashboard display surfaces

- Migrate overview metric cards, charts, notices, collection progress, section headers, badges,
  empty states, and loading/error states.
- Keep metric/data logic unchanged and test sparse/gappy chart behavior separately from styling.

#### 6. Data exploration

- Migrate tables, column filters, date-range selection, pagination, Brand selector, source views,
  Prompt lists, and Opportunity lists.
- Split exceptional modules into their own tasks: data-table shell, select/combobox, and date range
  picker.
- Gate on keyboard navigation, URL/search-param persistence, responsive overflow, and empty/loading
  states.

#### 7. Editing overlays and actions

- Migrate create/edit Prompt sheets, topic selection, confirmation dialogs, response/source modals,
  dropdown actions, and destructive actions.
- Verify initial/return focus, tab containment, Escape, outside interaction, pending state, and
  accessible descriptions for each overlay.

#### 8. Prompt Article workflow

- Migrate outline controls, article settings, editor-adjacent actions, save status, badges, and
  download menus without changing generation or export behavior.
- Treat MDX editor integration styles as a separate, audited seam rather than folding them into the
  generated primitive layer.

#### 9. Rare states and asset cleanup

- Migrate not-found/error pages, remaining empty states, carousel/progress steps if still live, and
  any retained social/payment imagery.
- Delete unused showcase/sample components instead of recreating them.
- Replace every remaining remote Untitled URL and unverified asset.

#### 10. Final purge and public-release audit

- Delete the legacy `components/base`, `components/application`, `components/foundations`, and
  `components/shared-assets` trees once their classified AllSearch modules have moved.
- Remove `@untitledui/icons` and obsolete React Aria/date/state dependencies only when no deliberate
  consumer remains.
- Remove legacy theme tokens, plugins, comments, samples, URLs, and documentation instructions.
- Update README, tech stack, development guidelines, ADRs, and third-party notices.
- Run source, dependency, built-output, and local package-content audits for Untitled references.
- Run the complete verification matrix and obtain the maintainer's explicit public-release signoff.

## Slice readiness and completion gates

### Ready to implement

A slice is not `ready-for-agent` until:

- its routes and component callers are enumerated;
- its behavior and visual baselines exist on the target branch;
- any AI/provider requirements are identified;
- its old-to-new component mapping is written;
- intentional visual differences are bounded;
- it has no unresolved dependency on another active UI slice;
- the owner of the parallel E2E work is no longer editing the same tests.

### Done for every user-visible slice

- Relevant Playwright behavior flows pass.
- Locators use accessible roles, names, and labels. They do not preserve legacy class names,
  generated DOM nesting, primitive data attributes, or incidental test IDs.
- Light and dark screenshots are reviewed at fixed desktop and mobile viewports.
- Keyboard and focus behavior is covered for interactive primitives.
- Focused accessibility scans cover stable and opened-overlay states.
- `bun lint`, `bun tsc`, and relevant `bun test` pass.
- The applicable non-AI E2E subset passes; AI-dependent coverage remains explicit and on-demand.
- No new Untitled import, source, asset, class, URL, or package reference is introduced.
- Before/after visual evidence accompanies review.
- Legacy files made unreachable by the slice are deleted, and the inventory is updated.

Token-consistent changes to borders, radii, shadows, control geometry, and other standard shadcn
details are acceptable. Changes to hierarchy, density, responsive layout, terminology, or workflow
require explicit maintainer approval.

## Tooling and agent workflow

### Required

- Bun for installs and CLI execution, including `bunx shadcn@latest` rather than npm/pnpm/yarn.
- Official shadcn skill, installed into the project only after `components.json` exists. It should
  read the selected Base UI configuration before agents generate or compose components.
- Playwright for behavior, accessibility-tree assertions, and visual comparisons.
- Browser/manual verification for responsive layout, keyboard traversal, focus, and overlay behavior.
- Repository checks: `bun lint`, `bun tsc`, relevant `bun test`, and relevant
  `bun run test:e2e` runs.
- Visual-evidence capture for every user-visible implementation task.

Coordinate any `@axe-core/playwright` addition with the separate E2E owner rather than racing their
test infrastructure changes.

### Optional or deferred

- shadcn MCP: add only if registry browsing or installation through agents becomes a repeated
  bottleneck. Standard registry access and CLI `docs`, `view`, `info`, `dry-run`, and `diff` are
  sufficient initially.
- Figma: no plugin is required to preserve the existing product identity. Add it only if the
  maintainer creates an authoritative new design source.
- Storybook: defer unless later component-level coverage cannot be achieved economically through
  real screens and focused tests.
- A private registry/component package: do not create without a second real UI consumer.

## Parallel-work protocol in Conductor

- Give each vertical slice its own Conductor workspace and branch based on the latest `origin/dev`.
- Do not run two slices that edit the same shared primitive or global token file concurrently.
- Foundation owns `components.json`, theme tokens, `cn`, icon policy, notices, and initial primitive
  conventions. Later slices treat those as stable interfaces.
- The E2E workspace owns test infrastructure until merged. Migration slices may add route-specific
  assertions afterward but must not independently rewrite shared fixtures/configuration.
- Use the repository's concurrent Conductor run script and workspace-local SQLite path. No new
  Conductor plugin or MCP configuration is required for the plan.
- Rebase/merge the E2E baseline before the first production-screen migration and recapture a
  baseline when upstream product work intentionally changes a covered screen.

## Major risks and mitigations

| Risk                                             | Mitigation                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Licensed code survives under a new name          | Parallel clean source, provenance ledger, no in-place conversion, final source/build/package audit.       |
| Initialization defaults drift                    | Explicit Base/preset/config, record CLI version, review generated diffs.                                  |
| Generated updates overwrite customization        | Keep primitive edits small; require clean tree plus `view`, `dry-run`, and `diff`; never broad overwrite. |
| Old and new theme utilities collide              | Separate semantic token seam, controlled import order, no bulk class rename, delete legacy tokens last.   |
| Visual parity hides accessibility regressions    | Role/name locators, keyboard/focus tests, focused ARIA assertions and accessibility scans.                |
| Base UI portal/focus behavior differs            | Pilot complex interactions; establish one overlay root and stacking policy before overlay-heavy slices.   |
| Direct icon replacement changes meaning          | Semantic icon inventory and per-screen review; do not map only by shape/name similarity.                  |
| Horizontal primitive work creates huge diffs     | Foundation plus bounded vertical flows; add primitives only when a flow needs them.                       |
| Compatibility facade becomes permanent           | No Untitled-shaped facade; update callers to shadcn or purposeful AllSearch interfaces.                   |
| Parallel E2E and UI branches conflict            | Hard ownership of test infrastructure and a merge gate before production migration.                       |
| Unused showcase code consumes migration time     | Usage inventory first; delete unreachable components and assets.                                          |
| Public package still contains prohibited content | Inspect built standalone output and local package contents before manual release approval.                |

## Migration progress measures

Track these in the inventory after every slice:

- remaining files importing the legacy UI trees;
- remaining `@untitledui/icons` importers;
- remaining files classified as licensed legacy source;
- remaining remote Untitled URLs and unverified assets;
- migrated screens with behavior, light/dark, desktop/mobile, and accessibility coverage;
- legacy dependencies still present and the caller that prevents removal;
- generated shadcn components and their provenance/version;
- approved intentional visual differences.

The count should move monotonically toward zero. A slice that adds a new compatibility dependency
or increases the legacy-reference count is not complete.

## Final acceptance criteria

- No Untitled implementation source, package, import, asset, sample content, runtime URL, or derived
  theme source remains outside historical documentation.
- `@untitledui/icons` is gone and all live icons come from the approved library or a documented,
  licensed local source.
- Every live screen works in light and dark themes at supported desktop and mobile sizes.
- E2E behavior, visual, keyboard/focus, and accessibility gates pass according to the documented
  AI-dependent exclusions.
- The application uses the agreed `components/ui`, `components/shared`, and route-local seams.
- All generated-source and transitive licence notices required for distribution are present.
- `bun lint`, `bun tsc`, relevant `bun test`, the continuous E2E suite, `bun run build:package`, and
  local package-content inspection pass.
- README, `docs/tech-stack.md`, `docs/development-guidelines.md`, ADR 0005, and issue 22 describe the
  final system accurately.
- The maintainer explicitly approves the public-release gate. No agent publishes the package or
  repository.

## Primary references

- [shadcn/ui introduction](https://ui.shadcn.com/docs)
- [Existing Next.js project installation](https://ui.shadcn.com/docs/installation/next#existing-project)
- [`components.json`](https://ui.shadcn.com/docs/components-json)
- [Theming and semantic tokens](https://ui.shadcn.com/docs/theming)
- [Tailwind v4 and React 19](https://ui.shadcn.com/docs/tailwind-v4)
- [Official shadcn skill](https://ui.shadcn.com/docs/skills)
- [shadcn MCP](https://ui.shadcn.com/docs/mcp)
- [Base UI accessibility](https://base-ui.com/react/overview/accessibility)
- [Playwright locators](https://playwright.dev/docs/locators)
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
