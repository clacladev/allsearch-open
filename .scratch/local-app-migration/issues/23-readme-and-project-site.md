# 23 — README and project site

Status: ready-for-agent
Milestone: 8 — Public release gate
Blocked by: 22

Every marketing page was deleted in issue 02, so the project needs somewhere to
send people. A README plus a GitHub Pages site presenting the app. The name stays
**AllSearch**; the bundle identifier, when a native app exists, is
`io.allsearch.app`.

**README** must cover: what the app does in two sentences; that it runs entirely
on your machine with your own API keys and no account; install and run
(`bunx allsearch`); which keys are needed and that **Google alone is enough to
start**, with OpenAI and Perplexity each adding one more AI platform; that
collection is manual and weekly; that the data lives in a SQLite file at a stated
path; and the licence.

**Be honest about two things** rather than discovering them in issues:

- **Collection costs the user money** on their own key, and the app does not
  display an estimate (ADR 0007).
- **A missed week is lost permanently.** You cannot ask a chatbot what it said
  last Tuesday, so the time series will have gaps, by design.

**Screenshots matter more than usual** — an open-source tool with no screenshots
gets no adoption, and there is no fake provider mode to generate them from, so
they come from a real populated install. Capture them once the dashboard is on
the replaced component library (issue 22), not before.

The GitHub Pages site is a single page: what it is, screenshots, install command,
link to the repository. No blog, no pricing, no sitemap. It can grow later if
anyone actually arrives.

## Done when

- A stranger can go from the repository to a running app using only the README.
- The site is published and linked from the repository.
- The costs-money and gaps-are-permanent caveats are stated plainly.
