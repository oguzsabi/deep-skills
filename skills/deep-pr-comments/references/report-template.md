# PR comments report template

Keep it scannable. Use "None" instead of deleting a section, so the user sees it was checked. Follow the repo's output-style rules when filling it in (draft replies are written in normal, polite prose regardless, since reviewers will read them).

```markdown
# PR comments: <PR title> (#<N>)

**Summary:** <X comments · Y fixed · Z need you · W reply-only> · checks <green / failing: which>
**Source:** <GitHub via gh / GitHub connector / screenshots / pasted text> — <why a higher source wasn't used, if applicable>

## Comments
<!-- Origin: inline / top-level / Copilot open / Copilot previously missed / Copilot low-confidence -->
| C# | Reviewer | Origin | Where | Claim (short) | Verdict | Action | Risk |
|----|----------|--------|-------|---------------|---------|--------|------|
| C1 | @name | inline | file:line | ... | Valid – bug | Fixed | low |
| C2 | @copilot | Copilot previously missed | file:line | ... | Invalid | Reply | — |
| C3 | @name | inline | file:line | ... | Valid – improvement | Needs you (Q1) | medium |

## Copilot "resolved since last review" — re-verified
| Item | Where | Really resolved? | Fix introduced issues? |
|------|-------|------------------|------------------------|
| <short> | file:line | yes / no → C# | none / <issue> → C# |

## Fixed
- **C1** `file:line` — <what was wrong> → <what changed> · test: <spec / test name> · risk checked: <callers/modes checked>

## Conflicts with earlier decisions
- **C4** asks for <X>. Conflicts with <decision>, decided in <plan Q3 / ticket / docs file / PR thread>. → see Q2
- Reviewer conflict: **C5** vs **C6** — <summary>. → see Q3

## Needs your decision
**Q1. <short title>** (C3) — <severity>, <confirmed/plausible>
<what the comment asks, what you found (file:line), the risk>
- **A. <option> (Recommended)** — <why / consequence>
- B. <option> — <consequence>
- C. Don't change; reply with <reason> — <consequence>

## Checks
| Check | Command | Result |
|-------|---------|--------|
| Unit (changed) | `<cmd>` | ... |
| Unit (suite) | `<cmd>` | ... |
| E2E | `<cmd>` | ... / not run: <reason, what to run> |
| Typecheck / build | `<cmd>` | ... |
| Lint / format | `<cmd>` | ... |

## Docs updated
- <file> — <what changed>, or None

## Draft replies (not posted)
**C1** — Good catch, fixed in <file>: <one line on the fix>. Added a test covering <case>.
**C2** — <evidence-based explanation, e.g. "This is handled in `file:line`: ... so the null case can't reach here.">

## Skipped
- <N resolved threads skipped> · <comments not reviewed and why>
```
