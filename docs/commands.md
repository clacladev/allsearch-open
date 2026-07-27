# Common Commands

```bash
bun dev              # Start dev server (https://localhost:3000)
bun dev:debug        # Start dev server with Node.js inspector attached
bun build            # Build for production
bun lint             # Run ESLint
bun prettier         # Format code with Prettier
bun test             # Run tests
bun test --watch     # Run tests in watch mode
bun test:coverage    # Run tests with coverage report
bun test:e2e         # Run Playwright e2e tests (requires dev server running)
bun test:e2e:ui      # Run Playwright e2e tests with interactive UI
bun webhooks:listen  # Expose local server via ngrok for webhook testing
```

> **Note:** `bun dev` uses `--experimental-https`. SSL certificates must exist in `/certificates/`.
> Generate them with `mkcert localhost` and place the key/cert files there.

## Database

```bash
supabase migration new <name>  # Create a new migration file
supabase db push               # Apply pending migrations locally
./supabase/clean_seed.sh       # Clean seed.sql (remove auth logs, old responses, empty sections)
```

## Import Project from Dump

Import a project from a production database dump into the local dev Supabase instance:

```bash
./import_project.sh <dump_file> <source_project_id> <new_author_id>
```

- `dump_file` — Path to the SQL dump file (from `backup_dump.sh`)
- `source_project_id` — UUID of the project to import
- `new_author_id` — UUID of the local dev user who should own the imported project

The script loads the dump into a temporary schema, copies the target project's data (projects, topics, prompts, competitors, prompt_responses) with remapped ownership, then cleans up.
