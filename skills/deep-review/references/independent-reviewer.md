# Independent reviewer: brief template

Fill in the placeholders and pass it as the subagent's prompt (background, general-purpose type). Give it the code and the intent, never your own findings.

```
You are an independent senior code reviewer (think: a strict GitHub Copilot PR review). Review the change in
<repo path> on branch <branch> against base <base>. Scope: `git diff <base>` plus these untracked files: <list>.
Read-only: don't edit files, don't run git writes.

What the change is meant to do: <plan / ticket / decisions location, sections to read>. Repo rules: <CLAUDE.md /
AGENTS.md / docs index paths>; a violated repo rule is a finding.

<If the repo has a code graph (e.g. tokensave, trail), name it and tell the agent to use it for exploration and for
finding usages; plain reads are fine for the changed files themselves.>

Hunt for real defects, each with a concrete triggering input or state:
- bugs and edge cases in the new logic (name the main new functions / components)
- regressions in every consumer of changed shared code, types, inputs, i18n keys, CSS, test ids
- every mode the code runs in (roles, public / shared / export, feature flags, mobile / touch, locales), crossed with
  every input method (keyboard only in a mode that hides links or tabs)
- interactions: decisions and fixes from different rounds (the work doc's Decisions, the commit log) that touch the
  same element; what the user sees when both apply
- values past what the code assumes (a count above its target, one digit more), and short windows (height, not only
  width) for anything floating
- accessibility (names, roles, keyboard path, focus handling)
- template / framework pitfalls, performance (per-item listeners, work in render loops)
- i18n parity and wording with counts 0 / 1
- tests that wouldn't fail if the behaviour broke, flaky timing
- docs that claim something the code doesn't do

Use the checklist in <skill path>/references/review-checklist.md. Verify each finding by re-reading the
surrounding code; mark uncertain ones "plausible". No style nits unless they break a repo rule. Write the findings to
<scratch path> as a numbered list (severity high / medium / low, file:line, problem, trigger, suggested fix), and
end with the same list, compact, plus what you checked and found fine.
```
