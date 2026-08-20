# AllSearch

AllSearch tracks how often a Brand is mentioned and cited by AI chatbots,
then turns gaps into content recommendations. It is single-user and local-first:
your data stays in a SQLite database on your machine, and AI calls use provider
keys you enter in **Settings**.

## Before you start

- A Google AI key is enough to use the app. OpenAI and Perplexity keys are optional
  and add those chatbots to your tracking.
- Collection Runs are manual. Starting one uses your provider keys and may incur
  provider charges.
- Missing a collection week leaves a gap in the historical data; the app does not
  reconstruct past chatbot answers.

## Prerequisites

- [Bun](https://bun.sh)
- Node.js 22.5 or later on your `PATH`
- Optional provider API keys for live collection (OpenAI, Google, and Perplexity)

## Run the CLI app

From a source checkout, build the package and launch it:

```bash
bun install
bun run build:package
bun run start:cli
```

Once a version has been published to npm, you can instead run:

```bash
npx allsearch-open
bunx allsearch-open
```

New to Node? Install it from [nodejs.org](https://nodejs.org) — npx ships with it.

The CLI starts a server on a free local port, prints its URL, and opens your
default browser. Press Ctrl-C to stop it.

| Flag                  | Effect                                     |
| --------------------- | ------------------------------------------ |
| `--port <n>`          | Use exactly this port; fail if it is taken |
| `--no-open`           | Print the URL without opening a browser    |
| `--version`, `--help` | Show version or help                        |

The server binds to `127.0.0.1` only. One app instance may use a database at a
time; a second instance is refused to protect SQLite from concurrent writers.
Stopping the app during a Collection Run safely returns that run to `pending`,
so it resumes on the next launch.

## Run the macOS desktop app

Build an Apple-Silicon desktop app from a source checkout:

```bash
bun run build:desktop
open release/desktop/AllSearch-*.dmg
```

The DMG is unsigned and not notarized. If macOS blocks it, use Finder’s
**Open** action (or System Settings → Privacy & Security → **Open Anyway**) only
when you built or received it from a source you trust. The desktop app runs the
same loopback-only server and uses the same database as the CLI, so do not run
both at once.

## Your data

By default, the database is stored here:

| Platform | Path                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| macOS    | `~/Library/Application Support/AllSearch/allsearch.db`                             |
| Windows  | `%APPDATA%\AllSearch\allsearch.db`                                                 |
| Linux    | `$XDG_DATA_HOME/AllSearch/allsearch.db` or `~/.local/share/AllSearch/allsearch.db` |

Set `ALLSEARCH_DB_PATH` to use another database location. Provider keys are
stored in this database after you add them in **Settings**.

## More documentation

- [Development guide](./docs/development.md) — local development, tests, database work, and code conventions.
- [Packaging and release guide](./docs/packaging.md) — package contents, local package checks, desktop staging, and npm publishing.
- Architecture and domain: [tech stack](./docs/tech-stack.md), [project structure](./docs/project-structure.md), [domain language](./CONTEXT.md), and [architecture decisions](./docs/adr/).

## Licence

[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-or-later).
