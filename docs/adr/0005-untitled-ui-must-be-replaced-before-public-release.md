# Untitled UI PRO must be replaced before the repo goes public

`components/` is 17,040 lines of vendored Untitled UI **PRO**, a commercially
licensed library. AllSearch Local is intended to ship MIT, and publishing that
source would redistribute components others are meant to pay for.

The replacement is **shadcn/ui**: MIT, vendored into the repository rather than
installed as a dependency (the same model Untitled UI uses, so the shape of
`components/` is unchanged), and built on Radix with Tailwind, which is already
the stack.

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
