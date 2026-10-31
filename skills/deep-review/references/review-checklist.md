# Review checklist

Walk each section against the diff and its blast radius. A checklist item only becomes a finding when you can name the concrete input, state or caller that triggers it, and you've re-read the code to confirm it.

## Contents

1. Logic and data
2. State, async and lifecycle
3. Contexts, permissions and errors
4. Regressions in existing behavior
5. Code quality and simplicity
6. Repo conventions and hygiene
7. Security, performance, observability
8. UI-specific (if the change has UI)

## 1. Logic and data

- Conditions: inverted checks, `<` vs `<=`, `&&` vs `||`, missing `else`, wrong precedence
- Falsy traps: `0`, `''`, `false`, `NaN` treated as missing; `??` vs `||`
- null/undefined/empty: optional fields, empty arrays/objects, missing API fields, legacy stored data in the old shape
- Off-by-one in loops, slices, pagination, ranges; inclusive vs exclusive bounds
- Dates and time zones: start/end of day, DST, date-only vs datetime, server vs client time zone
- Number handling: precision, rounding, division by zero, string vs number comparisons
- Mutation of shared objects/inputs; reference vs value equality
- Copy-paste errors: wrong variable in a duplicated block
- Switch/enum handling that silently ignores new or unknown values

## 2. State, async and lifecycle

- Race conditions: out-of-order responses, double submit, stale closures
- Subscriptions, listeners, timers, observers cleaned up on destroy
- Loading/error/empty states all reachable and rendered correctly
- Cache invalidation: anything still holding the old value after the change
- Optimistic updates rolled back on failure
- Initialization order: value read before it's set; inputs not yet available at init

## 3. Contexts, permissions and errors

- Every mode the code runs in: roles, unauthenticated/public/shared/export/read-only, tenants, feature flag on/off, SSR vs client
- New requests in unauthenticated or public modes: will they 401/403 and trigger a redirect or global error handler?
- Authorization enforced on the server, not just hidden in the UI
- Error paths: network failure, 4xx/5xx, malformed response, partial batch failure; what the user sees and whether they can recover
- Interaction with existing global handlers (interceptors, error boundaries) — double handling or swallowed errors

## 4. Regressions in existing behavior

- Every caller of a changed function/component/util/type: does it still get what it expects?
- Changed defaults, input names, return shapes, event payloads, CSS classes or selectors others depend on
- Shared styles/components: does the change leak into other screens?
- Removed or renamed i18n keys, analytics events, routes, config keys, feature flags still referenced elsewhere
- API contract changes: is the other side compatible during the deploy window?
- Existing tests modified to match new behavior: is that behavior change intended by the requirements, or is the test now covering a regression?
- Persisted state (local storage, URL params, saved settings) from before the change still loads

## 5. Code quality and simplicity

- Abstractions, generics, options or config that only one call site uses
- Logic duplicated where an existing util/component/service already does it
- Could the same result be achieved with noticeably less code or fewer moving parts?
- Dead code, unused variables/imports/functions/styles, orphans this change created
- Names that don't say what the thing is or does
- Comments that restate the code; missing comments where the "why" is genuinely non-obvious
- Functions/components that grew too large or took on a second responsibility
- Magic numbers/strings that should be named or already exist as constants

## 6. Repo conventions and hygiene

- Every rule in the repo's CLAUDE.md/AGENTS.md/CONTRIBUTING (file boundaries, export style, naming, required guards, etc.)
- Matches how sibling code is structured, named and tested
- Leftovers: `console.log`, `debugger`, `print`, commented-out code, TODOs without a ticket, temporary flags
- Focused or skipped tests: `.only`, `fit`, `fdescribe`, `xit`, `.skip`, `@Disabled`
- New lint-disable comments, `any`, `@ts-ignore`, non-null assertions: each one justified?
- Unrelated files or formatting churn in the diff
- Secrets, tokens, internal URLs, personal data committed
- Lockfile/dependency changes that weren't intended

## 7. Security, performance, observability

- XSS via unsafe HTML binding, injection, open redirects, unsafe URL construction
- Sensitive data in logs, analytics, error reports, URLs, or public/export views
- New requests on hot paths or page load; N+1 requests; missing pagination
- Expensive work in templates/render loops; unnecessary re-renders/change detection
- Bundle size: heavy new dependencies or imports
- Analytics/tracking events still fire as before; new ones added if the requirements need them
- Errors reported to monitoring with useful context

## 8. UI-specific

- All states: empty, loading, error, disabled, long text, overflow, many items
- Responsive widths, from the smallest phone to large desktop; zoomed text
- Translations longer than English; every locale has the new keys
- Keyboard, focus order, focus trap/return in dialogs, escape handling
- Accessible names, roles, contrast; screen-reader announcements for dynamic content
- Touch vs mouse behavior (hover-only interactions, tooltips)
- Matches the design where the repo treats it as authoritative; differences noted
