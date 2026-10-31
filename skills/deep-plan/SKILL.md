---
name: deep-plan
description: Thorough plan-first workflow for any code change (feature, bug fix, refactor, migration, UI change) in any repo. Reads all the given material, investigates the current code, designs the minimum-impact change, sweeps edge cases, plans meaningful unit/e2e tests, asks the user every open question with recommended options, and does NOT implement anything until the user explicitly says go. Use whenever the user invokes /deep-plan, asks for a "full plan", "detailed plan", "plan before implementing", "understand everything first", "don't implement yet", "ask me questions before you start", or pastes a ticket/spec and wants a plan with edge cases and tests. Do not use when the user wants a quick fix done immediately.
argument-hint: "[ticket ref, spec, link, or task description]"
---

# Deep Plan

A plan-first workflow: understand the requirement and the code completely, design the smallest correct change, surface every uncertainty as a question with a recommended answer, and only implement after the user explicitly says go. Then implement with meaningful tests, run them until they genuinely pass, and document them.

The point of all this is to avoid the two expensive failure modes of coding agents: building the wrong thing (because a requirement was misread or an assumption went unspoken) and breaking unrelated things (because the blast radius of a change was never mapped). Time spent here is cheap compared to a rewrite or a regression.

This is the first step of the deep-* flow. `references/workflow.md` describes the flow, who owns which tests, and the work doc every step reads and writes.

## Ground rules

1. **Hard gate: no implementation before an explicit go.** During planning, do not edit source, test, config or migration files, do not commit, do not install packages, and do not run anything that changes state (DB migrations, deploys, writes to external services). Reading code, running read-only commands, running existing tests to get a baseline, and reading tickets are all fine. Writing the plan itself to a scratch/plan file is fine. The reason: the user wants to review the whole picture before any code exists, and half-applied changes muddy that review.
2. **Repo instructions win.** Read the repo's `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` / docs index first and follow them. Where they conflict with this skill (output style, tooling, test commands, doc locations, commit rules), the repo wins. This skill supplies the process; the repo supplies the conventions.
3. **Context before questions.** Never ask the user something the code, git history, ticket, or docs can answer. Every question you ask should be a genuine product decision, a genuine ambiguity, or something only the user knows (a backend variant, a deadline, a stakeholder preference). State what you already found so the user doesn't repeat it.
4. **Evidence, not vibes.** Every claim about current behavior in the plan should point at a file and line (or a ticket, doc, or command output). If you could not verify something, label it as an assumption.
5. **Minimum impact.** Prefer the smallest diff that fully solves the requirement, reusing existing patterns, components and utilities. No speculative abstractions, configurability or "while we're here" refactors. If you notice unrelated problems, list them separately as out-of-scope observations rather than folding them into the plan.

## Workflow

Work through the phases in order. For a small task some phases collapse to a sentence, but don't skip them silently: say "N/A because ..." so the user can see you considered it.

### Phase 1 — Collect and read all material

Gather everything the task touches and read it fully, not just skim it:

- The user's message and anything pasted or attached (specs, screenshots, logs, CSVs).
- Referenced tickets/issues (Taiga, Jira, Linear, GitHub/GitLab issues, etc.) via whatever tool is available, including comments, attachments, linked/sub-tickets and acceptance criteria. If the branch name or recent commits contain a ticket number, fetch it.
- Designs (Figma, Pencil, image mocks): extract the exact states, copy, spacing and behaviors shown, and note which states are *not* shown (empty, error, loading, long text, mobile).
- Repo knowledge: `CLAUDE.md`/`AGENTS.md`, `README`, docs index, ADRs, prior investigation notes, and any project memory. Look for earlier write-ups of this same area; reuse their conclusions instead of re-deriving them.
- Linked material inside material (a ticket linking a doc linking a design): follow the chain until it stops adding information.

If a tool needed to read something is unavailable or unauthenticated, say so and ask the user to paste the content rather than guessing at it.

### Phase 2 — Extract requirements

Write down, in your own words:

- **Goal**: the user-visible or system-visible outcome, in one or two sentences.
- **Explicit requirements**: each one numbered (R1, R2, ...) so tests and questions can refer back to them.
- **Implicit requirements**: things the material assumes without saying (keeps existing behavior X, works for role Y, works on mobile, translated, tracked in analytics).
- **Acceptance criteria**: how anyone would verify each requirement is done.
- **Non-goals**: what is explicitly out of scope, and what you are deliberately leaving alone.
- **Contradictions and gaps**: places where sources disagree (ticket vs design vs current behavior) or are silent. These become questions.
- **Interpretations**: when a requirement reads more than one way, write down each reading and ask which is meant; never pick one silently.

### Phase 3 — Investigate the current state

Map the affected code before designing anything. Use the best tools the environment offers: a code-graph/semantic index (e.g. tokensave) or LSP if present, otherwise grep/glob and reading files. Cover:

- **Entry points and flow**: where the behavior starts (route, handler, component, job, CLI), and the full data path through services, state, API calls and persistence.
- **Blast radius**: callers of every symbol you expect to change, shared components/utilities used elsewhere, and other screens or services that depend on the same data or contract. A change to a shared thing is a change to every caller.
- **Contracts**: API request/response shapes, DTOs, DB schema, events, feature flags, permissions/roles, i18n keys, analytics events, environment config. Note which live in other repos.
- **Modes and contexts**: every context the code runs in (authenticated vs public/shared/export, roles, tenants, feature-flag states, SSR vs client, mobile vs desktop, locales). Bugs hide in the modes nobody tested.
- **History**: `git log` on the affected files and the current branch, recent related branches/PRs, and blame on surprising lines. A weird line often exists for a reason recorded in a commit message.
- **Existing tests**: which unit/integration/e2e tests already cover this area, what they assert, and how they're run. Optionally run them now to record a baseline, so that later failures aren't misattributed to your change.
- **Conventions**: how similar features were built in this repo (file layout, naming, state management, error handling, test style). The plan should look like the code around it.

Record findings with file:line references. When something is surprising or contradicts the requirement, note it; it is probably a question.

### Phase 4 — Design the change

- If there are meaningfully different approaches, list them briefly (2-3 max) with tradeoffs, and recommend one. Prefer the option with the smallest blast radius that still fully meets the requirements and reads naturally in this codebase.
- If a simpler approach than the one asked for would reach the same goal, say so and recommend it, even when that means pushing back on the request or the ticket. The user decides; you don't silently build the bigger version or the smaller one.
- List **every file** to create/modify/delete, and for each: what changes and why, traced back to a requirement (R#). If a change doesn't trace to a requirement, it probably shouldn't be in the plan.
- List what will deliberately **not** change, especially shared code that a less careful plan would have touched.
- Note cross-repo or cross-service dependencies and the **ship order** (e.g. backend contract first, then frontend), plus backward compatibility during the window where only one side is deployed.
- Order the implementation steps so each step leaves the code in a consistent, buildable state with a verification check (build, typecheck, focused test).

### Phase 5 — Sweep edge cases

Read `references/edge-cases.md` and walk every category against this change. For each category, either describe how the plan handles it, or mark it N/A with a one-line reason. Anything you can't resolve from the code becomes a question in Phase 7.

The sweep has two sides: edge cases *of the new behavior*, and *regressions of existing behavior* in every caller and mode found in Phase 3. The second side is where "without breaking anything unrelated" is actually won.

If the task is a bug fix, refactor, migration, UI change, or performance change, also read the matching section of `references/task-types.md`; each type has its own extra checks.

### Phase 6 — Plan the tests

Read `references/testing.md`, then specify:

- **New unit tests**: file, test name, and the requirement or edge case each one proves.
- **Updated existing tests**: which tests will break or become wrong because of the intended change, and how they'll be updated. Distinguish "update because behavior intentionally changed" from "this would be a regression".
- **E2E tests**: whether they're warranted (criteria in `references/testing.md`), and if so the exact user flow, data setup and assertions. If not warranted, say why.
- **How to run them**: the exact commands, from the repo's scripts.
- **Where tests get documented**: follow the repo's convention (test docs, docs folder, feature write-up, PR description). If there is none, propose one in the questions.

Meaningful means each test would fail if the requirement it covers were broken. Don't plan tests that only assert implementation details or restate the code.

The implementation writes these tests. Afterwards `/deep-test` audits and extends the unit tests and `/deep-ui-test` the e2e tests, so mark which planned edge cases are UI-visible.

### Phase 7 — Present the plan and the questions

Produce the plan using `references/plan-template.md`. Then the questions:

- Number them Q1, Q2, ... in one sequence across both groups below, so the user can answer with a plain numbered list (see "Reading the user's answers").
- Group them as **Blocking** (the plan can't be finalized without an answer) and **Defaults I'll assume unless you object** (low-risk choices where you state the default you'll use).
- For each question: one or two sentences of context (what you found, with file refs), then options as **A / B / C**, with your recommended option first and marked **(Recommended)** with a short reason. Include the consequence of each option when it isn't obvious.
- Ask about tests too when unsure: e2e or not, which fixtures, which environment.

If there are many questions, lead with the ones whose answers would change the design the most.

Save the plan to the work doc (`references/workflow.md` §3) so it survives context compaction and new sessions, and every later deep-* skill starts from it. Say where it is. Keep its "Resume here" current from now on.

### Phase 8 — Iterate until nothing is open

When the user answers:

- Update the plan in place (and the plan file if there is one). Briefly show what changed rather than reprinting everything.
- Re-run the edge-case sweep for any part of the design an answer changed; new answers often create new edge cases.
- Ask follow-up questions if answers opened new ambiguity. Number them from Q1 again in the new message; refer to earlier questions by their short title, not their old number.
- If an answer conflicts with something in the code or another answer, point it out instead of quietly picking one.

Repeat until there are no blocking questions and the user has seen the defaults.

### Phase 9 — Readiness gate

When everything is answered, post a short final summary: the chosen approach, the files that will change, the test plan, the ship order if any, and remaining assumptions. Then ask plainly whether to start implementation.

Only begin on an explicit go ("go", "start", "implement it", "yes, start"). Approval of the plan ("looks good", "makes sense") is not the same as a go; if in doubt, ask once more. The user may want to review the plan with someone else, switch branches, or start in a fresh session first.

## Reading the user's answers

The user usually answers as a plain numbered list, one line per question:

```
1. answer
2. another answer
```

- `N.` answers QN of the most recent message that asked questions. That's why every message that asks questions numbers them from Q1, in one sequence across blocking questions and defaults.
- Accept any answer form: a letter ("B"), a letter with a tweak ("A, but keep the old label"), "ok" / "yes" / "recommended" (the recommended option, or the stated default), or free text. Free text that matches no option is the answer; don't force it into one.
- A missing number leaves that question open, except a default, where silence means the default stands. Ask again only about the unanswered blocking ones.
- Before acting, echo a compact mapping (`Q1 → A: <short>`, `Q3 → <free text, short>`) so a misread is caught at once. If an answer doesn't fit its question (the list looks shifted, or it answers a different question), ask instead of guessing.
- Record every answer in the plan's Decisions section (and the plan file, if there is one) under the question's short title, so answers survive context compaction and later rounds can refer to them.

## Implementation (only after the go)

Follow `references/implementation.md`: branch check, the plan's order with a check after each step, surgical edits, deviations, tests run until they genuinely pass, docs, the diff check and the final report.
