# UI scenario checklist

Walk every section against each requirement and each touched screen. A section that doesn't apply gets "N/A: <reason>" in the work doc; writing the reason sometimes shows it does apply.

## Contents

1. Requirement flows
2. States
3. Data shapes
4. Navigation and state
5. Timing
6. Interaction
7. Layout and viewports
8. Roles, permissions and modes
9. Locales
10. Integrity: console, network, persistence
11. Regression neighbours

## 1. Requirement flows

- The happy path of every R#, end to end, as the user would do it.
- Each acceptance criterion taken literally: exact copy, exact counts, exact order, exact target of every link.
- Every entry point to the feature (menu, deep link, button on another screen, notification).
- Decisions the user made during planning: each one visibly true in the app.
- Decisions from different rounds that touch the same element, tried together (e.g. "rows stay on a view switch" plus the sort indicator; a card that flips sides plus its tooltips).

## 2. States

- Loading (throttle the network to see it), skeletons matching the real layout.
- Empty: no data at all, and nothing matching the current filters.
- Partial: some sections loaded, others failed or empty.
- Error: 4xx, 5xx, timeout, offline; what the user sees and whether they can recover.
- Success feedback after actions; disabled states and why they're disabled.

## 3. Data shapes

- 0, 1, many, and very many items (pagination, virtual scroll, performance).
- Long names and text, unicode and emoji, missing optional fields, null values the DTO allows.
- Large and small numbers, zero, decimals, percentages over 100; values past their target (10/9) and a digit more (9 → 10), checked across every view or lens that shows them.
- Dates at boundaries: today, past, future, start and end of ranges, time zones, entities created before the feature existed.
- Mixed states in one list (some done, some late, some missing).

## 4. Navigation and state

- Refresh on every screen and state; deep link and opening in a new tab.
- Back and forward through the flow; leaving and returning to a tab.
- Filters, sort, search, pagination and expanded rows: kept or reset exactly as intended, including when a chip or filter is removed.
- URL params: valid, invalid, stale.
- Switching between entities (item A → item B): no state from A leaks into B.

## 5. Timing

- Double click and double submit.
- Acting before data finishes loading; links or filters applied before rows exist.
- Rapid repeated changes (filter toggling, typing in search): the last action wins.
- Slow network and out-of-order responses.

## 6. Interaction

- Keyboard only: tab order, visible focus, Enter/Space, Escape closes, focus returns after dialogs and menus.
- Hover-only content (tooltips, hover cards, row actions): reachable on touch and by keyboard, in every mode (a shared or export view that turns links into plain text can leave nothing focusable).
- Floating layers together: a tooltip, card, popover or menu open at once; none covers another's content or links.
- Scroll containers, sticky headers and columns, drag and drop.
- Clicking everything clickable on the screen, including what looks clickable but isn't.

## 7. Layout and viewports

- Widths: 375 (phone), 768 (tablet), 1280 and 1440 (laptop), 1920+ (desktop).
- Heights, for anything floating or sticky: a short laptop window (1280×600) and a landscape phone (812×375); trigger it at the top and at the bottom of the window. With no room on either side, everything in it must still be reachable.
- Browser zoom 200%; longest locale; long data.
- Overflow, truncation with access to the full text, wrapping, no horizontal page scroll, nothing overlapping.
- Alignment with the rest of the screen (columns, skeletons, spacing).

## 8. Roles, permissions and modes

- Every role that can reach the screen; missing permissions hide or disable what they should, with no broken layout left behind.
- Each mode crossed with keyboard only and touch only, including modes whose settings hide tabs, links or statuses: anything the mouse reaches, the keyboard reaches too.
- Public, shared, export, briefing or other unauthenticated modes: no request that 401s or redirects to login, no edit controls, no data that mode shouldn't show.
- Feature flags on and off.

## 9. Locales

- Every locale: no raw translation keys, nothing cut off, plurals right for 0, 1 and many.
- Date, number and currency formats per locale.

## 10. Integrity: console, network, persistence

- No new console errors or warnings.
- No failed, duplicate or unexpected requests; none fired in modes that shouldn't make them.
- What was saved is really saved: reload and check, and check from another view or role that reads it.
- Analytics and tracking events fire as before, and new ones fire if required.

## 11. Regression neighbours

- Every other screen that uses a changed shared component, style, util or service: main flow still works.
- Bugs fixed earlier in this area (from the docs): still fixed.
