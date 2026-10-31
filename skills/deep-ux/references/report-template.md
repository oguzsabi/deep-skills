# UX review: report and work doc section

The same content goes into the work doc's "UX review" section and the report to the user. Use "None" or "N/A: <reason>" instead of deleting a section. Follow the repo's output-style rules.

```markdown
## UX review (deep-ux, <date>)

**Summary:** <one or two sentences: overall clarity and ease of use, the biggest problem>

### Scope
- Screens: <...> · Compared with: <neighbours> · Persona(s): <...>
- Contexts: <viewports, locales, roles, states> · Independent pass: <N suggestions, M merged> / skipped: <why>

### First impressions
| Screen | What it seems to be for | Main action seen | Matches intent? |
|--------|-------------------------|------------------|-----------------|

### Tasks
| Task | Done? | Friction |
|------|-------|----------|

### Suggestions
(one block per suggestion, as a question; blocks first, then friction, then polish)

**Q1. <short title>** — <blocks / friction / polish>, effort <S / M / L>, <screen>
What happens: <the moment, with evidence file>. Principle: <heuristic>. <Contradicts <doc>: <what> — if so>
- **A. <change> (Recommended)** — <why; before/after prototype file if any>
- B. <alternative> — <trade-off>
- C. Keep as is — <what that costs the user>

### Bugs noticed (for deep-ui-test)
- <bug, where, steps>

### Decisions (after answers)
- Implemented: <suggestion → files>
- For /deep-plan: <suggestion, evidence>
- Rejected: <suggestion — reason>
```
