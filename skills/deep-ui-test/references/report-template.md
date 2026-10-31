# UI test pass: report and work doc section

The same content goes into the work doc's "UI test pass" section and the report to the user. Use "None" or "N/A: <reason>" instead of deleting a section. Follow the repo's output-style rules.

```markdown
## UI test pass (deep-ui-test, <date>)

**Verdict:** <all requirements verified | verified after the open items | not verified — <main reason>>

### Scope
- Environment: <app URL, backend env> · Roles: <...> · Viewports: <...> · Locales: <...>
- Screens: <touched> · Regression neighbours: <...>
- Independent scenario pass: <N rows, M merged> / skipped: <why>

### Requirements
| R# | Requirement | Rows | Status |
|----|-------------|------|--------|
| R1 | ... | S1-S4 | verified / verified with mocked data / failed / not verified |

### Scenario matrix
| ID | R# | Scenario | Context | Data | Expected | Status | Evidence |
|----|----|----------|---------|------|----------|--------|----------|
| S1 | R1 | ... | admin · 1440 · en | created (UI) | ... | pass | s1-....jpg |

### Bugs
- Fixed: S7 — <problem>, `file:line` → <fix>; regression test <name>; before/after in <evidence folder>
- Open: see questions

### Regression sweep
- <neighbour screen / mode>: <ok / issue>

### E2E
| Spec | Verdict (keep / update / remove / new) | Covers |
|------|----------------------------------------|--------|
Run: `<command>` → <result>

### Data
- Created: <type, id, env> → <deleted / kept at user's request>

### Not verified
- <scenario>: <why, and what's needed (real device, backend change, credentials)>
```

Questions for the user follow the report:

```markdown
**Q1. <short title>** — <severity>, <confirmed / plausible>
<what, where, minimal steps, evidence>
- **A. <option> (Recommended)** — <why>
- B. <option> — <consequence>
```
