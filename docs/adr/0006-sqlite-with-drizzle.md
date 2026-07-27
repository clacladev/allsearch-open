# SQLite with Drizzle, schema ported as-is

The SaaS ran on Supabase Postgres accessed through the PostgREST query builder.
Locally we use plain SQLite through Drizzle, and port the schema largely
unchanged.

The port is far less risky than the Postgres schema suggests. Despite three
enums, four array columns and seven `jsonb` columns, the entire query surface in
use is fourteen builder methods, with **no `.contains`, no `.overlaps` and no
JSON operators anywhere**: rows are selected whole and the analysis layer
computes in JS. So arrays and JSON become plain JSON text columns at no cost,
enums become `TEXT` with CHECK constraints, and all five plpgsql functions
disappear (two were auth session lookups, one was a cascade delete now expressed
as a foreign key). Of 65 query functions, 6 die with auth and 59 port, most of
them a single equality filter.

Drizzle over Kysely or raw SQL because schema-as-code generates the row types.
The SaaS had no generated Supabase types: every `*Row` type was hand-written and
free to drift from the real schema. Drizzle removes that whole class of bug, and
`drizzle-kit` supplies the migration tooling.

## Consequences

- **Migrations become a user-data-safety problem, not a deployment step.** A
  server migrates once under supervision; here every install holds a database at
  an arbitrary version and the app must migrate it forward at launch. Migrations
  are forward-only and the database file is copied to a backup before each one.
- The driver is **`node:sqlite`** (`drizzle-orm/node-sqlite`), built into Node 22+
  and therefore into any Electron we later ship. This deliberately avoids
  `better-sqlite3`, whose native binary needs rebuilding against Electron's ABI,
  unpacking from the asar archive, and rebuilding again on every Electron bump.
  Choosing it removes native-module maintenance from the problem entirely, and it
  is portable across every shell we might pick.
- Plain SQLite, not libSQL. libSQL's only local advantage is embedded replicas
  syncing to Turso cloud, which would reintroduce the hosted dependency we are
  removing. Cross-machine use is served by database file export/import, deferred
  to a later version.
- UUID primary keys are kept as `TEXT`. Switching to integer keys would churn
  every route parameter, foreign key and type for no gain at these volumes: ten
  Projects collecting weekly produce well under a million rows in two years.
- There is no data to migrate from the hosted Supabase, so no import path is
  built.
