# 22 — Replace Untitled UI

Status: ready-for-human
Milestone: 8 — Public release gate
Blocked by: 21

**This is a hard gate on the repository ever becoming public** (ADR 0005).

The approved migration approach is maintained in
`.scratch/untitled-ui-to-shadcn/spec.md`. That spec selects shadcn/ui's Base UI
implementation, defines the clean-source and coexistence rules, and provides the
candidate deliverable sequence. This issue remains the parent public-release gate.

`components/` is 17,040 lines of vendored **Untitled UI PRO**, a commercially
licensed library, with no LICENSE file anywhere in the repo. Shipping AllSearch
MIT with that source in a public repository would redistribute components other
people are meant to pay for.

**Before starting, do two things:**

1. **Read the actual Untitled UI PRO licence terms.** This ticket is written on
   the near-universal shape of such licences — use in your own products, no
   redistribution of source — but the specific terms decide the scope. Confirm
   separately that distributing the *compiled* app to third parties for free is
   permitted, since that is what we do even before the repo opens.
2. **Ask Untitled UI for an open-source exception.** It is free to ask and
   sometimes granted, and a grant deletes this entire ticket.

If neither rescues it: **migrate to shadcn/ui**. It is MIT, it is
copy-into-your-repo rather than a dependency (the same vendoring model Untitled
UI uses, so the shape of `components/` does not change), and it sits on Radix
primitives with Tailwind, which is already the stack.

The library to replace covers `base/` (buttons, forms, dropdowns, tooltips),
`application/` (tables, charts, navigation, modals, date pickers, pagination,
progress steps) and `foundations/`. Essentially every page under `app/(private)`
imports from it. Expect gaps: shadcn has no direct equivalent for some
`application/` components, and the charts are Recharts in both, which helps.

**This is the last piece of work in the plan.** Doing it up front would have
tangled a visual rewrite with the database and provider migrations; doing it last
keeps the dashboard compiling and rendering throughout the port and makes this an
isolated, reviewable project. Nothing else should be scheduled after it except
the README screenshots that depend on it.

Needs a full visual regression pass — screenshots of every dashboard page before
and after. `@untitledui/icons` is a separate package; check its licence
separately, it may be able to stay.

## Done when

- No Untitled UI PRO source remains in the repository.
- Every dashboard page renders correctly in light and dark themes.
- The e2e suite passes.
- The repository can be made public without a licence violation.
