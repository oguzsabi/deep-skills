---
name: deep-feature
description: Conductor for the whole deep-* flow of a feature, bug fix or change, in any repo. Starts from a ticket or spec (or joins mid-flow from an existing work doc), decides which step runs next (/deep-plan, implementation, /deep-test, /deep-ui-test, /deep-ux, /deep-review, /deep-ship, /deep-pr-comments), skips steps that don't apply, repeats steps when fixes call for it (with a loop guard), runs every heavy step in its own fresh agent or, inside Herdr, in its own named tab and pane so the conductor's context stays small, relays each step's questions to the user and the answers back, stops for the user's explicit go before implementing and before shipping, and keeps a Flow table in the work doc so it can resume in any session. Use whenever the user invokes /deep-feature, or asks to "run the whole flow", "take this ticket all the way", "drive this feature end to end", "continue the flow", or "orchestrate the deep skills".
argument-hint: "[ticket ref, spec or task — or nothing to resume from the work doc]"
---

# Deep Feature

Drive a piece of work from ticket to merged-ready PR through the deep-* skills, deciding at each point what's needed next. The conductor routes, relays and records; the steps do the work, each in its own context.

Read `references/workflow.md` first (the flow, test ownership, the work doc, resuming, subagents), then `references/routing.md` (what runs next) and `references/dispatch.md` (how a step is started, in subagent or Herdr mode).

## Ground rules

1. **The conductor doesn't do the heavy work.** It never plans, implements, tests or reviews by itself. It reads the work doc, `git status` and changed file names to route; everything else goes to a step. That keeps its context small enough to carry a whole feature.
2. **Two hard gates.** It stops for the user's explicit go before implementation starts, and before `/deep-ship` commits, pushes or opens a PR. Approval of a plan ("looks good") is not a go; ask once more if unsure. Everything between the gates runs without asking, except the questions the steps themselves raise.
3. **Questions are relayed, never answered.** A step's questions reach the user verbatim (numbered from Q1, options with the recommended one first). The conductor doesn't pick answers for the user, and doesn't add its own opinion unless it's labelled as such.
4. **The work doc is the truth.** The Flow table, the steps' sections and "Resume here" hold all state. Update the Flow table whenever a step starts, asks, finishes or is skipped.
5. **Loop guard.** A step runs at most 2 rounds (first run plus one re-run, scoped re-runs included). A third round needs the user's decision.
6. **Usage limits.** On a usage wrap-up or stop warning, start no new step; tell the running step to write its state to the work doc and stop; record the Flow table; tell the user where it stopped and how to resume (`/deep-feature`). On a context checkpoint, update the Flow table first.
7. **Report reality.** Status lines repeat what the step reported, not what it was supposed to do. A step that failed or was cut off is reported as such.

## Workflow

### Phase 0 — Start or resume

- Read the repo rules (`CLAUDE.md` / `AGENTS.md`, docs index) and project memory, only as far as needed to find the work doc and the conventions.
- **Find the work doc** (workflow.md §3). With a ticket or spec and no work doc, the first step is `/deep-plan`, which creates it. With a work doc, read its Flow table and "Resume here"; without a Flow table (work started without the conductor), build one from the sections that exist (a "Unit test pass" means `/deep-test` ran, and so on) and the git state.
- **Pick the mode** (dispatch.md §1): Herdr mode if `HERDR_ENV=1`, otherwise subagent mode. In Herdr mode, set up the lead tab (dispatch.md §3).
- Post the Flow table as the opening status: steps done, skipped and next.

### Phase 1 — The loop

Repeat until the flow is done, waiting on the user, or stopped:

1. **Route**: pick the next step with `references/routing.md`. If it's a skip, record the reason in the Flow table and route again.
2. **Gate**: if the next step is implementation or `/deep-ship`, stop and ask for the go (ground rule 2). Show a 3-5 line summary of what's ready.
3. **Dispatch**: start the step with the brief from dispatch.md §2, in the current mode. Mark it running in the Flow table.
4. **Wait** for the step to finish or ask. Don't poll in a tight loop; you're notified when a subagent stops, and in Herdr mode you wait in the background (dispatch.md §3).
5. **Questions**: if the step returned questions, post them to the user verbatim with one line of context ("deep-test asks:"). When the user answers, echo the mapping (`Q1 → A: <short>`), send the answers to the same step (dispatch.md), and go back to 4. In Herdr mode the user may answer in the step's pane directly; check the pane before relaying so nothing is answered twice.
6. **Result**: read the step's summary and its work doc section. Record the outcome, round and flags (`logic_changed`, `ui_changed`, open questions) in the Flow table.
7. **Status line** to the user: `<step> done — <one-line outcome> → next: <step> (<reason>)`.

### Phase 2 — Waiting on the PR

After `/deep-ship` opens or updates the PR, set "Resume here" to "waiting for PR review" and stop. When the user comes back with `/deep-feature` and there are review comments, routing continues with `/deep-pr-comments`.

### Phase 3 — Done

The flow is done when the PR is open, every step is done or skipped with a reason, no question is open, and the latest review round passed. Post the final Flow table, the PR link, anything not verified, and follow-ups. In Herdr mode, ask whether to close the step tabs the conductor created.

## Reading the user's answers

The user answers as a numbered list (`1. …`), where `N.` answers QN of the latest message that asked questions. Accept a letter, a letter with a tweak, "ok"/"recommended", or free text. A missing number leaves that question open. Echo a compact mapping (`Q1 → A: <short>`) before relaying, and ask instead of guessing when an answer doesn't fit. The step records the answers in the work doc's Decisions.
