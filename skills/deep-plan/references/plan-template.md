# Plan template

Use this structure for the plan presented in Phase 7. Keep each section as short as the task allows; for a small task many sections are one line. Use "N/A: <reason>" instead of deleting a section, so the user can see it was considered. Follow the repo's output-style rules (terseness, language) when filling it in.

```markdown
# Plan: <task title> (<ticket ref if any>)

## Sources reviewed
- <ticket / design / doc / file> — what it contributed
- Not available: <anything you couldn't read, and why>

## Goal
<one or two sentences>

## Requirements
- R1 <requirement> — acceptance: <how to verify>
- R2 ...
- Implicit: <assumed requirements, labeled as such>
- Non-goals: <out of scope>

## Current state
- <how it works today, with file:line refs>
- Affected callers / screens / modes: <list>
- Relevant history: <commits, prior docs, earlier attempts>
- Existing tests: <which cover this area; baseline result if run>

## Approach
<chosen approach, and why it's the smallest correct change>
Alternatives considered: <one line each, why not>

## Changes
| File | Change | Why (R#) |
|------|--------|----------|
| path/to/file | what changes | R1 |

Deliberately not changing: <shared code / adjacent areas left alone>

## Implementation order
1. <step> → verify: <check>
2. <step> → verify: <check>

## Cross-repo / ship order
<dependencies, deploy order, compatibility window — or N/A>

## Edge cases
| Case | Handling |
|------|----------|
| <case> | <how handled / N/A: reason> |

Regression risks in existing behavior: <what could break, and how the plan prevents or tests it>

## Tests
- New unit: <file> — <test name> — proves R#/edge case
- Updated: <file> — <test> — intended change / setup fix
- E2E: <flow, data, assertions — or "not needed because ...">
- Run with: `<commands>`
- Documented in: <location>

## Assumptions
- <anything unverified that the plan relies on>

## Out-of-scope observations
- <unrelated issues noticed, not addressed>

## Decisions
- <question short title> → <answer> (round N)

## Questions
<!-- Numbered Q1.. from 1 in every message, one sequence across Blocking and Defaults. -->
### Blocking
**Q1. <question>**
<context with file refs>
- **A. <option> (Recommended)** — <why / consequence>
- B. <option> — <consequence>
- C. <option> — <consequence>

### Defaults I'll assume unless you object
- **Q4.** <choice> → default: <option>, because <reason>
```
