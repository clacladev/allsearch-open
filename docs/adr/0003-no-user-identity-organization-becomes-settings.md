# No user identity; Organization is demoted to settings

The SaaS was already single-tenant in all but name: `organizations.owner_id` was
UNIQUE, there were no members, invites, roles, org switcher or sharing, and every
RLS policy reduced to `auth.uid() = author_id`. Locally there is one user by
construction, so we delete identity entirely rather than stub it out: no
`auth.users`, no `user_profiles`, no `author_id`, no `organization_id` on child
tables, no RLS, and no sign-in screen ever.

The Organization survives, but as a single settings row with no owner. It is not
tenancy: it records who the *operator* is (`agency` or `in-house`, plus name, URL
and icon), which is real product content that shapes how Projects are framed. An
agency's Organization is the agency; its Projects are its clients.

## Consequences

- All twelve `libs/database/*/queries.ts` files lose their `asAdmin` query option,
  which existed only to bypass RLS.
- Authorization disappears rather than moving into application code. The two
  pre-existing authorization bugs in the SaaS (an unauthenticated
  `process-prompts/[projectId]/force-one` route, and a `fetch-new-prompt-responses`
  route that never checked project ownership) stop mattering.
- The cross-tenant admin panel is deleted. The `admin-tools` project settings tab
  survives ungated as a Developer tab, because its clone and backfill actions are
  genuinely useful.
- One database per install. Multiple isolated workspaces are explicitly out of
  scope for the first version.
