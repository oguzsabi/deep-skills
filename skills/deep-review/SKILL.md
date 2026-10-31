---
name: deep-review
description: Thorough post-implementation review of the work done in this branch/session, in any repo, done twice by default: your own pass plus an independent reviewer agent running in parallel (skipped only when the user says so). Compares the changes against the plan and the ticket/story requirements, hunts bugs and regressions in existing code, checks the edge cases /deep-test and /deep-ui-test covered have tests (without generating its own edge-case sweep), checks code quality and unnecessary complexity, verifies unit and e2e tests exist, are meaningful and pass, runs formatter/linter/typecheck and fixes their issues, checks docs are updated, then fixes every straightforward issue itself and asks the user about the rest with recommended options. Use whenever the user invokes /deep-review, or asks to "review everything we've done", "compare to the plan", "check we didn't break anything", "make sure requirements are met", "check tests and lint", or wraps up an implementation and wants it verified before a PR.
argument-hint: "[optional: base branch, plan file, ticket ref, or scope]"
---

# Deep Review

A full review of the implementation just done, the way a careful senior reviewer would do it before approving a PR, followed by fixing what can be fixed without the user and a clear list of what needs their decision.

It runs after `/deep-test` and `/deep-ui-test` in the deep-* flow; `references/workflow.md` describes the flow and the work doc this review reads and writes.

The review answers five questions, in this order of importance:

1. **Did we build what was asked?** Every requirement of the story/plan is implemented and nothing unrequested slipped in.
2. **Is it correct?** No bugs or unhandled edge cases in the new code.
3. **Did we break anything?** Existing behavior in every caller, screen and mode still works.
4. **Is it proven?** Meaningful tests cover the requirements and edge cases, and the full relevant suites, lint, format and typecheck pass.
5. **Is it clean and documented?** No unnecessary complexity, matches repo conventions, docs are current.

## Ground rules

1. **Repo instructions win.** Read `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` / docs index first. Their rules are review criteria (a violated repo rule is a finding), and their conventions (output style, commands, doc locations, commit policy) override this skill.
2. **Verify every finding before reporting it.** Re-read the code around it, check callers, and try to disprove it. A reviewer who reports false positives wastes the user's attention and gets ignored. Mark anything you couldn't fully confirm as "plausible" rather than stating it as fact.
3. **Stay inside the change.** Review the diff and its blast radius. Don't reformat, refactor, or lint-fix code the change didn't touch; list pre-existing problems separately as out-of-scope observations.
4. **Report reality.** Test, lint and build results are the actual output of commands you ran. If something couldn't be run, say so and why. Never weaken a test, skip it, add a lint-disable, or loosen a type to get green.
5. **No commits or pushes** unless the repo's working agreement or the user says so.
6. **Two reviewers by default.** Every review has two passes: your own, and an independent reviewer agent started in parallel with only the scope and the reference, never your conclusions (Phase 1b). A single reviewer anchored on its own reading keeps missing what an outside reviewer (e.g. Copilot) then finds. Skip the second pass only when the user says so ("quick review", "no agent", "just you"), and say in the report that it was skipped.

## Workflow

### Phase 1 — Establish scope and the reference

- **The diff.** Find the base: the branch this work will merge into (from the repo's conventions, the PR target, or `git merge-base` with the default/development branch). Review `git diff <base>...HEAD` **plus** uncommitted and untracked changes. List every changed file. If the scope is ambiguous (e.g. the branch contains unrelated earlier commits), state what you're reviewing and why.
- **Scoped rounds aren't enough on their own.** A round asked for one delta (e.g. "only the UX changes") reviews that delta in full, and also re-reads the rest of the branch for interactions with it (Phase 3b). The last review before the PR is marked ready, or before `/deep-ship` after several scoped rounds, covers the whole branch against the base, including the user's own commits and earlier review fixes: bugs from later fixes meeting earlier work are only visible there.
- **The reference.** Collect what the work is supposed to do: the plan (from this conversation, a plan file, or a `/deep-plan` output), the ticket/story with its acceptance criteria and comments (fetch it if a ref is in the branch name, commits or conversation), designs, and any answers the user gave during planning. Read the work doc first: its plan, decisions, and the "Unit test pass" / "UI test pass" / "UX review" sections are part of the reference. If there is no plan and no ticket, reconstruct the intent from commit messages and the conversation and say that's what you did.
- **The checks.** Find the repo's test, lint, format, typecheck and build commands (see `references/checks.md`).

### Phase 1b — Start the independent reviewer

Right after Phase 1, launch one background subagent (the general-purpose type, same model) as an independent reviewer, then continue with your own pass while it runs. Brief it with `references/independent-reviewer.md`: the repo path, base branch, the exact scope (diff + untracked files), where the plan/ticket/decisions live, the repo rules files, and the checklist; ask for findings with a concrete trigger each, written to a scratch file and returned as a compact list. Don't pass your own findings or suspicions; an anchored second reviewer only confirms what you already think.

While it runs, don't edit files in its scope (its file:line references would go stale); do your own Phases 2-8 read-only, then wait for it before Phase 9. If it fails or times out, say so in the report and continue with your own findings.

### Phase 2 — Requirements and plan conformance

Build a traceability table: each requirement (R#) or acceptance criterion → where it's implemented (file:line) → which test proves it → status (done / partial / missing / untested).

Then compare the plan to the diff:

- Planned changes that didn't happen.
- Changes that weren't planned: justified deviations (note why) vs scope creep (candidate for removal).
- Answers the user gave during planning: check each one is reflected in the code.
- Edge cases the plan said it would handle: check each one actually is.

### Phase 3 — Correctness

Read every changed hunk **with its surrounding context**, not the diff alone; many bugs are only visible next to the unchanged code. Walk `references/review-checklist.md` sections 1-3 against the change. For each potential issue, trace the concrete input or state that would trigger it. If you can't name one, it's probably not a real bug.

Generating edge cases belongs to `/deep-test` (logic) and `/deep-ui-test` (browser); don't build a second sweep here. If they ran, check their case lists cover every changed unit and every R#, and that each kept case has its test. If they didn't run (or the code changed since), say so in the report and recommend running them, scoped to what's missing.

### Phase 3b — Interactions between decisions

Each decision, fix and feature can be right on its own and wrong together, especially when they were made in different rounds (planning, review fixes, UX answers, the user's own commits). List them from the work doc's Decisions and the commit log, with the UI element or state each one touches (a header, a count, a card, a tooltip, a sort, a mode). For every pair that touches the same element, ask: when both apply at once, does the user still see something true and reachable? Typical misses: an "order stays" decision next to a sort indicator that still claims a sort; a popover that flips sides next to a tooltip forced to one side; "show a summary only when there's no link" next to "opens on keyboard focus" in a mode with nothing focusable. Each pair that breaks is a finding with its trigger.

### Phase 4 — Regressions in existing code

For every changed symbol (function, component input, style, shared util, API call, type, config key), find all its callers and consumers using the best tool available (code graph/LSP, else grep). Check each one still behaves correctly, including in every mode/context the code runs in (roles, public/shared/export, feature flags, mobile/desktop, locales). Check that tests touching these callers still pass and still assert what they used to (an existing test silently changed to match new behavior is a regression hiding in plain sight). Section 4 of the checklist lists what to look for.

### Phase 5 — Code quality and simplicity

Walk checklist sections 5-6. The central question: would a senior engineer on this repo say this is overcomplicated, or that it doesn't look like the rest of the codebase? Look for unnecessary abstractions, duplicated logic that an existing utility already covers, dead code and orphans the change created, leftover debug code, unclear naming, comments that restate code, and violations of the repo's own rules.

### Phase 6 — Tests

- **Coverage against the plan**: every planned test exists, and every requirement and handled edge case has a test that would fail if it broke. Reuse the test audits from `/deep-test` and `/deep-ui-test` (verdicts, mutation checks) instead of redoing them; re-check only tests changed since.
- **Quality**: tests assert behavior, not implementation; deterministic; meaningful names; no `.only`/`fit`/`fdescribe`/`skip`/`xit` left behind; no assertions weakened compared to the base branch. For each important test, do the thought experiment: if the line it protects were reverted or subtly broken, would this test fail? If not, the test isn't doing its job.
- **Run them**: new and changed tests first, then the wider relevant suite, then e2e if the plan or repo calls for it. If e2e can't run here (missing backend, env, browser), say exactly what's needed and what the user should run.
- **Existing tests updated correctly**: changes to existing tests match intended behavior changes, not accommodations of a regression.

### Phase 7 — Lint, format, types, build

Run the repo's formatter check, linter, typecheck and build per `references/checks.md`, **scoped to changed files** where the tool allows it, so fixes don't sprawl into unrelated code. Fix errors and warnings in lines the change touched. For warnings in untouched code within changed files, list them and ask rather than fixing (they'd add unrelated noise to the diff), unless the repo's rules say otherwise. Re-run after fixing until clean.

### Phase 8 — Docs

- Docs the repo expects for this kind of change exist and are current (feature write-ups, docs index, README, API docs, changelog, test documentation).
- Docs that the change made stale are updated (a fixed backlog item, a changed behavior, a closed known gap).
- New user-facing strings exist in every locale the repo supports.
- Test documentation matches the tests that actually exist.

### Phase 9 — Triage and fix

Merge the two passes first: deduplicate, then verify every independent-reviewer finding in the code yourself exactly as you verify your own (ground rule 2). Its findings are claims, not facts: confirm, mark "plausible", or reject with the reason. Reproduce UI findings in the running app when that settles them faster than reading.

Sort every confirmed finding:

**Fix now, without asking**, when all of these hold:
- there's one clearly correct fix, and it's small;
- it's inside the change's scope (code this work added or modified);
- it doesn't change product behavior the user decided, public contracts, or shared code outside the change;
- it doesn't delete or weaken tests.

Typical examples: lint/format/type errors in changed lines, a missed null guard with obvious handling, a leftover debug statement, an orphaned import, a missing translation key with the copy already known, a test the plan specified but that wasn't written, a stale doc line.

**Ask the user** for anything else: product/UX choices, several valid fixes with different tradeoffs, changes to shared or unrelated code, contract or schema changes, removing work that looks like scope creep, pre-existing problems, anything risky.

After fixing, **review the fixes themselves** (they can introduce new problems) and re-run the affected tests, lint, typecheck and build. Keep fixing and re-running until they pass, or until a remaining failure needs the user's input.

### Phase 10 — Report

Use `references/report-template.md`. Lead with a one-line verdict (ready for PR / ready after the open items / not ready). Questions for the user follow the same format as `/deep-plan`: numbered (Q1, Q2, ...), context with file refs, options **A / B / C** with the recommended option first, marked **(Recommended)** with a reason.

Record the review in the work doc ("Review" section, dated round) and set "Resume here" to the next step (`/deep-ship` when ready).

When the user answers, apply the decisions, re-run the checks they affect, and post a short delta report rather than the whole report again. Repeat until nothing is open.

## Reading the user's answers

The user usually answers as a plain numbered list, one line per question:

```
1. answer
2. another answer
```

- `N.` answers QN of the most recent message that asked questions. That's why every message that asks questions numbers them from Q1, in one sequence.
- Accept any answer form: a letter ("B"), a letter with a tweak ("A, but keep the old label"), "ok" / "yes" / "recommended" (the recommended option), or free text. Free text that matches no option is the answer; don't force it into one.
- A missing number leaves that question open. Ask again only about the unanswered ones.
- Before acting, echo a compact mapping (`Q1 → A: <short>`, `Q3 → <free text, short>`) so a misread is caught at once. If an answer doesn't fit its question (the list looks shifted, or it answers a different question), ask instead of guessing.
- Record every answer in the delta report under a Decisions list with the question's short title, so answers survive context compaction and later rounds can refer to them.
