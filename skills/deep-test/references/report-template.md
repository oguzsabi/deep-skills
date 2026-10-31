# Unit test pass: report and work doc section

The same content goes into the work doc's "Unit test pass" section and the report to the user. Use "None" or "N/A: <reason>" instead of deleting a section. Follow the repo's output-style rules.

```markdown
## Unit test pass (deep-test, <date>)

**Verdict:** <proven | proven after the open items | gaps remain — <main reason>>

### Scope
- Target: <diff vs base / files / feature> · Units: <N> · Reference: <plan / ticket / work doc sections>
- Baseline: <suite, pre-existing failures or none>
- Independent edge-case pass: <N cases, M kept, K ruled out> / skipped: <why>

### Change model
| Unit | Purpose (R#) | Inputs and sources | Invariants | Callers / modes |
|------|--------------|--------------------|------------|-----------------|

### Edge cases
| # | Case | Real path that produces it | Unit | Test | Result |
|---|------|----------------------------|------|------|--------|
| E1 | ... | ... | file:line | spec: test name | pass / bug fixed / bug open / UI-only → deep-ui-test |

Ruled out: <case — why it can't happen>, ...

### Test audit
| Test | Verdict | Reason | Mutation check |
|------|---------|--------|----------------|

### Bugs
- Fixed: `file:line` — <problem> → <fix>, regression test <name>
- Open: see questions

### Checks
| Check | Command | Result |
|-------|---------|--------|

### For deep-ui-test
- <UI-visible cases found here that need a real browser>

### Not verified
- <what and why>
```

Questions for the user follow the report:

```markdown
**Q1. <short title>** — <severity>, <confirmed / plausible>
<what, where (file:line), the triggering case>
- **A. <option> (Recommended)** — <why>
- B. <option> — <consequence>
```
