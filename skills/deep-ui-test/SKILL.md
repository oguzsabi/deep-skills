---
name: deep-ui-test
description: Deep real-browser testing of what was built in the UI, in any repo with a web UI. Turns every requirement (ticket, plan, decisions) into a scenario matrix, maps the screens the diff touches plus neighbouring screens that could regress, runs every scenario in a real browser across states, roles, modes, viewports and locales, creates whatever data a scenario needs (real data through the UI or API, seeded fixtures, or realistic mocked responses) instead of skipping it, watches console and network, fixes straightforward bugs and re-verifies them, asks about the rest, audits and extends the e2e tests, and records the matrix in the work doc so a new session can resume. Use whenever the user invokes /deep-ui-test, or asks to "test it in the browser", "click through everything", "make sure the UI works", "test against the requirements", "QA this", or finishes UI work and wants proof it works before review.
argument-hint: "[optional: screens/flows to target, environment, or work doc]"
---

# Deep UI Test

Prove that what was built works in the real app, for every requirement, in every state and context a user can reach, and that nothing next to it broke. When this skill reports a requirement as verified, someone saw it work in a browser, with evidence; when something couldn't be verified, the report says so and why.

Read `references/workflow.md` first: where this skill sits in the flow, who owns which tests, the work doc, resuming, and subagents.

## Ground rules

1. **Repo instructions win.** Read `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md`, the docs index and any app overview first. Their rules (required guards, modes, test conventions, doc locations) are both test criteria and conventions.
2. **Requirements are the spec.** Every R# gets scenarios. "The screen renders" verifies nothing; "the user can do what R3 says, and sees what R3 says" does.
3. **Never limited by data.** Missing data is a setup task, not a reason to skip: create it, seed it, or shape a realistic response (`references/test-data.md`). "Not verified" is only for what truly can't be reproduced here (a real phone, a third-party system, a payment), and it names exactly what's needed.
4. **Realistic only.** Created or mocked data must be something the backend can actually produce: check DTOs, types and backend code. A bug found with impossible data is a false bug. Every row records how its data was obtained; rows verified with mocked responses say which part stayed unverified.
5. **Safe environments.** Never test against production. In shared environments, mark the data you create, clean it up, and don't take outward-facing actions (emails, invites to real people, external publishing, payments) without asking. Don't trigger native `alert`/`confirm` dialogs: they freeze browser automation.
6. **Evidence for every verdict.** A screenshot, GIF, console or network record backs each pass and each fail. Reading the code is not verification.
7. **Report reality.** Never mark a row passed that wasn't run. Never weaken an e2e assertion to get green.
8. **The browser stays in the main thread** (workflow.md §5).
9. **Keep the work doc current.** Write the matrix before executing it and update it as rows finish, so a new session continues from the first open row.

## Workflow

### Phase 0 — Resume check

Find the work doc. If it has a scenario matrix with open rows, continue from the first one (workflow.md §4). Rows whose code changed since they passed are marked stale and re-run.

### Phase 1 — Requirements

- Collect the R# list from the plan, ticket, decisions and work doc; reuse the existing numbering. Fetch the ticket if a ref is in the branch name or commits.
- Add the implicit requirements: existing behaviour stays, every mode and role the screen runs in, mobile, every locale, permissions, analytics events.
- Pull in the UI-visible cases `/deep-test` recorded under "For deep-ui-test", and the plan's edge cases.

### Phase 2 — Map the UI surface

From the diff: the routes, screens, components, dialogs and states it touches. For every shared component, style, util or service it changed, find every other screen that uses it (code graph, LSP, else grep): these are the **regression neighbours**. List the modes (roles, public/shared/export, feature flags), viewports and locales each screen runs in. Check the docs for bugs fixed earlier in this area; they're cheap regressions to re-check.

### Phase 3 — Build the scenario matrix

For each R# and each surface, walk `references/ui-scenarios.md`. Each row:

| ID | R# | Scenario | Context (role / mode / viewport / locale) | Data (method) | Steps | Expected | Status | Evidence |

Prioritise: **P1** requirement flows and the bug-prone areas (state across navigation, timing, permissions and modes); **P2** edge cases; **P3** polish. Statuses: open / pass / pass (mocked data) / fail / blocked / not verified.

**Independent pass** for non-trivial work: at the start of Phase 1, launch one background agent with the requirements' location, the diff scope and ui-scenarios.md only (not your matrix), asking for scenarios with expected results, written to a scratch file. Merge its rows into the matrix; drop duplicates and implausible ones (with the reason). Skip for small changes and say so.

Write the matrix to the work doc before running anything.

### Phase 4 — Environment

Set up the app, backend, accounts and browser with `references/browser-setup.md`. Confirm which environment you're on before creating any data.

### Phase 5 — Data

For each row, get its data via the ladder in `references/test-data.md`, preferring the most realistic method that works. Log every entity you create (id, environment) in the work doc for cleanup.

### Phase 6 — Execute

For each row, by priority:

- Run the steps; compare what you see with the expected result.
- Check the console for errors and warnings, and the network for failed, unexpected, duplicate or mode-forbidden requests.
- Capture evidence (screenshot; GIF for multi-step flows).
- Set the status. Update the work doc after each R# or every ~5 rows.

Explore around each scenario as a real user would: double click, go back, refresh, resize, switch filters fast, open in a new tab. Anything new you find becomes a new row.

### Phase 7 — Bugs

- Reproduce twice and reduce to minimal steps. Find the root cause in the code (file:line).
- **Fix now** when all of these hold: one clearly correct fix, small, inside the change's scope, doesn't change a decided product behaviour, public contract or shared code outside the change. Then re-run the row, every row sharing that code, and the affected neighbours. Add a regression test: a unit test (per `/deep-test` practices) when the cause is logic, an e2e test when it's integration. Save before/after screenshots to the evidence folder.
- **Ask the user** for the rest, with the evidence and minimal steps.

### Phase 8 — Regression sweep

Walk the main flows of every regression neighbour and every mode the touched screens run in. Quick checks only: does it still load, show the right data, and do its main action without console errors.

### Phase 9 — Lock it into e2e

- Audit the e2e specs the implementation added or changed with `references/test-audit.md`: keep / update / remove / merge.
- Add e2e specs for every fixed bug the e2e setup can reproduce, for P1 flows without coverage, and for mocked-data scenarios (the `page.route` mock becomes a deterministic test). Follow the repo's e2e conventions and update its e2e coverage docs.
- Spec writing can go to an agent that owns the e2e files while you continue in the browser (workflow.md §5). Review its specs before they count. Run the e2e suite (in the background if long) and report the real result.

### Phase 10 — Clean up

Delete the data you created (or list it, if the user wants to keep it), remove any in-browser mocks, and reset viewport, locale and flags.

### Phase 11 — Record and report

- Work doc: "UI test pass" section with the final matrix (`references/report-template.md`), evidence folder index, "Resume here", docs index entry. If the repo keeps an app overview or screen docs and you fixed something visible, update them as the repo requires.
- Report to the user with the same template. Questions are numbered from Q1 with options **A / B / C**, recommended first and marked **(Recommended)** with a reason.
- Next step: offer `/deep-ux` on the same screens while the app is up; then `/deep-review`.

## Reading the user's answers

The user answers as a numbered list (`1. …`), where `N.` answers QN of the latest message that asked questions. Accept a letter, a letter with a tweak, "ok"/"recommended", or free text. A missing number leaves that question open. Echo a compact mapping (`Q1 → A: <short>`) before acting, ask instead of guessing when an answer doesn't fit, and record every answer in the work doc's Decisions under the question's short title.
