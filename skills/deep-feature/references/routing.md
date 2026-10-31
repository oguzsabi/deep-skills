# Routing: what runs next

Route from the Flow table, the latest step's flags and `git diff --name-only <base>` (plus uncommitted and untracked files). Don't read code to route; file names and the steps' reports are enough.

## Contents

1. The Flow table
2. The default order
3. Skip rules
4. Re-run rules
5. Loop guard
6. Classifying changed files

## 1. The Flow table

Kept in the work doc, right under "Resume here":

```markdown
## Flow (deep-feature)
Mode: <subagents | herdr — workspace <id>, lead tab <id>>

| # | Step | Status | Round | Where | Outcome / reason |
|---|------|--------|-------|-------|------------------|
| 1 | deep-plan | done | 1 | herdr tab `plan` | 11 R#, 8 decisions |
| 2 | implement | done | 1 | herdr tab `implement` | 14 files, checks green |
| 3 | deep-test | done | 1 | subagent | 6 cases added, 1 bug fixed · logic_changed |
| 4 | deep-ui-test | asking | 1 | herdr tab `ui-test` | Q1-Q3 open |
| 5 | deep-ux | skipped | – | – | only copy and colour changes |
```

Statuses: pending / running / asking / done / skipped / failed / waiting (on the user or an external event).

## 2. The default order

1. `/deep-plan` — no plan in the work doc, or the scope changed enough that the plan is wrong.
2. **Gate: go to implement.**
3. implement — the plan's Implementation section (`../deep-plan/SKILL.md`, "Implementation (only after the go)").
4. `/deep-test`
5. `/deep-ui-test` — when UI changed.
6. `/deep-ux` — when the UI change is visible enough (skip rules).
7. `/deep-review`
8. **Gate: go to ship.**
9. `/deep-ship` — runs in the conductor (it's light and outward-facing).
10. Waiting for PR review → `/deep-pr-comments` → re-runs → **gate** → `/deep-ship`.

Joining mid-flow: start at the first step that isn't done or skipped, after checking that done steps aren't stale (re-run rules).

## 3. Skip rules

Record every skip with its reason.

- **`/deep-plan`**: skip only when the work doc already has a plan the user approved and the scope hasn't changed.
- **`/deep-ui-test`**: skip when no UI file changed (§6). A UI file changed only in a test or story file doesn't count.
- **`/deep-ux`**: run when the change adds or reshapes something the user sees: a new screen, section, dialog, flow or interaction pattern, or a layout change. Skip for copy edits, colour or spacing tweaks, bug fixes that restore intended behaviour, and invisible changes. When unsure, run it.
- **`/deep-test`**: skip only when no logic changed (docs, copy or style only).
- **`/deep-review`**: never skipped before a ship.

## 4. Re-run rules

After any step that changed code (`/deep-ui-test`, `/deep-ux` picks, `/deep-review`, `/deep-pr-comments` fixes):

- `logic_changed` → scoped `/deep-test` on the changed units.
- `ui_changed` → scoped `/deep-ui-test` on the scenario rows touching the changed files, plus their regression neighbours.
- Then continue from where the flow was.

`/deep-review` round 2 runs when round 1 fixed 3 or more findings, or made any fix beyond one-liners, or the user changed something after round 1. Round 2 reviews the fixes and anything changed since round 1, not the whole branch again.

A step whose results are stale (code it covered changed after it finished, and no scoped re-run covered that) re-runs before `/deep-review`.

A user answer that changes the plan (new requirement, changed behaviour) sends the flow back to `/deep-plan` to update the plan, then forward again from the first step the change affects.

## 5. Loop guard

Count rounds per step in the Flow table. A step that would start round 3 stops the flow with a question:

- **A. Run round 3 (Recommended only if the last round found new real issues)**
- **B. Accept the current state and move on, with the open items listed**
- **C. Go back to `/deep-plan`** (repeated failures usually mean the design is wrong)

## 6. Classifying changed files

- **UI**: templates and markup, styles, component files, translation files, icons and images, routes. Use the repo's layout (e.g. `*.component.html|scss|ts`, `*.tsx`, `*.vue`, `public/i18n/*`).
- **Logic**: everything executable that isn't purely presentational: services, utils, stores, guards, interceptors, mappers, component logic.
- **Tests and docs**: specs, e2e, docs. They don't trigger re-runs by themselves.

A component file can be both UI and logic; treat it as both.
