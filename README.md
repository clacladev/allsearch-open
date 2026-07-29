# AllSearch

AllSearch helps brands rank higher in chatbots.

## Setup

```bash
# Install dependencies
bun i

# Run the app
bun dev

# Start supabase local
supabase start

# Monitor local workflow
npx workflow web
```

## Starting the app

The different environments are:

- [Development](https://localhost:3000) and [Supabase local](http://127.0.0.1:54323)
- [Preview](https://mirage.allsearch.io)
- [Production](https://allsearch.io)

## Deploy

- Anything merged into `dev` will be published to Preview (or `vercel` in the CLI)
- Anything merged into `prod` will be published to Production (or `vercel --prod` in the CLI)

## Database migrations

We work on the Supabase Dev project for dev and staging environments. We apply changes there, and then we run the migrations on the production environment.

Based on latest db dev changes, create a migration file by running:

```bash
# Local
supabase db diff -f NEW_FILE_NAME
# Remote
supabase db diff -f NEW_FILE_NAME --db-url "postgresql://postgres.[DEV-YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-ID].pooler.supabase.com:6543/postgres"
```

Create an updated seed file:

```bash
# Local
supabase db dump --data-only -f supabase/seed.sql --local
# Remote
supabase db dump --data-only -f supabase/seed.sql --db-url 'postgresql://postgres.[PROD-YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-ID].pooler.supabase.com:6543/postgres'
```

Test the new migration on supabase local by running:

```bash
supabase start
supabase db reset
```

Apply the migration to the production environment by running:

```bash
# Local
supabase migration up --local
# Remote
supabase migration up --db-url 'postgresql://postgres.[PROD-YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-ID].pooler.supabase.com:6543/postgres'
```

To reset the supabase db of an environment (with seed content):

```bash
# Local
supabase db reset
# Remote
supabase db reset --db-url "postgresql://postgres.[DEV-YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-ID].pooler.supabase.com:6543/postgres"
```

In the SQL editor of Supabase, fix the primary keys autoincrements:

```SQL
SELECT pg_catalog.setval(pg_get_serial_sequence('searches', 'id'), MAX(id)) FROM searches;
```

In the SQL editor of Supabase, erase the migrations:

```SQL
TRUNCATE supabase_migrations.schema_migrations;
```

## Check for dependencies updates

Use npm-check-updates ([ncu](https://www.npmjs.com/package/npm-check-updates)) to check for updates.

```bash
ncu
```

## Subscriptions testing

On the LemonSqueezy dashboard, switch to Test mode. Then create a checkout session in dev/staging environment.

Open a terminal with the webhook listener:

```bash
bun webhooks:listen
```

## ShipFast links

- [📚 Documentation](https://shipfa.st/docs)
- [🧑‍💻 Discord](https://shipfa.st/dashboard)
