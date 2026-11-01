# Changelog

## Unreleased

- `examples/`: a real `/deep-feature` run on a small issue-list app (ticket, work doc, screenshots, code), linked from the README.

## 0.2.0 (2026-10-31)

- Every skill folder now works on its own. Reference files that several skills read are copied into each skill that reads them by `scripts/sync-shared.mjs`; no skill points outside its own folder any more.
- deep-plan's implementation rules moved into `references/implementation.md`, so deep-test, deep-pr-comments and deep-feature can carry them.
- `scripts/check.mjs` checks frontmatter, references, shared copies, manifests, versions and README links, and runs in CI on every push and pull request.
- Wording that named one agent's tools is now general (a browser tool, a code index); Claude in Chrome, Playwright, tokensave, trail and Herdr remain examples.
- README: install for Claude Code, Codex, Cursor, OpenCode and other agents, a quick start, and a single-skill entry point.

## 0.1.0 (2026-10-31)

- First public release: deep-feature, deep-plan, deep-test, deep-ui-test, deep-ux, deep-review, deep-ship and deep-pr-comments.
