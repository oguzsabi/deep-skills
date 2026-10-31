# Dispatch: running a step

## Contents

1. Choosing the mode
2. The step brief
3. Herdr mode
4. Subagent mode
5. Steps that stay in the conductor

## 1. Choosing the mode

```bash
test "${HERDR_ENV:-}" = 1 && echo herdr || echo subagents
```

- **Herdr mode** (`HERDR_ENV=1`): every heavy step is a real Claude session in its own named tab and pane. The user can watch it and type into it.
- **Subagent mode** (anything else): every heavy step is a fresh background subagent (general-purpose type, same model as the conductor). Questions and answers go through the conductor.

Record the mode in the Flow table. If Herdr commands fail, say so and fall back to subagent mode for the rest of the flow.

## 2. The step brief

The same brief in both modes. The work doc is the step's whole context; never paste conversation history into the brief.

```
You are running the <step> step of the deep-* flow for <feature title> (<ticket>), started by the /deep-feature conductor.

Repo: <absolute path>, branch <branch>, base <base>.
Work doc: <absolute path>. Read "Resume here", the Flow table, Decisions and the earlier steps' sections first;
they are your full context. Reuse what they record; don't re-ask answered questions.

Run /<skill> <args>.                        ← or, for implement: follow "Implementation (only after the go)"
                                               in ../deep-plan/SKILL.md, the go is given.
<Scope, for re-runs: "Scoped re-run: only <units / scenario rows> touching <files>, changed by <step>.">

Questions: when the skill needs the user's decision, write the questions to the work doc, then end your turn with
only the questions (numbered from Q1, options A/B/C, recommended first and marked (Recommended) with a reason).
The answers will arrive as your next message. Never guess an answer.

Limits: no commits, pushes, PRs or PR replies. Keep the work doc's "Resume here" and your section current after
every phase. If told to stop for usage limits, write your state to the work doc and stop.

When done, end with this summary (at most 15 lines):
- outcome: <one line>
- fixed: <count, short list>
- changed files: <list>
- logic_changed: <yes/no> · ui_changed: <yes/no>
- open questions: <none, or their short titles>
- not verified: <list or none>
- recommended next step: <step and why>
```

## 3. Herdr mode

The user asked for this mode and this layout, so invoking `/deep-feature` inside Herdr counts as the explicit request the `herdr` skill requires for using Herdr and for creating tabs. Check the `herdr` skill, if installed, for command details; the installed `herdr` binary is the authority for syntax. Read ids from the JSON responses, never guess them.

### Layout

- **The conductor lives alone in a tab labelled `lead`**, in a pane labelled `conductor`. Nothing else ever goes in that tab.
- **Each step gets its own tab, labelled with the step**: `plan`, `implement`, `test`, `ui-test`, `ux`, `review`, `pr-comments`. A further round gets a suffix: `review-2`, `test-2`.
- **Each pane in a step tab is labelled with its role**, and the agent in it is named the same: the step's session takes the tab's name (`ui-test`, `review-2`). Helper panes the step needs get role names: `app-server` for the dev server, `e2e-run` for a long e2e run, `unit-run` for a long test run.
- **A long-lived dev server gets its own tab `app`** (pane `app-server`), shared by `ui-test` and `ux`, so it survives step tabs being closed.
- Agent names must match `[a-z][a-z0-9_-]{0,31}` and be unique among live agents; that's why labels are lowercase with hyphens.

### Setting up the lead tab (once, at Phase 0)

```bash
herdr tab rename "$HERDR_TAB_ID" lead
herdr pane rename "$HERDR_PANE_ID" conductor
```

### Starting a step

```bash
tab=$(herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "<repo path>" --label <step-label> --no-focus)
pane=<.result.root_pane.pane_id from $tab>
herdr pane rename "$pane" <step-label>
herdr agent start <step-label> --kind claude --pane "$pane"
```

Write the brief to a file in the session scratchpad (`<step-label>-brief.md`) rather than passing it inline, then prompt the session as a **background** Bash command, so the conductor is notified when the step settles:

```bash
herdr agent prompt <step-label> "Read <absolute brief path> and follow it exactly." --wait
```

`--wait` first confirms the session started working, then waits with no timeout until it settles (`idle`, `done` or `blocked`). A timeout or stalled result doesn't prove the prompt wasn't delivered: check `herdr agent get` and `agent read` before sending anything again.

- `done` / `idle`: read the end of the session with `herdr agent read <step-label> --source recent-unwrapped --lines 150` and the work doc. Questions → relay (SKILL.md Phase 1 step 5); summary → record the result.
- `blocked`: the session shows a permission or approval prompt. Tell the user which tab is waiting and what it asks (`agent read`). Don't approve it yourself.
- Relaying answers: in the background again, `herdr agent prompt <step-label> "<the user's answers, as given>" --wait`. If the user already answered in the pane (the session is working again, or `agent read` shows the answers), don't send them again; just wait with `herdr agent wait <step-label>`.

Helper panes: the step session creates its own helper panes (`pane split --current --no-focus`, then `pane rename` with the role). Tell it so in the brief when the step is `ui-test`, `ux` or a long test run.

### Finishing a step

Leave the finished tab open so the user can look back; its agent stays idle. Close step tabs the conductor created only at the end of the flow, after asking. Never close tabs or panes the conductor didn't create.

## 4. Subagent mode

- Start the step with the Agent tool: general-purpose type, background, the brief as the prompt, description `<step> step`.
- You're notified when it stops. Its final message is either the questions or the summary.
- Relaying answers: SendMessage to that agent with the user's answers as given; its context is intact. (Load SendMessage with ToolSearch if it's deferred.)
- If the agent is gone (session restarted, crashed, or it can't be reached), start a new one with the same brief; it resumes from the work doc.
- The step's own second-opinion agents: the step agent tries to start them itself. If it reports it couldn't, start them from the conductor in parallel with the same brief the skill describes, and send their findings to the step agent.
- Only one step that uses the browser runs at a time.

## 5. Steps that stay in the conductor

- `/deep-ship`: light and outward-facing; run it in the conductor after the go.
- Routing, gates and the Flow table.

Everything else (`/deep-plan`, implement, `/deep-test`, `/deep-ui-test`, `/deep-ux`, `/deep-review`, `/deep-pr-comments`) is dispatched.
