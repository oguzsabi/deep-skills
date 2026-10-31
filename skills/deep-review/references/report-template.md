# Review report template

Keep each section as short as the findings allow. Use "None" or "N/A: <reason>" instead of deleting a section, so the user can see it was checked. Follow the repo's output-style rules when filling it in.

```markdown
# Review: <task title> (<ticket ref if any>)

**Verdict:** <ready for PR | ready after the open items below | not ready — <main reason>>

## Scope
- Base: <branch> · Diff: <N files, +X/−Y> · Includes uncommitted: <yes/no>
- Reference: <plan location / ticket / reconstructed from commits>
- Reviewers: own pass + independent agent (<N findings, M confirmed, K rejected>) / independent pass skipped: <why>

## Requirements
| R# | Requirement | Implemented | Tested by | Status |
|----|-------------|-------------|-----------|--------|
| R1 | ... | file:line | spec:test name | done / partial / missing / untested |

Plan deviations: <planned-but-missing, unplanned-but-justified, scope creep>

## Fixed during review
- `file:line` — <problem> → <fix> (<category: bug / edge case / regression / quality / lint / test / docs>)

## Needs your decision
**Q1. <short title>** — <severity: high/medium/low>, <confirmed/plausible>
<what's wrong, where (file:line), the concrete case that triggers it>
- **A. <option> (Recommended)** — <why / consequence>
- B. <option> — <consequence>
- C. <option> — <consequence>

## Checks
| Check | Command | Result |
|-------|---------|--------|
| Unit (new/changed) | `<cmd>` | <N passed / failures> |
| Unit (suite) | `<cmd>` | ... |
| E2E | `<cmd>` | ... / not run: <reason, what the user should run> |
| Typecheck / build | `<cmd>` | ... |
| Lint | `<cmd>` | ... |
| Format | `<cmd>` | ... |

Test coverage vs plan: <planned tests present/missing; requirements without a test>

## Docs
- Updated: <files>
- Still stale / missing: <files, or none>

## Not verified
- <anything that couldn't be checked, and why>

## Out-of-scope observations
- <pre-existing issues noticed, not changed>
```
