# AllSearch Design System

The living reference for how AllSearch looks, feels, and behaves. Calibrate every new UI decision against this doc. If something here is wrong, fix it here first, then fix the code.

This document is inferred from the codebase as of 2026-04-24. The foundation is [UntitledUI v8 for React](https://www.untitledui.com/react) with Tailwind CSS v4 and React Aria Components. Custom brand color (seafoam) and marketing patterns are AllSearch-specific.

## Quick Reference

| Need | Where |
| --- | --- |
| Semantic color tokens | `styles/theme.css` |
| Typography sizes + prose | `styles/theme.css`, `styles/typography.css` |
| Global base + scroll-reveal | `styles/globals.css` |
| Button primitive (canonical example) | `components/base/buttons/button.tsx` |
| Marketing shell (header, footer) | `app/(public)/components/` |
| App shell (sidebar) | `app/(private)/components/Sidebar/Sidebar.tsx` |
| Homepage rhythm | `app/(public)/(index)/Homepage.tsx` |
| Icon set | `@untitledui/icons` (use MCP `search_icons` to verify names) |

---

## 1. Brand

**Product:** AllSearch — track AI shopping visibility across ChatGPT, Perplexity, Google AI Mode, Gemini. Tool for ecommerce brands and SEO agencies. GEO / AEO category.

**Voice:** Operator-direct. Concrete verbs, zero fluff, no marketing hype words. Lead with what the user gets, not what the product is. Sentence case for UI, title case for marketing headlines.

- Good: "Make Your Ecommerce Visible in AI Search", "A Constantly Updated Action List for Product & Category Pages"
- Bad: "Unlock the power of AI-driven visibility", "Your all-in-one solution", "Delve into insights"

**Copywriting rules** (enforced in `CLAUDE.md`):

- No em dashes in UI copy. Use a colon to introduce, a period to separate, or reword.
- British English on marketing pages ("optimise", "prioritised"). Mixed use is tolerated but prefer British when in doubt.
- Keywords belong in metadata, not in headlines.

**Logo:** `AppLogo` (symbol + wordmark) and `AppLogoMinimal` (symbol only). Source SVG at `/public/logo.svg`. Wordmark is `config.appName` rendered at `text-xl font-bold`. Never recreate inline — always use the components in `app/(public)/components/AppLogo.tsx`.

---

## 2. Foundations

### Stack

| Layer | Tool |
| --- | --- |
| CSS | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Plugins | `@tailwindcss/typography`, `tailwindcss-animate`, `tailwindcss-react-aria-components` |
| Primitives | `react-aria-components` (every interactive primitive) |
| Icons | `@untitledui/icons` |
| Merge utility | `tailwind-merge` wrapped as `cx` and `sortCx` in `utils/cx.ts` |
| Fonts | `Inter` via `next/font/google` as `--font-inter` |
| Theme switching | `next-themes` + `.dark-mode` class |

### Color — semantic tokens only

**Never use raw Tailwind colors (`text-green-600`, `bg-gray-50`, etc.) in app/marketing code.** Always use a semantic token from `styles/theme.css`. Raw palettes exist only to feed semantic tokens, and should only appear inside `styles/theme.css` itself.

**Brand palette:** Seafoam (custom green), mapped to `--color-brand-*`. Base is `rgb(85 200 145)` = `#55c891` at 500.

**Semantic token families** (all have light + dark values; automatic on `.dark-mode`):

| Family | Tokens | Example classes |
| --- | --- | --- |
| Text | `primary`, `secondary`, `tertiary`, `quaternary`, `placeholder`, `brand-primary/secondary/tertiary`, `error`, `warning`, `success`, `white`, `primary_on-brand` | `text-primary`, `text-tertiary`, `text-brand-secondary` |
| Background | `primary`, `secondary`, `tertiary`, `quaternary`, `brand-primary`, `brand-secondary`, `brand-solid`, `brand-solid_hover`, `error-primary/secondary/solid`, `warning-*`, `success-*`, `overlay`, `brand-section` | `bg-primary`, `bg-brand-solid` |
| Foreground (icons) | `primary`, `secondary`, `tertiary`, `quaternary`, `brand-primary/secondary`, `error/warning/success-primary/secondary`, `white` | `text-fg-quaternary` |
| Border | `primary`, `secondary`, `secondary_alt`, `tertiary`, `error`, `error_subtle`, `brand`, `brand_alt` | `border-secondary`, `ring-primary` |
| Utility hues | `utility-{blue,red,yellow,green,orange,indigo,fuchsia,pink,purple,sky,slate,emerald,amber,neutral,brand}-{50..700}` | `bg-utility-brand-100`, `text-utility-red-700` |

**Component-specific tokens** (`--color-avatar-*`, `--color-featured-icon-*`, `--color-focus-ring`, `--color-tooltip-supporting-text`, etc.) exist for tightly-scoped UI. Use them where appropriate; don't invent new ones without updating `theme.css`.

**Hover states** are expressed via `_hover` suffix on the same token (e.g. `text-secondary_hover`, `bg-primary_hover`). Compose with Tailwind's `hover:` variant: `hover:text-secondary_hover`.

**Dark mode** flips every token via the `.dark-mode` class (custom variant defined in `globals.css`). Utility color scales invert (e.g. `utility-brand-100` becomes `--color-brand-900` in dark). You don't need to write `dark:` variants for tokenized colors — dark mode works automatically when you use tokens. Only add `dark:` prefixes for decorative cases (brightness tweaks on background images, etc.).

### Typography

**Families:**

- `--font-body` / `--font-display` = Inter → `-apple-system`, Segoe UI, Roboto, Arial, sans-serif
- `--font-mono` = `ui-monospace`, Roboto Mono, SFMono-Regular, Menlo, Monaco, Consolas

Display and body share Inter. If we ever introduce a display face (e.g. a condensed Grotesk for hero), redefine `--font-display` in `theme.css` and use `font-display` Tailwind utility — do not hardcode font stacks anywhere else.

**Scale:**

| Utility | Size | Line height | Letter spacing |
| --- | --- | --- | --- |
| `text-xs` | 12px | 18px | — |
| `text-sm` | 14px | 20px | — |
| `text-md` | 16px | 24px | — |
| `text-lg` | 18px | 28px | — |
| `text-xl` | 20px | 30px | — |
| `text-display-xs` | 24px | 32px | — |
| `text-display-sm` | 30px | 38px | — |
| `text-display-md` | 36px | 44px | -0.72px |
| `text-display-lg` | 48px | 60px | -0.96px |
| `text-display-xl` | 60px | 72px | -1.2px |
| `text-display-2xl` | 72px | 90px | -1.44px |

**Weights:** 400 body, 500 quotes, 600 headings and buttons, 700 strong/bold, 900 h1 strong only.

**Headings in the marketing context:**

- `h1` hero: `text-display-md md:text-display-lg lg:text-display-xl font-semibold text-balance`
- `h2` section: `text-display-sm md:text-display-md font-semibold`
- `h2` subsection: `text-display-xs md:text-display-sm font-semibold`
- `h3` item title: `text-lg md:text-xl font-semibold`
- Eyebrow: `text-sm md:text-md font-semibold text-brand-secondary`
- Lead: `text-tertiary text-lg md:text-xl`

**Always apply `text-balance` on display-sized headings** so multi-line wrap is even.

**Prose content** (article bodies, blog posts, long-form) uses the `prose` class defined in `typography.css`. Add `md:prose-lg` for article-width reading. Variants:

- `prose-centered-quote` — blockquote without left border, centered text.
- `prose-minimal-quote` — blockquote without left border.
- Blockquotes get curly quotes auto-inserted (`::before` / `::after`).
- Inline code chips get `bg-bg-secondary` with a `box-shadow` ring and 6px radius.

### Spacing + layout

- Everything derives from Tailwind's `--spacing` var. Don't hardcode `px` values.
- Max content width: `max-w-container` = 1280px. Every full-bleed section wraps its content in `max-w-container mx-auto px-4 md:px-8`.
- Breakpoints: `xxs` 320px, `xs` 600px (aligned with Sonner), then standard Tailwind `sm`/`md`/`lg`/`xl`.
- Section rhythm on marketing pages: `py-16 md:py-24` is the default vertical pad; eyebrow→headline→lead uses `mt-3 / mt-4 md:mt-5` spacing inside a section header.
- Feature grids alternate with `grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24`. Flip image/text order with `lg:order-last` on the text column for every other feature.
- Stack section gap: `gap-24 sm:gap-24 md:gap-32 lg:gap-40` between alternating features.

### Radius

| Token | Size | Typical use |
| --- | --- | --- |
| `rounded-none` | 0 | flush surfaces |
| `rounded-xs` | 2px | tight chips, keyboard keys |
| `rounded-sm` / `DEFAULT` | 4px | small inputs |
| `rounded-md` | 6px | xs buttons, chips |
| `rounded-lg` | 8px | buttons, inputs, dropdown items |
| `rounded-xl` | 12px | cards, tag chips, video frames |
| `rounded-2xl` | 16px | modal surfaces, hero mockup shells |
| `rounded-3xl` | 24px | large cards |
| `rounded-full` | 9999px | pills, avatars, CTA badges |

Never mix arbitrary radii on sibling elements. Buttons are always `rounded-lg` (or `rounded-md` at `xs`). Cards pick one radius and stick with it.

### Shadow

| Token | Use |
| --- | --- |
| `shadow-xs` | subtle resting elevation, button defaults |
| `shadow-sm` | menu items, pickers |
| `shadow-md` | hovering cards |
| `shadow-lg` | popovers, mobile nav, hero mockup |
| `shadow-xl` / `shadow-2xl` / `shadow-3xl` | modals, overlay stacks |
| `shadow-xs-skeuomorphic` | primary/secondary buttons — inner ring + outer xs |
| `shadow-modern-mockup-inner-sm/md/lg` | device/screen mockup inner shadow |
| `shadow-modern-mockup-outer-md/lg` | device/screen mockup outer shadow |
| `drop-shadow-iphone-mockup` | phone frame lift |

Custom one-offs (e.g. the hero play button glow) use inline `shadow-[0_8px_30px_rgba(65,175,125,0.45)]`. If you need that glow in two places, promote it to `theme.css`.

### Motion

Default transition: `transition duration-100 ease-linear`. Use it on every hover/focus state.

- Popover / menu enter/exit: `animate-in fade-in slide-in-from-top-1 duration-200 ease-out` / `animate-out fade-out slide-out-to-top-1 duration-150 ease-in`
- Scale on enter: `zoom-in-95 duration-200 ease-out`
- Caret blink: `animate-caret-blink` (1s infinite)
- Marquee: `animate-marquee` (60s linear infinite)
- Scroll-reveal: apply `reveal` on an element to fade/translate in as it enters the viewport. Stagger with `reveal-delay-1/2/3` (80ms / 160ms / 240ms). Based on modern `animation-timeline: view()` CSS.

Never add a custom keyframe or timing function inline. Add it to `theme.css` and promote it.

---

## 3. Icons

Always import from `@untitledui/icons`. Default visual size in a button is 20px (`size-5`); inside an `xs` button it shrinks to `size-4`. Stroke width defaults to 2; some chevron-down indicators use `stroke-[2.625px]`.

**Discovery:** use the UntitledUI MCP tool `search_icons` before importing a new icon to verify the exact PascalCase name.

```ts
import { SearchLg, BarChart11, Globe01, ZapFast } from '@untitledui/icons';
```

Icons inside buttons should be passed as the component type (not the element) via `iconLeading` / `iconTrailing` props. This lets the button wrapper apply the correct size, color, and `data-icon` attribute.

Custom SVGs live in `components/foundations/` (payment-icons, social-icons, rating-stars, featured-icon, dot-icon, star-icon). The `FeaturedIcon` component is the canonical "icon-in-colored-bg" primitive — don't hand-roll.

---

## 4. Components

All primitives live under `components/` and are already UntitledUI-aligned. Prefer reuse over reinvention.

**Directory map:**

| Path | Contents |
| --- | --- |
| `components/base/` | buttons, inputs, checkboxes, radios, selects, tooltips, badges, avatars, dropdowns, forms, pin-input, progress-indicators, tags |
| `components/application/` | alerts, carousel, charts (recharts), date-picker, empty-state, loading-indicator, metrics, modals, pagination, progress-steps, section-headers, slideout-menus, table, tabs, app-navigation |
| `components/foundations/` | featured-icon, payment-icons, rating-stars, rating-badge, social-icons, dot-icon, star-icon, social logos |

### Button — canonical example

`components/base/buttons/button.tsx` is the canonical pattern. Study it before building any new primitive.

**Sizes:** `xs`, `sm` (default), `md`, `lg`, `xl`. Size changes padding, text, gap, and icon size simultaneously.

**Colors:**

- `primary` — brand-solid bg, white text, skeuomorphic inner border + xs shadow. The one and only visual-anchor CTA.
- `secondary` — primary bg, secondary text, 1px primary ring. Use when primary would dominate.
- `tertiary` — transparent, hoverable. Use inside nav, toolbars, dense tables.
- `link-gray` / `link-color` — no padding, underline-on-hover. For inline text links.
- `primary-destructive` / `secondary-destructive` / `tertiary-destructive` / `link-destructive` — red variants for irreversible actions.

**States:**

- `isLoading` — shows a spinning SVG centered over invisible children. Pass `showTextWhileLoading` to keep text visible.
- `isDisabled` — cursor-not-allowed, 50% opacity on primary, loses skeuomorphic shadow.
- `data-icon-only` — set automatically when no children are passed.

**Composition with `InputGroup`:** buttons auto-detect `in-data-input-wrapper` context and adjust padding + border radius for leading/trailing slots. Never hand-roll this logic.

### Compound components

Use slot/dot-notation for anything composite: `Carousel.Root / Content / Item / PrevTrigger / NextTrigger`. Follow react-aria's composition idioms for forms, selects, tabs.

### Empty states, loading, skeletons

- `EmptyState` at `components/application/empty-state/`. Always add a primary action and a friendly title. "No items found." without an action is a bug.
- `LoadingIndicator` at `components/application/loading-indicator/`. Prefer inline button loading (`isLoading`) where possible.
- For table/list skeletons, use Tailwind `animate-pulse` on `bg-secondary` blocks. No separate skeleton primitive today.

---

## 5. Layouts + shells

### Marketing (`app/(public)/` + `app/(landing-page)/`)

- Wrapped in `PublicShell`: `Header` → content → `Footer` → `CrispChat`.
- `Header` defaults to floating on scroll (ring + rounded-2xl on desktop). `isFloating`, `isFullWidth`, `stripCtaFromHeader`, `stripLinksFromHeaderAndFooter` are escape hatches.
- `Footer` uses `.dark-mode` class on itself to inherit the dark palette regardless of page theme. Don't override.
- Main CTA in the hero is `HomepageCtaBlock`. Secondary CTAs in each section reuse the same block — identical phrasing and size.

**Section rhythm (canonical):**

1. Hero — badge pill + display heading + lead + CTA block + product mockup (grid pattern SVG + ambient glow behind)
2. Divider (`<SectionDivider />` — 1px `bg-border-secondary` inside the container)
3. Testimonials (on `bg-secondary`)
4. Divider
5. Why-we-matter (`bg-primary`)
6. How-it-works (numbered steps)
7. Divider
8. Alternating features (2-col grid, order flips each row)
9. Data sources (3-col logo grid on `bg-secondary`)
10. What-you-get (6 icon+title+text cards)
11. Pricing
12. Final CTA (faint brand gradient background)
13. FAQ accordion

This rhythm is the standard. New marketing pages should use the same blocks in the same order unless there's a specific reason.

**Visual anchors:**

- Ambient glow: `rounded-full bg-[var(--color-brand-solid)] opacity-[0.08] blur-[100px]` behind the hero mockup.
- Grid pattern SVG: `/index/grid-md-desktop.svg` + mobile variant, `brightness-[0.15]` in dark.
- Badge pill on hero: `bg-brand-secondary/40 ring-brand-solid/20` + pulsing dot.
- Brand highlight inside prose: `TextHighlight` (brand text) + `TextBgHighlight` (brand bg wash, `soft` or `medium`).

### App (`app/(private)/`)

- `<body class="bg-primary antialiased">`
- Fixed left sidebar: width 288px on `lg` (`lg:w-72`), hidden on mobile (replaced by `MobileNavigationHeader`).
- Sidebar composition: project selector card at top, `NavList` in middle, promo card slot at bottom (`BookDemoSidebarCard` pattern).
- Content offset: sibling placeholder `lg:pl-72` keeps content out from under the fixed sidebar.
- Page content wraps in its own `max-w-container mx-auto px-4 md:px-8` or bespoke widths per screen.

### New project flow (`app/(new-project)/`)

Multi-step progress via `components/application/progress-steps/`. Keep button sizes consistent across steps (`size="lg"`).

---

## 6. Interaction states

Every interactive surface must specify all four:

| State | Expectation |
| --- | --- |
| Default | Resting visual per token; no hover-only affordance |
| Hover | Use `_hover` token pair + `transition duration-100 ease-linear`. Never change layout on hover. |
| Focus | `focus-visible:outline-2 focus-visible:outline-offset-2` using `outline-focus-ring` (brand-500) or `outline-error` for destructive. |
| Disabled | `disabled:cursor-not-allowed` + 50% opacity on solids or loss of shadow on ringed variants. |

Additional loading state on every async action. Don't double-submit — use `isLoading` on buttons.

**Focus ring:** always visible on keyboard. Don't suppress `focus-visible`. The token `outline-focus-ring` is brand-500 by default, `outline-error` is red-500.

---

## 7. Responsive

Mobile-first, always. Don't use `max-md:` to undo desktop defaults — start mobile, add up at `md`/`lg`.

- Header: full bar on mobile, floating on `md`. Mobile drawer is a react-aria `Popover` anchored to the header.
- Sidebar: hidden entirely on `<lg`. A sticky `MobileNavigationHeader` handles nav on small screens.
- Feature grids: 1 column `<lg`, 2 columns `lg+`. Image stacks above text on mobile regardless of `lg:order-last`.
- Display type scales down: `text-display-md md:text-display-lg lg:text-display-xl` is a good default for hero h1.
- Hero mockup: full-width stacked on mobile, inset at `md+`. Aspect ratio preserved via fixed-width `Image` with `width`/`height` props.
- Modals: bottom-sheet on mobile (check `components/application/modals/modal.tsx`), centered dialog on desktop.

Touch targets: 44px minimum. Button sizes `md` and above satisfy this. Use `size="xs"` or `sm` sparingly on touch surfaces.

---

## 8. Accessibility

Most is handled by react-aria. That's non-negotiable: **any new primitive goes through react-aria-components.** Never hand-roll a combobox, dropdown, date picker, or modal — import from the primitive or build on top of react-aria.

Non-automatic rules:

- Every icon-only button needs `aria-label`.
- Every decorative image needs `aria-hidden="true"`.
- Every interactive element needs visible focus (don't remove `outline`).
- Every form input needs an associated `<label>`. Our `Label` primitive is at `components/base/input/label.tsx`.
- Color is never the only signal — pair red/green with an icon or text.
- Keyboard navigation: `Esc` closes overlays, `Tab` moves forward, `Shift+Tab` back. All supplied by react-aria; test after composition.

---

## 9. AI-slop blacklist (AllSearch-specific)

Patterns we ship and reinforce:

- Brand pill + display headline + lead + dual CTA hero
- Alternating 2-col feature blocks with real product illustrations (`ProjectReportIllustration`, etc.)
- Ambient brand glow behind hero mockup
- Grid-pattern SVG backdrop on hero
- Tag chips (`rounded-full border-secondary bg-secondary text-tertiary px-3 py-1 text-xs`)
- Featured icons in light brand-tinted backgrounds via `FeaturedIcon`
- Numbered how-it-works steps with real-product screenshots

Patterns we refuse:

- Purple/violet/indigo gradients. Brand is seafoam green — nothing else.
- Three-column icon-in-circle feature grid with matching bold title and two-line description. That's the most recognizable AI template pattern in existence.
- Decorative emoji, rockets, wavy SVG dividers, floating blobs.
- Colored left-border cards.
- Centered-everything (center alignment is fine on hero h1 and section eyebrows; left-align body content).
- Cards for the sake of cards. A card must contain an interaction or an atomic unit of content, not decorate a paragraph.
- Generic hero copy: "Welcome to…", "Your all-in-one…", "Unlock the power of…".
- Emoji as bullet points or heading decoration.

When in doubt: look at the existing Homepage. If a new section doesn't echo its rhythm, either the new section is wrong or the case for diverging is explicit in the plan.

---

## 10. UntitledUI MCP

UntitledUI ships an MCP server for discovering and fetching their components. Use it **before** hand-rolling anything that sounds like a standard pattern.

| Tool | When |
| --- | --- |
| `mcp__untitledui__list_components` | Browse a category (`base`, `application`, `marketing`, `foundations`) |
| `mcp__untitledui__search_components` | Natural-language search: "pricing table with feature comparison" |
| `mcp__untitledui__get_component` | Returns the CLI install command for a specific component |
| `mcp__untitledui__search_icons` | Verify an icon name before importing |

Installed components land in `components/base/` or `components/application/` and use our token system automatically — the theme in `theme.css` is UntitledUI's expected API, so tokens just work.

---

## 11. Extending the system

When you need a pattern that doesn't exist:

1. **Check the UntitledUI MCP first.** Nine times out of ten it's already there.
2. **Check `components/`.** We may have a closely-related primitive you can compose with.
3. **If a new token is needed,** add it to `styles/theme.css` (light + dark). Every token must have a purpose and a name that describes role, not appearance (`--color-bg-promo-card`, not `--color-light-green-pale`).
4. **If a new primitive is needed,** match the Button pattern: `styles` object with `common / sizes / colors / states`, plus `cx` composition. Always render via a react-aria primitive.
5. **If a new marketing section is needed,** keep the `max-w-container` + `py-16 md:py-24` + eyebrow/headline/lead + optional CTA rhythm. Don't introduce new full-bleed colors or typefaces.

Document meaningful additions by updating this file. Design drift happens when nobody writes down why a change was made.

---

## 12. Open questions + known gaps

- **Category pages** and **illustration system** — product illustrations live alongside their pages (`ProjectReportIllustration`, `OpportunitiesIllustration`, etc.). There's no shared illustration library. If this grows, move to a dedicated `components/illustrations/` directory with shared variants.
- **Charts** — Recharts is installed (`recharts@3.8.1`) and themed via `components/application/charts/charts-base.tsx`. No chart tokens yet; colors come from the utility palette. Formalize when we need >5 series.
- **Motion library** — no framer-motion. All animation is CSS via `tailwindcss-animate` + custom keyframes in `theme.css`. Keep it that way unless we hit a wall.
- **Internationalization** — `@internationalized/date` is installed for react-aria, but app copy is English-only. Future i18n should not be blocked by design.
- **Email templates** — outside the scope of this doc. If/when we build them, they deserve their own mini-system.
