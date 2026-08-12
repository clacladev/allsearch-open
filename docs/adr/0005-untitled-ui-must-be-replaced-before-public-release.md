# Untitled UI PRO must be replaced before the repo goes public

`components/` is 17,040 lines of vendored Untitled UI **PRO**, a commercially
licensed library. AllSearch Local is intended to ship MIT, and publishing that
source would redistribute components others are meant to pay for.

The replacement is **shadcn/ui**: MIT, vendored into the repository rather than
installed as a dependency (the same model Untitled UI uses, so the shape of
`components/` is unchanged), built on **Base UI** — selected explicitly rather
than inherited from a changing CLI default — with Tailwind, which is already
the stack. The detailed migration plan, including the clean-source rules and
the vertical-slice sequencing, lives in `.scratch/untitled-ui-to-shadcn/spec.md`.

`components/ui/` is vendored source, not a package, so there is no `npm
update`. Pulling in an upstream change to an already-customized component
requires: a clean git tree, the pinned `shadcn` CLI version, `view`/`diff`
against the local file before touching anything, and re-applying only the
reviewed delta by hand. Never run a broad `add --all --overwrite` or `apply`
across customized components — it can silently discard AllSearch-specific
modifications.

We build the app on Untitled UI first and swap it out as the final phase of the
plan, rather than replacing it up front. Sequencing it this way keeps
the port itself mechanical: the dashboard, which is 80% of the value being
carried over, keeps compiling and rendering throughout, and the component swap
becomes an isolated, visually-reviewable project instead of being tangled up with
the database and provider migrations.

## Consequences

- **The repository stays private until the swap is complete.** This is a hard
  gate on the first public release, not a nice-to-have.
- The swap touches essentially every page under `app/(private)`, so it needs its
  own visual regression pass.
- Asking Untitled UI for an open-source exception is worth doing in parallel; a
  grant would remove this work entirely.
- Legacy `styles/theme.css` already claims Tailwind v4's specific
  `--background-color-primary`/`--text-color-primary`/`--border-color-primary`
  (and `secondary`) namespaces for its own "neutral default" meaning, which
  Tailwind prefers over shadcn's generic `--color-primary`/`--color-secondary`.
  During coexistence, generated primitives expose those two roles under a
  `shadcn-` prefix instead (`styles/shadcn-theme.css`) and have their
  `primary`/`secondary` class references hand-patched accordingly — see
  `.scratch/untitled-ui-to-shadcn/inventory.md` ("Generated-source ledger").
  This is the only semantic role with a naming collision.
