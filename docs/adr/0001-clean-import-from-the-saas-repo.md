# Clean import from the SaaS repo, no shared history

AllSearch is a port of the AllSearch SaaS (`clacladev/allsearch`), roughly
80% of whose 57k lines carry over unchanged, so starting from a fresh scaffold
was never sensible. We import the working tree as a single commit rather than
grafting the SaaS's 325 commits, because the SaaS is frozen and being sunset:
there will never be a fix to cherry-pick across, which was the only argument for
keeping shared ancestry.

## Consequences

- `git blame` on imported code points at the import commit. The SaaS repo remains
  the archaeological record for anything subtle, particularly the analysis layer
  under `libs/utils/project-analysis/`.
- No secrets cross over. The SaaS's `.env.local` contains live credentials and is
  not imported; only the shape of the required variables is.
