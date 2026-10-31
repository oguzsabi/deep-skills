---
name: deep-test
description: Deep code-level testing of the current changes, or of any target (files, feature, PR), in any repo. Builds a model of what each changed unit does and why, generates edge cases that can really happen (and rules out impossible ones), audits the unit/integration tests the implementation added (keep, update, remove, add), proves every important case with a test that fails when the behaviour breaks, fixes straightforward bugs it uncovers and asks about the rest, and records everything in the work doc so a new session can resume. Real-browser testing is left to /deep-ui-test. Use whenever the user invokes /deep-test, or asks to "test this deeply", "find the edge cases", "are our tests meaningful", "write the missing tests", "prove this works", or finishes an implementation and wants it proven before review.
argument-hint: "[optional: target files/feature/PR, base branch, or work doc]"
---

# Deep Test

Prove the change works at the code level: understand what it is meant to do, find the inputs and states that can really reach it, and make sure each important one is covered by a test that would fail if the behaviour broke. The output is a stronger test suite, fixed bugs, and a written record, not a list of opinions.

Read `references/workflow.md` first: where this skill sits in the flow, who owns which tests, the work doc, resuming, and subagents.

## Ground rules

1. **Repo instructions win.** Read `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` / docs index first. Their test conventions, commands and rules override this skill.
2. **Plausible cases only.** Every edge case names the real path that produces it: an API field the DTO or backend code allows to be null, a user action, legacy stored data, a mode, a race. If no path can produce it, it isn't tested; list it in one line as "ruled out: <why>". Tests for impossible states bloat the suite and bury the real ones.
3. **Tests prove behaviour.** Same bar as `references/testing.md`: traceable to an R# or edge case, asserts observable behaviour, deterministic, and fails when the behaviour breaks. Check that last point for real (Phase 4).
4. **Report reality.** Results are output of commands you ran. Never weaken an assertion, skip a test, add a lint-disable or loosen a type to get green.
5. **Stay inside the change.** Test the change and its blast radius. Pre-existing gaps elsewhere are listed, not filled, unless the user asks.
6. **Code level only.** Components are tested through their inputs, outputs and rendered DOM in unit tests. Behaviour that needs a real browser, backend or navigation goes to `/deep-ui-test`; note it there rather than faking it here.
7. **No commits or pushes** unless the repo's working agreement or the user says so.
8. **Keep the work doc current** (workflow.md §3): at the start, after every phase, at the end.

## Workflow

### Phase 0 — Resume check

Find the work doc. If it has an unfinished "Unit test pass", continue from its recorded step (workflow.md §4). If the code changed since cases were marked done, redo the ones touching changed files.

### Phase 1 — Scope, reference, baseline

- **Target**: the argument, or the diff against the base branch plus uncommitted and untracked changes. List the changed units: functions, components, services, pipes, stores, queries, mappers.
- **Reference**: the plan, ticket, decisions and earlier skill sections in the work doc. Reuse the R# numbering and the plan's edge-case sweep.
- **Test setup**: runners, commands, conventions and fixtures, from CI config and package scripts (`references/testing.md` first section; commands in `references/checks.md`).
- **Baseline**: run the existing tests for the area. Record pre-existing failures so they aren't blamed on this work.

### Phase 2 — Model the change

For each changed unit, write a compact row: what it does and which R# it serves; its inputs and **where each one comes from** (trace to the source: API DTO and, if reachable, the backend code that fills it; route params; user input; storage; another unit's output); outputs and side effects; invariants it must keep; callers and the modes it runs in (roles, public/shared/export, flags, locales, viewports).

Use the best code tool available (code graph, LSP, else grep) for callers and data sources. Put the table in the work doc. If a unit's intent can't be settled from code and material, that's a question, not a guess.

### Phase 3 — Generate edge cases

Walk `references/edge-cases.md` against each unit, both sides: new behaviour, and existing callers that could break. Then derive from the code itself:

- every branch and every boundary of every condition (`<` vs `<=`, empty vs missing, 0, first/last);
- values past what a unit assumes: a "done" above its "required", a count gaining a digit (9 → 10), a list longer than the fixtures ever have. Look for code or comments elsewhere that say it can happen (manual overrides, extras, imports); the fixtures never containing it is not evidence that it can't;
- invariants a helper relies on silently (a ≤ b, non-empty, sorted, one side always has room) that its callers don't guarantee;
- every shape each input source can actually produce (from Phase 2);
- combinations of states the code assumes can't co-occur, and orderings it assumes (load before click, A before B);
- logic with no test harness (a component method without a spec, a template expression): move it into a pure function where the repo's conventions allow, so the cases above get a unit test;
- the plan's edge cases: check each one is really handled.

Apply the plausibility filter (ground rule 2). Rank the survivors by likelihood × impact.

**Independent pass** for non-trivial changes (several units, or shared code): at the start of Phase 2, launch one background agent with the scope, the reference and edge-cases.md only (not your model or cases), asking for plausible edge cases each with its triggering path, written to a scratch file. Merge its list into yours and verify each one like your own. Skip it for small changes and say so.

### Phase 4 — Audit the existing tests

Use `references/test-audit.md`. For every test the work added or changed, and the existing tests covering changed units, give a verdict: keep / update / remove / merge, with the reason. List the cases and requirements with no test.

For the tests that guard the most important behaviour, run the **mutation check**: break the guarded line on purpose, run the test, confirm it fails, restore the line, confirm with `git diff` that nothing is left behind. A test that stays green is rewritten or replaced.

### Phase 5 — Write the tests

Write a test for each ranked case that lacks one, following the repo's conventions and the tests next to it. For a suspected bug, write the reproduction first and watch it fail.

When the cases span 2+ independent modules with substantial work, split the writing across up to 3 agents (workflow.md §5), each owning its spec files, given the case list, conventions and commands. Review every test they write against ground rule 3 before it counts.

### Phase 6 — Triage failures and fix

For each failing test, decide from the requirements whether the code or the test is wrong, never from which is easier to change.

**Fix the code now** when all of these hold: one clearly correct fix, small, inside the change's scope, doesn't change a decided product behaviour, public contract or shared code outside the change. The reproduction test stays as the regression test. Keep the fix surgical (`references/implementation.md`) and re-review it, diff included: every changed line traces to the failing case, and fixes create bugs too.

**Ask the user** for the rest: product choices, several valid fixes, shared code or contracts, risky changes, pre-existing bugs.

### Phase 7 — Run everything

New and changed specs first, then the wider relevant suites, then typecheck, lint and format on changed test files, and the build if it's quick. Fix and re-run until clean or until a failure needs the user. Long suites run in the background while you write the record.

### Phase 8 — Record and report

- Work doc: "Unit test pass" section (`references/report-template.md`), "Resume here" with the next step, docs index entry. Update test documentation where the repo keeps it.
- Report to the user with the same template. Questions are numbered from Q1 with options **A / B / C**, recommended first and marked **(Recommended)** with a reason.
- Next step: `/deep-ui-test` if the change touches UI (list the UI-visible cases you found so it starts from them), else `/deep-review`.

## Reading the user's answers

The user answers as a numbered list (`1. …`), where `N.` answers QN of the latest message that asked questions. Accept a letter, a letter with a tweak, "ok"/"recommended", or free text. A missing number leaves that question open. Echo a compact mapping (`Q1 → A: <short>`) before acting, ask instead of guessing when an answer doesn't fit, and record every answer in the work doc's Decisions under the question's short title.
