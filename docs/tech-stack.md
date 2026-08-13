# Tech Stack

| Layer           | Technology                                                         |
| --------------- | ------------------------------------------------------------------ |
| Language        | TypeScript                                                         |
| Framework       | Next.js 16 (App Router)                                            |
| UI              | React 19                                                           |
| Styling         | Tailwind CSS v4 + vendored shadcn/ui (Base UI) / React Aria Components |
| Icons           | `lucide-react`                                                     |
| AI              | Vercel AI SDK (`ai`) with direct OpenAI, Google, Perplexity keys   |
| Database        | SQLite via Drizzle (`drizzle-orm` / `drizzle-kit` 1.0.0-rc.4)      |
| Runtime         | Node 22+ for the server; Bun for install, scripts, and unit tests  |
| E2E             | Playwright                                                         |
| Package Manager | `bun`                                                              |

No hosted Supabase, billing, or product telemetry in this port. See ADRs 0003–0006 and 0010.
