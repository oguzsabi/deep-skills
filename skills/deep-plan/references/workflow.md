# The deep-* workflow and the work doc

Shared by every deep-* skill. Read it at the start of any of them.

## Contents

1. The flow
2. Who owns the tests
3. The work doc
4. Resuming in a new session or after compaction
5. Subagents

## 1. The flow

```
/deep-plan ──go──▶ implement ──▶ /deep-test ──▶ /deep-ui-test ──▶ /deep-ux ──▶ /deep-review ──▶ /deep-ship
                                  (logic)        (UI changed)      (optional)                      │
                                                                                                    ▼
             scoped re-run of /deep-test or /deep-ui-test ◀── fixes ◀── /deep-pr-comments ◀── PR review
```

Each step can be invoked by hand, or `/deep-feature` conducts the whole flow: it routes, skips and repeats steps, runs each heavy step in its own fresh context (a subagent, or a named Herdr tab), relays questions, and stops at the two gates (go to implement, go to ship). It keeps a "Flow" table in the work doc.

| Skill | Runs when | Reads | Produces | Next |
|-------|-----------|-------|----------|------|
| `/deep-plan` | Before any code | Ticket, designs, code, docs | Plan, R# list, edge cases, test plan, decisions | Implement on an explicit go |
| implement | After the go | Plan | Code, planned unit and e2e tests | `/deep-test` |
| `/deep-test` | After implementing, or on any target | Diff, plan, R#, edge cases | Change model, plausible edge cases, audited and added unit/integration tests, fixed bugs | `/deep-ui-test` if UI changed, else `/deep-review` |
| `/deep-ui-test` | UI changed | R#, diff, `/deep-test` cases | Scenario matrix run in a real browser, fixed bugs, audited and added e2e tests | `/deep-ux` (optional), then `/deep-review` |
| `/deep-ux` | UI changed or a screen to audit | Screens, app/design docs | Ranked UX suggestions; picked small ones implemented | `/deep-review` |
| `/deep-review` | Before the PR | Everything above | Verdict, fixes, open questions | `/deep-ship` |
| `/deep-ship` | Work ready to push | Branch, work doc | Commits, PR | Wait for review |
| `/deep-pr-comments` | PR got comments | Comments, work doc | Fixes, replies | Scoped re-run of `/deep-test` / `/deep-ui-test` if logic/UI changed, then `/deep-ship` |

Rules:

- **Start from what earlier skills recorded.** Every skill reads the work doc first and reuses its R# numbering, edge cases, decisions and results. Never re-derive a requirement list, re-run a ruled-out hypothesis, or re-ask an answered question.
- **End by naming the next step**, in the report and in the work doc's "Resume here".
- **Skipping is fine when a step doesn't apply** (no UI change → no `/deep-ui-test`). Record the skip and the reason, so a later skill doesn't think it was forgotten.
- **Re-runs are scoped.** After a later fix, re-run only the cases and scenario rows that touch the changed code, not the whole skill.

## 2. Who owns the tests

- `/deep-plan` plans unit and e2e tests; the implementation writes them.
- `/deep-test` audits and extends **unit and integration** tests: keep, update, remove, add.
- `/deep-ui-test` audits and extends **e2e** tests the same way.
- `/deep-review` checks the tests exist, are meaningful and pass. It doesn't generate a second edge-case list.
- Tests that existed before this work are only removed with the user's agreement, unless the plan changed the behaviour they assert (then they're updated, with the R# that justifies it).

## 3. The work doc

One document per piece of work holds its plan, decisions, every skill's results and the current state. It's what lets a new session, or the same session after compaction, continue without losing anything. Session scratchpads don't survive the session, so they never hold the only copy of anything that matters.

### Where it lives

1. A doc already named in the conversation, the plan, or project memory.
2. The repo's feature/plan doc location (its docs index, `docs/features/`, ADR folder...): look for a doc for this ticket or branch.
3. None exists: create one where the repo keeps such docs, named after the ticket/topic, and add it to the docs index if the repo has one. If the repo has no docs convention at all, ask once: (A) `docs/<topic>.md` in the repo (Recommended: survives machines and sessions), (B) an untracked local file.

### Shape

Adapt to the repo's doc format and to the doc's existing structure; don't restructure a doc that already exists. Make sure these parts exist:

```markdown
# <title> (<ticket>)
<the repo's header convention, e.g. Summary / Tags / Status>

## Resume here
- Stage: <skill> — <phase or step> — <in progress | done> (<date>)
- Next: <the exact next step, with the command if any>
- Open questions: <short titles, or none>
- Working tree: <branch>, <uncommitted changes yes/no>, <data created in shared envs, if any>

## Flow                      (deep-feature only: one row per step, status, round, outcome)
## Plan                      (deep-plan)
## Decisions                 (every answered question, by short title)
## Implementation notes      (implement)
## Unit test pass            (deep-test, dated)
## UI test pass              (deep-ui-test, dated, with the scenario matrix)
## UX review                 (deep-ux, dated)
## Review                    (deep-review, dated rounds)
## PR comments               (deep-pr-comments, dated rounds)
```

On a re-run, add a dated "Round N" subsection to the skill's section instead of a second section.

### When to write

- **At the start**: set "Resume here" to `<skill> — in progress — <phase>`.
- **After every phase**, and inside long phases after each batch (e.g. every few scenario rows). Never leave more than one phase of results only in the conversation.
- **Immediately on a CONTEXT CHECKPOINT or usage warning**, before anything else.
- **At the end**: the skill's section, "Resume here" with the next step, and the docs index entry.

Write facts, results, decisions, file refs and commands; not narration. Never write secrets, credentials, tokens or personal data from real accounts.

### Evidence

Keep only evidence worth keeping, in a folder next to the doc named `<doc-stem>-<skill>/` (e.g. `checkout-redesign-ui-test/`) with a short `README.md` index: before/after screenshots of fixed bugs, screenshots backing UX suggestions, GIFs of a reproduced bug. Compress images (JPEG, about 1440px wide). Everything else stays in the session scratchpad.

## 4. Resuming in a new session or after compaction

1. Read "Resume here" and the current skill's section.
2. Check the tree matches it (`git status`, `git log`, the diff). If the code changed since results were recorded, mark the results that touch changed files as stale and redo them.
3. Continue from the recorded step. Don't redo finished work and don't re-ask answered questions.

## 5. Subagents

Use them when they make the work faster without losing quality; otherwise work inline.

- **Good uses:** an independent, unanchored second pass (reviewer, edge-case or scenario generator) briefed with the scope and the reference but never your conclusions; writing tests for 2+ independent modules, each agent owning its own spec files; long test or e2e runs in the background while you keep working.
- **Contract for each agent:** the files it owns (no two agents edit the same file), what "done" means, where it writes its result (a scratch file plus a compact summary), no git writes. Mechanical work (writing specs from a fixed case list) can use a smaller model.
- **At most 3 at once.** Say in one line why parallel is faster.
- **The browser stays in the main thread.** One browser, one login, shared data: parallel browser agents interfere. Under `/deep-feature` the "main thread" is the step's own session or agent; only one browser step runs at a time.
- **A step running under `/deep-feature`** can't ask the user directly when it's a subagent: it ends its turn with its questions and gets the answers as its next message (see `deep-feature/references/dispatch.md`).
- **Their output is a claim.** Verify every finding and review every test they write before it counts.
