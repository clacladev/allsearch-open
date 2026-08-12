# Development Guidelines

## Package Manager

Always use `bun` instead of `npm` or `yarn`.

## Components

- Prefer **React Server Components** by default. Use `'use client'` only when necessary (interactivity, `useState`, `useEffect`).
- Use Tailwind CSS utility classes for styling. Use UntitledUI components for common UI elements.
- Avoid custom CSS files unless absolutely necessary.
- **Use existing component APIs before rolling custom solutions.** When adding loading states, check if the component already has a built-in prop (like Button's `isLoading`) rather than manually swapping children with a `LoadingIndicator`.

### Updating generated shadcn source

`components/ui/` is vendored source (shadcn's model), not a package — there is
no `npm update`. To pull in an upstream change to an already-customized
component:

1. Start from a clean git tree (`git status --porcelain` empty).
2. Use the pinned `shadcn` CLI version (`bunx shadcn@latest --version`,
   recorded in `.scratch/untitled-ui-to-shadcn/inventory.md`).
3. Inspect before touching anything: `bunx shadcn@latest add <component> --diff`
   and `--view` against the local file.
4. Re-apply only the reviewed delta by hand, or re-`add` a single named
   component and re-diff — never `add --all`/`--overwrite` across
   already-customized files.
5. Re-record the component's row in the inventory's generated-source ledger
   with the new version/date and any local modifications that must survive
   the update (e.g. the `.dark-mode` theme mapping in `sonner.tsx`, or the
   `shadcn-primary`/`shadcn-secondary` token renames needed because legacy
   `theme.css` already claims the bare `primary`/`secondary` namespace — see
   `styles/shadcn-theme.css`).
6. Run `bun lint` and `bun tsc` before committing.

## State Management

- Use `useState`, `useReducer`, and Context API for local and shared state.
- For complex global state, use React Context API.

## Code Style

- Follow ESLint (`eslint.config.mjs`) and Prettier (`.prettierrc`) configurations.
- Ensure type safety with TypeScript. Avoid `any`.
- Prefer `undefined` over `null`.
- **Import statements:** Do not add empty lines between imports. Group all imports together without blank lines separating them.
- **Inline arrow functions:** Use implicit returns for single-expression bodies.
  - Prefer: `const onClick = () => doSomething(value)`
- **JSX event handlers:** For multi-line handlers, define the callback in the component body; pass the reference in JSX.
- **Guard clauses:** When condition and return are short, inline them.
  - Prefer: `if (!prompts.length) return;`
- **Undefined returns:** Use `return;` instead of `return undefined;`.
- **Array length checks:** Use `!!array.length` (has items) and `!array.length` (empty). Avoid `array.length > 0`.

## Naming Conventions

- **Boolean variables:** Prefix with `is`, `are`, or `should` (e.g., `isLoading`, `areItemsVisible`).
- **Boolean getter functions:** Prefix with `get` (e.g., `getIsHidden`).
- **Callback functions:** Prefix JSX callbacks with `on` (e.g., `onSaveClick`). Do not use `handle` prefix/suffix.

## Git Commit Messages

- Keep short and descriptive (50–72 characters).
- Start with an action verb in the imperative mood.
- No prefixes (`feat:`, `fix:`, `chore:`) — write plain English.
- Capitalize first letter. No period at end.

**Good:** `Added subscription button to pricing page`
**Bad:** `feat: added new button`
