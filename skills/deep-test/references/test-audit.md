# Auditing existing tests

Applies to unit/integration tests in `/deep-test` and to e2e specs in `/deep-ui-test`.

## Verdicts

| Verdict | When | Action |
|---------|------|--------|
| **Keep** | Traces to an R# or edge case, asserts observable behaviour, deterministic, fails when broken | None |
| **Update** | Right intent, but weak or wrong: asserts too little, asserts implementation details, flaky timing, wrong expectation, misleading name | Rewrite the assertion or setup; keep what it protects |
| **Merge** | Several tests prove the same thing with trivially different data | Fold into one table-driven test |
| **Remove** | Can't fail, duplicates another test exactly, tests a mock rather than code, or asserts behaviour the plan deliberately removed | Delete. Tests that existed before this work: ask first, unless the plan changed the behaviour they assert |
| **Missing** | An R#, plan edge case or Phase 3 case has no test | Write it |

## Smells

- Asserts that a mock was called when the real effect (rendered text, emitted value, stored state, request body) could be asserted.
- Re-implements the code under test to compute the expected value.
- Expected values copied from the current output without checking them against the requirement.
- Only the happy path: no empty, error, boundary or permission case.
- Real time, random data, network, or test order dependence. Dates without fake timers or fixed values.
- `setTimeout`/`waitForTimeout` sleeps instead of waiting for a condition.
- Snapshots of large trees that nobody reads.
- Names that describe the code ("calls getData") instead of the behaviour ("shows the empty state when the campaign has no deliverables").
- e2e: selectors on styling classes or text that changes per locale instead of test ids or roles; tests that depend on data another test creates.
- e2e: a test that changes browser state (CDP emulation, viewport, permissions, geolocation, storage, routes, clock) without restoring it in `finally`. Check the fixture's scope first: a worker- or file-scoped page carries the change into later tests, across navigation, and nothing fails to show it. Prove the reset with a probe in a following test.

## The mutation check

For each test that guards important behaviour:

1. Break the guarded code in the most likely wrong way: invert a condition, drop a branch, return early, off-by-one, remove the null guard.
2. Run only that test (and its file).
3. It must fail. If it passes, the test doesn't protect the behaviour: update or replace it.
4. Restore the code and confirm with `git diff -- <file>` that the mutation is gone. Never leave a mutation in the tree, even across a pause; if you get interrupted, restoring comes first.

One or two mutations per important behaviour are enough. Record which tests passed the check.

## Removing or changing tests safely

- Classify every changed existing test (from `testing.md`): intended behaviour change (cite the R#), incidental setup breakage (fix the setup, keep the assertion), or regression (fix the code, not the test).
- A test is never removed or weakened just because it fails.
- Record every removal and its reason in the work doc.
