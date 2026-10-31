# Extra checks per task type

Read the section that matches the task. Tasks often combine types (a bug fix with a UI change), so read every section that applies.

## Bug fix

- **Reproduce first.** Find the exact steps, data and context that trigger it. If you can't reproduce it, say so and list what you'd need.
- **Root cause, not symptom.** Trace why the wrong value or behavior happens, and point at the line. A fix that silences the symptom (a null check, a try/catch, a default) without explaining the cause is a question to raise, not a plan.
- **Same bug elsewhere.** Search for the same pattern in sibling code; the plan should state whether those are fixed too or left out of scope.
- **Regression test first.** Plan a test that fails on the current code and passes after the fix.
- **Check prior investigations** in the repo docs and git history; the bug may have been half-fixed before.

## New feature

- Confirm where it lives in navigation and which roles/contexts see it.
- Identify the closest existing feature and plan to mirror its structure.
- Cover all UI states (empty, loading, error, success, overflow) even if the design shows only one.
- Translations, analytics events, permissions, feature flag, and docs: decide each explicitly.
- Backend dependency: does the endpoint exist? Is it deployed in each environment?

## Refactor

- State the invariant: what observable behavior must stay identical.
- Make sure tests covering that behavior exist **before** the refactor; if they don't, adding them is step one of the plan.
- Keep refactor commits separate from behavior changes.
- Map every caller; a refactor's blast radius is all of them.

## UI / visual change

- Collect every breakpoint and state from the design and list the ones the design leaves out.
- Check the shared components and global styles involved; changing them affects every screen using them.
- Plan a visual verification step (run the app, screenshots at key widths) in addition to unit tests.
- Long text and translated strings, touch targets, keyboard and focus, dark mode.

## Data / schema migration

- Forward migration, backfill of existing rows, and rollback path.
- Behavior during the deploy window when old code meets new schema (and vice versa).
- Size of the affected data and runtime of the migration; locking.
- Who else reads this data (reports, other services, exports).

## API / contract change

- Versioning or additive-only change; deprecation path for removed fields.
- Ship order between producer and consumers; consumers must tolerate both shapes during the window.
- Update API docs, generated clients, mocks and fixtures.

## Performance work

- Measure before planning: where the time actually goes, with numbers.
- Define the target and how it'll be measured after the change.
- Check that the optimization doesn't change results (ordering, rounding, caching staleness).

## Dependency upgrade

- Read the changelog and migration guide between the current and target versions.
- List breaking changes that affect this repo, with the files they touch.
- Plan to run the full test suite and a manual smoke test of the areas the dependency serves.
