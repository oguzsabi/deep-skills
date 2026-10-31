<!-- Copied from skills/deep-plan/references/edge-cases.md by scripts/sync-shared.mjs. Edit the source, not this copy. -->

# Edge-case sweep

Walk every category against the planned change. For each one, write either how the plan handles it, or "N/A: <reason>". Don't drop a category silently: an explicit N/A shows the user it was considered, and occasionally writing the reason reveals it isn't N/A after all.

Two passes per category:

- **New behavior**: does the new code handle this case?
- **Existing behavior**: could the change break this case for any caller, screen, or mode found during investigation?

## Contents

1. Data and input
2. State, timing and lifecycle
3. Users, permissions and contexts
4. Contracts and compatibility
5. UI and interaction
6. Locale, time and formatting
7. Errors and failure modes
8. Performance and scale
9. Security and privacy
10. Observability and analytics
11. Delivery and rollout

## 1. Data and input

- null / undefined / missing fields; empty string vs absent; empty arrays and objects
- zero, negative, very large, decimal precision, NaN, Infinity
- very long strings, unicode/emoji, RTL text, whitespace-only, HTML/markup in user content
- duplicates, ordering assumptions, single-item vs many-item lists
- boundary values (first/last page, min/max length, exactly-at-limit)
- past the assumed maximum: done above required, over-delivered, a number gaining a digit (layout widths reserved from the smaller value)
- legacy data already stored in the old shape; data created before the feature existed
- defaults: what the user sees before they ever set the value

## 2. State, timing and lifecycle

- loading, empty, partial and error states, and the transitions between them
- rapid repeated actions (double click, double submit), concurrent edits, out-of-order responses
- stale data after navigation, back/forward, refresh, deep links, opening in a new tab
- component/page init and destroy: subscriptions, timers, listeners cleaned up
- caching and invalidation: does anything cache the old value?
- optimistic updates and rollback on failure
- unsaved changes on navigation away

## 3. Users, permissions and contexts

- each role or permission level, including the lowest one and admins
- unauthenticated, expired session, public/shared/export/embedded/read-only modes: will a new request in that mode fail or redirect?
- multi-tenant or multi-organization boundaries
- feature flag on vs off, and toggling while the user is on the page
- first-time user vs user with lots of existing data

## 4. Contracts and compatibility

- API request/response shape changes: is the other side deployed first? does old client + new server (and vice versa) still work?
- optional vs required fields; enum values the client doesn't know yet
- DB schema changes, migrations, backfills, and their reversibility
- shared libraries or packages consumed by other repos; version bumps
- persisted client state (local storage, URL params, saved filters) in the old format
- public interfaces: exported functions, component inputs/outputs, events others listen to

## 5. UI and interaction

- responsive widths: smallest phone, tablet, large desktop; zoomed text
- window heights: short laptop windows, landscape phones; floating content (cards, popovers, menus, tooltips) with no room on either side, and two floating layers covering each other
- every mode crossed with every input method: a shared / export / read-only view that hides links or tabs, used by keyboard only or touch only
- long text, translations longer than English, truncation and tooltips
- touch vs mouse vs keyboard; focus order, focus traps in dialogs, escape to close
- accessibility: labels, roles, contrast, screen reader announcements for dynamic changes
- dark mode / themes if supported
- states not shown in the design (empty, error, loading, disabled, overflow)
- print/export/screenshot rendering if the page supports it

## 6. Locale, time and formatting

- every supported language has the new strings; pluralization; interpolation
- dates: time zones, DST transitions, start/end of day, inclusive vs exclusive ranges, date-only vs datetime
- number, currency and percentage formatting per locale
- sorting and comparison with locale-specific characters

## 7. Errors and failure modes

- network failure, timeout, 4xx vs 5xx, malformed response
- partial success in batch operations
- what the user sees and can do after an error (retry, message, recovery)
- error handling that already exists upstream (interceptors, global handlers) and how the new code interacts with it
- logging/reporting of the error without leaking sensitive data

## 8. Performance and scale

- large lists or datasets; pagination; N+1 requests
- extra requests added to hot paths or page load
- re-render or change-detection cost; expensive work in loops or templates
- bundle size impact of new dependencies

## 9. Security and privacy

- authorization enforced server-side, not only hidden in the UI
- injection (XSS, SQL, command), unsafe HTML rendering, URL/redirect handling
- secrets or personal data in logs, URLs, analytics, error reports, or client bundles
- data exposed in public/shared modes that shouldn't be

## 10. Observability and analytics

- analytics/tracking events: added, renamed, or no longer firing because of the change
- logs and error monitoring for the new failure paths
- metrics or dashboards that depend on the changed behavior

## 11. Delivery and rollout

- ship order across repos/services and the compatibility window between deploys
- feature flag or config needed to release safely
- rollback: can the change be reverted without data loss or a broken state?
- environment differences (local, test, staging, production): config, data, feature flags
- CI implications: new test setup, fixtures, environment variables
