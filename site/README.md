# AllSearch landing page (staged, not published)

A single static page for GitHub Pages: what AllSearch is, screenshots, the
install command, and a link back to the repository (issue 23). Plain
HTML/CSS, no build step, no dependencies.

`screenshots/overview.webp` and `screenshots/history-drilldown.webp` are real,
sanitized screenshots from a populated install (dashboard overview and a
prompt drill-down), resized to 1600px wide and compressed to WebP.

## Deploying

The `Deploy site to GitHub Pages` workflow (`.github/workflows/deploy-pages.yml`)
is `workflow_dispatch`-only: it never runs on push, and must be triggered by
hand from the Actions tab once the real screenshots are in place and GitHub
Pages is configured to build from GitHub Actions.
