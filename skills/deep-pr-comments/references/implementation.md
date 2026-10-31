<!-- Copied from skills/deep-plan/references/implementation.md by scripts/sync-shared.mjs. Edit the source, not this copy. -->

# Implementation (only after the go)

How the deep-* flow implements a plan once the user has said go, and how any later step keeps a fix surgical. Read by deep-plan, deep-feature, deep-test and deep-pr-comments.

- **Branch check**: confirm you're on the right branch; if you're on a default/main branch, create one following the repo's naming convention before editing.
- **Follow the plan's order.** After each step, run its verification check (build/typecheck/focused test). Keep each step small enough that stopping after it leaves the tree consistent.
- **Surgical edits.** Touch only the lines the plan needs. Don't reformat, re-comment, rename or refactor neighbouring code, and match the style around you even where you'd write it differently. Remove the imports, variables and helpers your own change made unused; leave pre-existing dead code alone and list it as an out-of-scope observation.
- **Deviations**: if the code turns out different from what the plan assumed, stop and explain before diverging in any way that affects scope, behavior, public contracts, or the file list. Small mechanical adjustments are fine; mention them in the final report.
- **Tests**: write the planned tests alongside the code (for bug fixes, write the failing reproduction test first). Update the existing tests the plan's test section names (deep-plan Phase 6).
- **Run tests until they genuinely pass.** Run the new and updated tests, then the wider relevant suite, then e2e if planned. Report real output. Never weaken an assertion, skip a test, or loosen a type just to get green; if a test fails for a reason you didn't expect, that's information, so investigate it. If something can't be run locally (missing env, backend not deployed), say so explicitly rather than claiming it passed.
- **Document**: document the tests where the plan's test section decided, and update any repo docs the change makes stale (follow the repo's docs conventions). Record progress in the work doc's "Implementation notes" and "Resume here" after each step. Don't commit unless the repo's working agreement or the user says so.
- **Diff check**: before the final report, read the whole diff, untracked files included, and confirm every changed line traces to a requirement (R#), a planned test or a doc update. Revert anything that doesn't, or report it as a deviation.
- **Final report**: what was done vs the plan, deviations and why, test results with the commands used, anything not verified, follow-ups and out-of-scope observations. Next step: `/deep-test` (workflow.md §1).
