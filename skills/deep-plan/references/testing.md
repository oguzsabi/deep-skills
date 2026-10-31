# Test planning

## Learn the repo's testing setup first

Before planning any test, find out:

- The test runners and commands (`package.json` scripts, `Makefile`, `pyproject`, CI workflow files). The CI config is the most reliable answer to "how are tests really run".
- Where unit tests live and how they're named (co-located `*.spec.ts`, `tests/` folder, etc.).
- The existing mocking/fixture style: test utilities, factories, mock servers, page objects for e2e.
- Whether e2e tests run in CI, against which environment, and what data they need.
- Any repo docs describing test conventions or known flaky tests.

New tests should look like the tests next to them.

## What makes a test meaningful

- It traces to a requirement (R#) or an edge case from the sweep. If you can't name what it protects, drop it.
- It would fail if that requirement were broken. A quick self-check: imagine the most likely wrong implementation; would this test catch it?
- It asserts observable behavior (output, rendered state, emitted event, request sent, stored value), not private implementation details, so that a correct refactor doesn't break it.
- It covers the unhappy paths that matter: error responses, empty data, permission denied, boundary values.
- It's deterministic: no reliance on real time, random data, network, or test ordering. Fake timers and fixed dates for anything date-based.
- It has a name that reads as a behavior statement ("hides the export button for viewers"), so a failure explains itself.

Avoid: snapshot tests of large trees, tests that just restate the code, asserting that a mocked function was called when the real effect could be asserted instead, and tests that can't fail.

## Updating existing tests

For each existing test touched by the change, classify it:

- **Intended behavior change**: the test asserts the old behavior the requirement changes. Update it, and say which requirement justifies the update.
- **Incidental breakage**: the test breaks because of setup or wiring (new dependency to provide, new input). Fix the setup without changing what it asserts.
- **Regression**: the test breaks because the change broke something it shouldn't. That's a bug in the plan; fix the design, not the test.

Never delete or skip a failing test to get green without the user's agreement.

## When e2e tests are warranted

Plan e2e coverage when at least one applies:

- The behavior spans several layers that unit tests mock away (routing + API + rendering, auth redirects, interceptors).
- It's a critical user flow (sign-in, checkout, save, publish, share/export) where a regression would be costly.
- The bug or feature is about integration: two units are each correct but wrong together.
- The behavior depends on real browser features (layout at a viewport width, focus, scrolling, file download).

Skip e2e (and say so) when unit tests already prove the behavior and the integration path is unchanged, or when the e2e environment can't exercise it reliably. If the repo has no e2e setup, don't introduce one without asking.

For each planned e2e test, specify: the flow step by step, the data/fixtures it needs, the viewport/role/context, the assertions, and how it's run locally and in CI.

## Running tests during implementation

1. Run the new and updated tests in isolation first (fast feedback).
2. Run the wider relevant suite (the module or project) to catch collateral breakage.
3. Run typecheck/lint/build if the repo has them.
4. Run e2e if planned.

Report actual commands and actual results. If a test can't run in this environment, say so and say what the user needs to run, rather than claiming success.

## Documenting tests

Follow the repo's convention: a test docs file, a docs/feature write-up, a section in the PR description, or comments in the spec file only where the "why" isn't obvious. At minimum record: what each new test protects (R#/edge case), how to run them, required fixtures or environment, and any known limitations (what's not covered and why).
