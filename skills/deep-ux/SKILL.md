---
name: deep-ux
description: Deep UX and UI design review in a real browser, in any repo with a web UI, of the screens the current changes touch or any screen the user names. Walks realistic tasks as a first-time user would, judges clarity, ease of use, information hierarchy, feedback, consistency with the rest of the app, accessibility, responsiveness and modern design practice, uses the repo's app and design docs (app overview, design system) as context while still suggesting improvements that contradict them, prototypes suggestions live in the browser, and returns ranked, evidence-backed suggestions with recommended options. Changes no code until the user picks; picked small items get implemented, bigger ones go to /deep-plan. Records everything in the work doc. Use whenever the user invokes /deep-ux, or asks "how's the UX", "is this easy to understand", "review the design", "does this look modern / consistent", "UX audit of <screen>", or wants design feedback on built UI.
argument-hint: "[optional: screens/flows to audit, persona, or work doc]"
---

# Deep UX

Look at the built UI the way its users will: can they tell what the screen is for, do what they came to do without help, trust what they see, and does it feel like one coherent, modern app? The output is a ranked list of concrete, evidence-backed suggestions the user decides on, not a bug report (that's `/deep-ui-test`).

Read `../deep-plan/references/workflow.md` first: where this skill sits in the flow, the work doc, resuming, and subagents.

## Ground rules

1. **Repo rules win on conventions.** Read `CLAUDE.md` / `AGENTS.md`, the docs index, the app overview and the design-system docs first, plus project memory about design (e.g. which source is authoritative: code, Figma, a design file).
2. **The user's eyes, not the code.** Judge what a user sees and does. Use the personas and vocabulary from the app docs.
3. **Every suggestion has evidence and a reason.** A screenshot, what the user was trying to do, what got in the way, which principle it breaks, and the impact.
4. **Consistency before novelty.** Prefer the app's existing components, patterns, tokens and font. Suggest a new pattern only when the existing ones fail the user, and say so.
5. **Free to disagree with the docs.** When a suggestion contradicts the app overview, design system or an earlier decision, flag it ("contradicts <doc>: <what>") and argue why it's worth revisiting. Don't drop it silently, and don't present it as if no decision existed.
6. **Not a bug hunt.** Functional bugs you notice are listed and routed to `/deep-ui-test` (or fixed there), not mixed into the UX ranking.
7. **No code changes before the user picks.** Prototyping in the browser (injected CSS or DOM edits, never saved) is fine and encouraged.
8. **Keep the work doc current** (workflow.md §3).

## Workflow

### Phase 0 — Resume check

Find the work doc. If it has an unfinished "UX review", continue from its recorded step. Suggestions already accepted or rejected there are not raised again unless something changed.

### Phase 1 — Scope

The screens the diff touches, or the ones the user named; the flows they belong to; and 2-3 neighbouring screens to compare against for consistency.

### Phase 2 — Context

Read the app overview (screens, glossary, flows, personas), the design-system docs and tokens, and earlier UX decisions in the work doc and feature docs. Note which decisions exist, so a suggestion that revisits one is flagged (ground rule 5).

### Phase 3 — Walk it as a user

Set up the app with `../deep-ui-test/references/browser-setup.md`. Use realistic data; for empty, error, long-text or many-item states, get data with `../deep-ui-test/references/test-data.md`.

- **First impression**: on first sight of each screen, what is it for and what is the main action? Write the answer before exploring.
- **Tasks**: 3-6 realistic tasks per screen, phrased as the persona's goal ("find which creators missed their deadline this week"). Do them without reading the code. Note every hesitation, extra click, ambiguous label, hidden action, and moment where the screen's answer had to be inferred.
- **Contexts**: desktop and phone width, each locale with long copy, each role and mode that sees the screen, and the empty, loading and error states.
- Screenshot each finding into the scratchpad as you go.

### Phase 4 — Evaluate

Walk `references/ux-heuristics.md` against each screen. Put each screen next to its neighbours and compare spacing, typography, buttons, icons, colours, terminology and interaction patterns.

### Phase 5 — Independent second opinion

For a multi-screen or substantial audit, launch one background agent with the saved screenshots, the app docs and the heuristics, but none of your findings, asking for ranked suggestions with reasons. Merge, deduplicate, and drop what doesn't hold up when you look again in the browser. Skip it for a single small component and say so.

### Phase 6 — Rank and prototype

- **Severity**: **blocks** (the user can't finish the task or misreads the data), **friction** (slower, uncertain, error-prone), **polish** (inconsistency, dated look, visual noise).
- **Effort**: S (styles, copy, an existing component swapped in), M (a component or layout change on one screen), L (a new pattern, several screens, or backend data).
- For layout, styling and copy suggestions, prototype in the browser by injecting CSS or text with the JavaScript tool, and take a before/after screenshot. Seeing it settles most debates faster than describing it.
- Save the evidence worth keeping to the evidence folder (workflow.md §3).

### Phase 7 — Report and ask

Use `references/report-template.md`. Group by screen, blocks first. Each suggestion is a question: numbered from Q1, options **A / B / C** with the recommended one first and marked **(Recommended)** with a reason, and "keep as is" always one of the options.

### Phase 8 — Act on the answers

- **Picked and small (S, existing components, inside the work's scope)**: implement it, check it in the browser, run the affected tests and lint, and update the app overview and screen docs if the repo keeps them and the change is visible.
- **Picked and bigger (M/L, or outside scope)**: record it as input for `/deep-plan`, with the evidence.
- **Rejected**: record it with the reason, so it isn't suggested again.

Write the "UX review" section and "Resume here" in the work doc. Next step: `/deep-review`; after code changes from picked suggestions, a scoped `/deep-ui-test` on the touched rows first.

## Reading the user's answers

The user answers as a numbered list (`1. …`), where `N.` answers QN of the latest message that asked questions. Accept a letter, a letter with a tweak, "ok"/"recommended", or free text. A missing number leaves that question open. Echo a compact mapping (`Q1 → A: <short>`) before acting, ask instead of guessing when an answer doesn't fit, and record every answer in the work doc's Decisions under the question's short title.
