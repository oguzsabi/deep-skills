# Search and filter the issue list (#12)

**Ticket:** [docs/tickets/12-search-and-filter.md](../tickets/12-search-and-filter.md) · **Type:** Story · **Status:** Implemented, unit- and browser-tested, UX-reviewed, reviewed; ready to ship

## Resume here
- Stage (current): deep-ship — done (2026-11-01): feature committed, branch pushed, PR opened to main; waiting for PR review (then /deep-pr-comments)
- Stage: deep-review round 1 — done (2026-11-01): 6 fixes, Q1 → A applied, Q2 → A kept
- Next: waiting for PR review; on comments, /deep-feature continues with /deep-pr-comments
- Open questions: none. Accepted open items (loop guard B, Decisions round 5) are listed under "Review → Round 2 → Accepted open items"
- Working tree: branch `example/deep-feature`, everything committed (the feature commit, then the example write-up); no shared data created

## Flow (deep-feature)
Mode: subagents

| # | Step | Status | Round | Where | Outcome / reason |
|---|------|--------|-------|-------|------------------|
| 1 | deep-plan | done | 1 | subagent | Plan final; Q1-Q4 → A, Q5-Q9 defaults; 3 back-button cases added on re-sweep |
| 2 | implement | done | 1 | subagent | 6 steps; unit 17/17, e2e 20/20 · logic_changed, ui_changed |
| 3 | deep-test | done | 2 | subagent | R1: 0 bugs, unit 17→21, 14/14 mutations. R2 scoped: 0 bugs, 8/8 mutations; e2e gap E10 handed to review |
| 4 | deep-ui-test | done | 2 | subagent | R1: 26 rows × 8 viewports, 1 bug fixed (S23). R2 scoped: 15 rows pass, 0 bugs; S32 (two reset buttons) for review |
| 5 | deep-ux | done | 1 | subagent | 0 bugs; 6 of 7 suggestions built (Q1-Q6 → A, Q7 kept); unit 22, e2e 30 · logic_changed, ui_changed |
| 6 | deep-review | done | 2 | subagent | R1: 7 fixed (F1-F6, Q1 → A). R2 scoped: 4 fixed (F7-F10). Ready for PR; unit 22, e2e 34. Loop guard: no round 3 of deep-test/deep-ui-test (user: B) |
| 7 | deep-ship | done | 1 | conductor | feature committed; branch pushed and PR opened to main |

## Plan

### Sources reviewed
- `docs/tickets/12-search-and-filter.md`: the story, five needs, four acceptance criteria, "no mockup, match the existing page".
- `AGENTS.md`: no framework or build step; DOM-free logic in `public/lib/` with unit tests in `test/`; `data-testid` on rows and controls tests use; feature docs in `docs/features/`, listed in `docs/README.md`; Conventional Commits.
- `README.md`, `docs/README.md`, `package.json`, `playwright.config.js`.
- All source: `server.mjs`, `public/index.html`, `public/app.js`, `public/lib/issues.js`, `public/styles.css`, `data/issues.json`.
- Tests: `test/issues.test.js`, `e2e/list.spec.js`.
- Git history: the app arrived in one commit (`3977a5a`); no earlier write-ups of this area.
- Not available: nothing missing. No design exists (the ticket says so).

### Goal
A team lead can narrow the issue list by title text and by status, together, and share or step back through exactly what they are looking at through the URL. When nothing matches, the page says so and one click restores the full list.

### Requirements
- **R1** A search box above the list; typing filters issues by title. Acceptance: typing "csv" shows only "Export to CSV drops the last row" (AC1).
- **R2** A status filter with All, Open, In progress, Closed. Acceptance: choosing Open shows only open issues (12 of the 24 in `data/issues.json`) (AC2).
- **R3** Search and status filter combine (AND). Acceptance: search "the" with In progress shows exactly #105, #109, #117.
- **R4** The count above the list matches the rows shown. Acceptance: count equals the number of `issue-row` elements in every state (AC2).
- **R5** Search and filter live in the URL; opening a shared link restores the same controls and results. Acceptance: opening `/?q=csv&status=closed` shows "csv" in the box, Closed selected, one row (AC3).
- **R6** The browser's back (and forward) button moves between filter states without reloading the data. Acceptance: change the filter, press back, the previous controls and results return.
- **R7** With no matches, a clear empty state with a one-click reset. Acceptance: `/?q=zzz` shows the empty state; one click shows all 24 issues with cleared controls and a clean URL (AC4).
- Implicit:
  - **R8** Existing behaviour is kept when no search or filter is active: all issues, newest first, count "24 issues", the load-error message (`e2e/list.spec.js:3-15` keeps passing unchanged).
  - **R9** Works on the mobile Playwright project (Pixel 7) as well as desktop: controls usable and readable at phone width.
  - **R10** Controls are labelled and keyboard usable; the controls carry `data-testid`s (AGENTS.md).
  - **R11** Titles with special characters (`C++`, `100%`, `&`, `€ vs ₺`, quotes) are searchable literally and survive the URL round trip; the data includes Turkish titles, so how Turkish letters match is decided in Q2.
- Non-goals: searching by id, assignee or date; server-side filtering, pagination or sorting changes; highlighting matches; per-status counts in the filter; a "no issues at all" state for an empty dataset (unchanged behaviour); multi-select status.

### Current state
- The page is a header with `h1` and a count paragraph (`aria-live="polite"`), then one `<ul id="issues">` (`public/index.html:11-15`).
- `public/app.js:32-41` fetches `/api/issues` once, sorts with `sortByUpdated` (`public/lib/issues.js:15-17`) and calls `render` (`public/app.js:27-30`), which replaces all rows and sets the count to `` `${issues.length} issues` `` (`public/app.js:29`). Nothing keeps the loaded issues, so a re-render needs the list kept in memory.
- Rows are built with `textContent` only (`public/app.js:6-25`), so no markup injection today.
- Status keys and labels: `STATUS_LABELS` in `public/lib/issues.js:4-8` (`open`, `in_progress`, `closed`).
- The server routes on `pathname` only (`server.mjs:15-19`), so `/?q=…&status=…` already serves `index.html`: shared links need no server change.
- The list has a border and rounded corners (`public/styles.css:42-49`), so an empty `<ul>` would show as an empty bordered strip.
- Data: 24 issues, 12 open, 6 in progress, 6 closed. Titles include Turkish (`İstanbul`, `Ödeme`, `Sıralama`), `C++`, `100%`, `&`, `€ vs ₺` and quotes, clearly chosen to exercise matching and URL encoding.
- Verified in Node 26: `'İstanbul'.toLowerCase()` gives `i̇stanbul` (i plus a combining dot), so a plain lower-case comparison does not find it when typing "istanbul". `ı` (dotless i) is a separate letter, so "siralama" does not find "Sıralama" even after stripping accents.
- Affected screens and modes: the single page; desktop and mobile Playwright projects (`playwright.config.js:6-9`); loading, loaded and error states. No auth, roles, i18n or analytics exist.
- Existing tests, baseline run on 2026-10-31: `npm test` 4/4 pass; `npm run e2e` 4/4 pass (2 tests × desktop and mobile).

### Approach
Filter on the client. Put the pure parts (matching, filtering, URL parse/serialize, count text) in a new `public/lib/filters.js` with unit tests, and keep `public/app.js` as the thin DOM layer: read the filters from `location.search`, render the filtered list, update the URL on each change, and re-render on `popstate`. The data is already all on the client and small (24 rows), so there is no API change and no debounce.

Alternatives considered:
- Server-side filtering (`/api/issues?q=`): a contract change and a fetch per keystroke for 24 rows; not needed.
- Hash-based state (`#q=…`): works, but query parameters are the usual shareable form and the server already ignores them.

### Changes
| File | Change | Why (R#) |
|------|--------|----------|
| `public/lib/filters.js` (new) | `normalizeText`, `filterIssues(issues, { q, status })`, `parseFilters(search)`, `serializeFilters(filters)`, `countLabel(shown, total, filtered)`. Valid statuses from `STATUS_LABELS`. | R1–R5, R11 |
| `public/app.js` | Keep loaded issues; read filters from the URL on start; render filtered rows, count and empty state; input and change handlers update the URL (`pushState` / `replaceState` per Q1); `popstate` restores controls and re-renders; reset button; form submit prevented. | R1–R7 |
| `public/index.html` | A `<form role="search">` between header and list with a labelled `type="search"` input (`data-testid="search-input"`) and a labelled status control (`data-testid="status-filter"`, per Q3); a hidden empty-state block (`data-testid="empty-state"`) with a message and a reset button (`data-testid="reset-filters"`). | R1, R2, R7, R10 |
| `public/styles.css` | Toolbar layout that wraps on narrow screens; empty-state styles; hide the empty list box. | R7, R9 |
| `test/filters.test.js` (new) | Unit tests below. | R1–R5, R11 |
| `e2e/filters.spec.js` (new) | E2E tests below. | R3–R7, R9 |
| `docs/README.md` | List this feature doc. | AGENTS.md |

Deliberately not changing: `server.mjs`, `data/issues.json`, `public/lib/issues.js` (sorting and labels stay as they are), `test/issues.test.js`, `e2e/list.spec.js`, `playwright.config.js`, `package.json` (no new dependencies).

### Implementation order
1. `public/lib/filters.js` and `test/filters.test.js` → verify: `npm test` green.
2. Markup and styles for the toolbar and empty state → verify: `npm start`, page loads, all 24 rows, existing `npm run e2e` green.
3. Filtering and count wiring in `app.js` (no URL yet) → verify: manual check of AC1, AC2, AC4.
4. URL read on start, URL writes and `popstate` → verify: manual check of AC3 and back/forward.
5. `e2e/filters.spec.js` → verify: `npm run e2e` green on desktop and mobile.
6. Docs: this doc's implementation notes and test list → verify: links resolve.

### Cross-repo / ship order
N/A: one static app, no API or data change.

### Edge cases
| Case | Handling |
|------|----------|
| **Data and input** | |
| Case: "csv" vs "CSV" | Case-insensitive match (AC1). |
| Turkish and accented letters (`İstanbul`, `Ödeme`, `Sıralama`) | Per Q2. Recommended: strip accents and fold `ı`/`İ` to `i`, so "istanbul", "odeme", "siralama" all match. |
| Special characters `C++`, `100%`, `(€`, `&`, quotes | Literal substring match (no regex); URL encoded with `URLSearchParams`. |
| Leading/trailing spaces, whitespace-only | Trimmed; whitespace-only counts as no search and is left out of the URL (Q6). |
| Several words ("csv export") | Whole-phrase substring (Q6); "export to csv" matches, "csv export" does not. |
| Very long query or title | Long titles already wrap (`overflow-wrap: anywhere`, `styles.css:63-66`); the input scrolls. |
| Unknown status in URL (`status=blocked`, `status=Open`) | Treated as All; the URL is cleaned with `replaceState` on load (Q5). |
| Empty `q=` / `status=` / duplicate params | Treated as not set; `URLSearchParams.get` takes the first value. |
| Hand-typed `?q=C++` (unencoded `+` means space) | Decodes to "C  "; links the app writes are encoded, so only hand-typed links hit this. Accepted. |
| Order of filtered rows | Filtering keeps the newest-first order from `sortByUpdated`; `filterIssues` does not mutate its input. |
| **State, timing and lifecycle** | |
| Typing or choosing a status before data loads | Controls work; the current state is applied when the data arrives. |
| Load error with filters in the URL | Error message stays; no empty state shown (Q9). |
| Back/forward | `popstate` re-reads the URL, sets the input and status control, re-renders from memory (no refetch). |
| Change that leaves the URL the same (same status picked, trailing space) | No new history entry. |
| Reset | Clears both, pushes one history entry, focuses the search box. |
| Refresh / new tab with a filtered URL | Same as opening a shared link (R5). |
| **Users, permissions and contexts** | N/A: no auth, roles or flags. |
| **Contracts and compatibility** | `/api/issues` unchanged. Old links (`/`) still show everything. The new URL format becomes a public contract once links are shared, hence fixed in Q5. |
| **UI and interaction** | |
| Phone width | Toolbar wraps: search full width, status control below or beside it; covered by the mobile e2e project. |
| Keyboard | Labelled controls in tab order; Enter in the search box does not reload the page (submit prevented); Esc in `type="search"` clears it in Chrome; assumed to fire `input` like typing (to confirm in /deep-ui-test). |
| Screen readers | Count is already `aria-live="polite"`, so the new count is announced; the empty state message sits next to it. |
| Empty list box | The `<ul>` is hidden when empty so no bordered strip shows. |
| `hidden` overridden by CSS | Empty-state CSS must not set `display` on the element in a way that beats `[hidden]`; add `[hidden] { display: none }` for it. |
| Dark mode, print | N/A: the page has neither. |
| **Locale, time and formatting** | Count pluralisation ("1 issue") per Q4. English-only UI; no dates touched. Turkish matching per Q2. |
| **Errors and failure modes** | Only the existing load error; filtering cannot fail. Covered by keeping `e2e/list.spec.js:11-15` and one new error-with-filters case. |
| **Performance and scale** | 24 rows, filter on every keystroke, no debounce. Fine to a few thousand rows; not a goal beyond that. |
| **Security and privacy** | `q` comes from the URL, so a shared link is untrusted input: the query is only ever written with `textContent` / `value`, never `innerHTML`. No personal data in the URL beyond what the user typed. |
| **Observability and analytics** | N/A: none in the app. |
| **Delivery and rollout** | Static files only; revert is a plain revert. No flag needed. |

Regression risks in existing behaviour: the unfiltered count and order (kept by R8 and the untouched `e2e/list.spec.js`); the load-error message (kept, plus a filtered-URL variant); the list rendering through `textContent` (kept).

### Tests
New unit tests, `test/filters.test.js` (`node --test`, same style as `test/issues.test.js`):
- `filterIssues matches the title case-insensitively` — "csv" → only #103 (R1, AC1).
- `filterIssues ignores accents and Turkish dotted/dotless i` — "istanbul" → #106, "odeme" → #102, "siralama" → #115, "İSTANBUL" → #106 (R11, per Q2).
- `filterIssues treats special characters literally` — "C++" → #104, "100%" → #105, "&" → #119, "(€" → #109 (R11).
- `filterIssues trims the query and treats whitespace-only as no search` (Q6).
- `filterIssues filters by each status and returns everything for all` — 12 / 6 / 6 / 24 (R2).
- `filterIssues combines search and status` — "the" + in_progress → #105, #109, #117; "csv" + open → none (R3).
- `filterIssues keeps the input order and does not mutate it` (R8).
- `parseFilters reads q and status from a query string` — `?q=csv&status=open` (R5).
- `parseFilters falls back to all for a missing, empty or unknown status` (Q5).
- `serializeFilters leaves out defaults and encodes special characters` — defaults → `''`; `&`, `+`, `%` encoded (R5, R11).
- `parseFilters and serializeFilters round-trip` — for `C++`, `100%`, `Tags with &`, `€ vs ₺`, `İstanbul` (R5, R11).
- `countLabel` — "24 issues", "1 issue", "12 of 24 issues", "1 of 24 issues", "0 of 24 issues" (R4, per Q4).

Updated existing tests: none. `e2e/list.spec.js` asserts "24 issues" for the unfiltered page, which stays true under Q4 A or B.

E2E tests, `e2e/filters.spec.js` (warranted: URL, history and rendering only work together in a real browser), run on desktop and mobile, no fixtures beyond `data/issues.json`:
- Typing "csv" shows only "Export to CSV drops the last row", count "1 of 24 issues", URL has `q=csv` (AC1, R4). UI-visible.
- Choosing Open shows 12 rows, each with status "Open", count matches (AC2, R4). UI-visible.
- Search "the" with In progress shows 3 rows (R3). UI-visible.
- Opening `/?q=csv&status=closed` fills the box and the status control and shows one row; opening `/?q=C%2B%2B` shows the C++ issue with "C++" in the box (AC3, R5, R11). UI-visible.
- Back and forward: choose Open, then type "fails"; back returns to Open with an empty box and 12 rows; back again to all 24; forward restores. Typing a whole word adds one entry, not one per letter; typing after back drops the forward entry (R6, Back-button history decision). UI-visible.
- `/?q=zzz` shows the empty state and no rows; one click on reset shows 24 rows, empty box, All, URL `/` (AC4, R7). UI-visible.
- Load error with `/?q=csv`: the error message shows and the empty state does not (Q9). UI-visible.

Run with: `npm test`, `npm run e2e` (or `npx playwright test e2e/filters.spec.js`).
Documented in: this doc (the repo has no separate test docs); the implementation adds a short "Tests" note under Implementation notes.

### Assumptions
- The page will stay small enough that client-side filtering of the full list is fine (24 rows today).
- English-only UI copy; the Turkish titles are data, not UI language.
- Chrome-family browsers are the target (the e2e projects are Desktop Chrome and Pixel 7).

### Out-of-scope observations
- The count reads "1 issues" for a single-issue list today (`public/app.js:29`); this feature makes single results common, so Q4 covers it.
- Issue #123's title ("Screen reader reads status as 'in_progress'") describes a bug that is not present in this app: status labels already go through `statusLabel`.

### Questions (round 1)
All answered on 2026-10-31 with the recommended options; see [Decisions](#decisions).

#### Blocking
**Q1. How should the back button step through search changes?**
The ticket asks that "the browser's back button works". Status changes are single events, so each one gets a history entry. Typing is many events, so it needs a rule.
- **A. One entry per search edit (Recommended)** — the first keystroke after the box gains focus (or after a status change, reset or back/forward) pushes an entry; later keystrokes replace it. Back undoes a whole search edit, and tests need no timers.
- B. One entry per pause — push after typing stops for about 400 ms. Close to A in feel, but slow typists get extra entries and tests depend on timing.
- C. One entry per keystroke — back removes one letter at a time; usually annoying.

**Q2. How strictly should the search match letters?**
The data has Turkish titles. A plain lower-case match does not find "İstanbul" when typing "istanbul" (verified: `'İstanbul'.toLowerCase()` gives `i̇stanbul`), and never finds "Sıralama" from "siralama".
- **A. Ignore case, accents and Turkish dotted/dotless i (Recommended)** — "istanbul", "odeme", "siralama" all match; what users on a mixed Turkish/English team expect when typing on any keyboard.
- B. Ignore case only (`toLowerCase`) — simplest; "istanbul" misses "İstanbul", "odeme" misses "Ödeme".
- C. Turkish-locale lower-case (`toLocaleLowerCase('tr')`) — "istanbul" matches, but accents still count ("odeme" misses), and English capital "I" turns into "ı", so typing "invoice" no longer finds "Invoice PDF…" (verified in Node).

**Q3. Which control for the status filter?**
No mockup; the ticket says to match the existing page.
- **A. A native `<select>` (Recommended)** — smallest change, accessible and familiar on phones; two clicks to change.
- B. A segmented control (four radio buttons styled as one bar) — one click and all options visible, but more markup and CSS, and it needs care to fit at phone width.

**Q4. What should the count say when a search or filter is active?**
Today it reads "24 issues", and "1 issues" for one (`public/app.js:29`).
- **A. "12 of 24 issues" when filtered, "24 issues" otherwise, singular "1 issue" (Recommended)** — shows that the list is narrowed and still matches the rows shown (AC2).
- B. "12 issues" in every state, with the singular fixed — minimal, but nothing says the list is filtered.
- C. Keep "N issues" exactly as today, including "1 issues".

#### Defaults I'll assume unless you object
- **Q5.** URL format → `?q=<text>&status=<open|in_progress|closed>`; each parameter left out when empty or All, so the clean URL stays `/`; an unknown status means All and is dropped from the URL on load.
- **Q6.** Search scope → titles only, trimmed, whole phrase as typed (no word splitting), filtered on every keystroke without debounce; whitespace-only means no search.
- **Q7.** Empty state → "No issues match your search." with a "Clear search and filter" button that resets both controls, adds a history entry and puts focus in the search box. The message never repeats the typed query, so a shared link cannot inject markup.
- **Q8.** Code placement → new `public/lib/filters.js` with `test/filters.test.js`, new `e2e/filters.spec.js`; existing test files stay untouched.
- **Q9.** Loading and error → the controls are usable from the start and the current filters apply once data loads; on a load error the existing message stays and the empty state is not shown.

## Decisions
Round 1 (2026-10-31). The user answered "All recommended".
- **Back-button history** → A: one entry per search edit. The first keystroke after the search box gains focus, or after a status change, reset or back/forward, calls `pushState`; later keystrokes call `replaceState`. Each status change and each reset pushes. A change that leaves the URL the same pushes nothing.
- **Search matching** → A: ignore case and accents and fold the Turkish `İ`/`ı` to `i` (NFD, strip combining marks, map `ı` to `i`, lower-case), on both the query and the title.
- **Status filter control** → A: a native `<select>` with All, Open, In progress, Closed.
- **Count text** → A: "N of 24 issues" when a search or filter is active, "24 issues" otherwise, and "1 issue" for one.
- **URL format** (default Q5) → stands.
- **Search scope** (default Q6) → stands.
- **Empty state** (default Q7) → stands.
- **Code placement** (default Q8) → stands.
- **Loading and error** (default Q9) → stands.

Re-sweep after round 1: every answer matches the option the plan already assumed, so the changes, the edge cases and the tests above stand. The search-edit rule from Q1 adds three cases, all handled by the same rule:
- A keystroke after back/forward starts a new edit, so the forward entries are dropped, as in any browser history.
- Typing without moving focus away after a status change still starts a new entry, because a status change ends the edit.
- Clearing the box with Esc or by deleting every character is part of the same edit, so one back returns to the state before the edit.

These three cases join the back/forward e2e test (UI-visible).

Round 2 (2026-11-01), from /deep-ui-test. The user answered "A, keep the input".
- **Typing before the script runs is lost** → A: at start-up, a control whose value differs from its HTML default keeps that value; the other control takes its value from the URL; the result is written to the URL with `replaceState`. An e2e test holds back `app.js` to guard it.

Round 3 (2026-11-01), from /deep-ux. The user answered "All recommended".
- **Empty state names what excluded the results** (UX Q1) → A: "No open issues match “csv”.", "No issues match “zzz”." or "No closed issues.", built by `emptyMessage` in `public/lib/filters.js`. Replaces the "never repeats the typed query" part of the Empty state default (Q7, round 1): its reason was markup injection, and the message is written with `textContent`, so the query is shown and never parsed (an e2e test opens a link with `<b>` in the query to guard it). The button text stays "Clear search and filter".
- **Form-control borders** (UX Q2) → A: a `--control-border: #858580` token (3.71:1 on white, 3.46:1 on the page) on the search box, the status control and the reset button; the list card keeps `--border`.
- **Control height** (UX Q3) → A: the input, the select and the reset button are `box-sizing: border-box; height: 2.5rem` (40 px).
- **Phone toolbar** (UX Q4) → A: the search box's `flex-basis` is 160px, so both controls share one row from about 330 px wide.
- **List while loading** (UX Q5) → A: the list starts `hidden` in the HTML; `render` shows it once the data is in; after a load error it stays hidden.
- **Clear while filtered** (UX Q6) → A: a "Clear" text button after the count, shown while a search or filter is active (data loaded), doing what the empty-state reset does.
- **Dead back step after clearing a search** (UX Q7) → A: keep as is.

Round 4 (2026-11-01), from /deep-review. The user answered "All recommended".
- **Two resets in the empty state** (Review Q1) → A: Clear hides while the empty state shows. This narrows **Clear while filtered** (UX Q6) to "while a search or filter is active and results show". The empty state keeps its own reset.
- **Clear on a phone opens the keyboard** (Review Q2) → A: keep as is. Both resets put focus in the search box.

Round 5 (2026-11-01), from /deep-feature's loop guard after deep-review round 1. The user picked B.
- **Loop guard** → B: no round 3 of /deep-test or /deep-ui-test. The work is accepted with the open items listed under "Review → Round 2 → Accepted open items". The scoped deep-review round 2 still ran, as the routing rules require.

## Implementation notes
Started 2026-10-31 after the go, following the [implementation order](#implementation-order).

- **Step 1** — `public/lib/filters.js` and `test/filters.test.js`. Check: `npm test` 17/17 pass (13 new, 4 existing). Mutation check: replacing `normalizeText` with a plain `toLowerCase()` makes the Turkish/accents test fail, so it guards the Q2 decision.
  - Small additions to the planned unit tests: whole-phrase matching ("csv export" finds nothing), a regex-looking query (`.*`) finds nothing, `status=constructor` is not a status, duplicate params take the first value, and a query containing `&status=closed` is encoded rather than read as a second parameter.
  - `parseFilters` trims `q`, so a URL with only spaces in `q` shows an empty box.
- **Step 2** — markup in `public/index.html` (a `<form role="search">` with a labelled `type="search"` box and a labelled `<select>`, and a hidden empty-state block with the reset button) and styles in `public/styles.css`. Check: the existing `npm run e2e` 4/4 pass (desktop and mobile); the page still loads all 24 rows.
  - The status options are written in the HTML (same labels as `STATUS_LABELS`), so the control is complete before the script runs.
  - `[hidden] { display: none !important; }` rather than the plain rule in the plan, so no later `display` rule can show a hidden element.
- **Step 3** — `public/app.js` keeps the loaded issues in memory and re-renders on every `input` and `change`; the reset button clears both controls and focuses the search box; form submit is prevented. Check (Playwright script against a local server, desktop Chrome): "csv" shows one row and "1 of 24 issues" (AC1); Open shows 12 rows and "12 of 24 issues" (AC2); "the" with In progress shows #105, #109, #117 (R3); "zzz" shows the empty state, hides the list and reads "0 of 24 issues"; reset brings back 24 rows, an empty box, All and focus in the box (AC4); Enter in the box does not reload; no console errors.
  - The empty state shows only when a search or filter is active and nothing matches, so an empty dataset with no filters looks as it does today (non-goal kept).
- **Step 4** — `public/app.js` reads the filters from `location.search` on start, writes them with `pushState`/`replaceState` per the back-button decision, and restores the controls on `popstate`. Check (same Playwright script approach): `/?q=csv&status=closed` fills the box and Closed and shows one row (AC3); `/?q=C%2B%2B` shows the C++ issue with "C++" in the box; `/?status=blocked&q=` shows all 24 and the URL becomes `/`; Open, then typing "fails" (one entry for the whole word), back gives Open with an empty box and 12 rows, back again gives all 24, forward twice restores both; typing after back drops the forward entry; picking the status already selected adds no entry; the data is fetched once across all of it; no console errors.
  - On load the app rewrites the URL to the form it would write itself (`replaceState`, no new entry). Besides dropping an unknown status and empty parameters as planned, this also drops parameters the app does not use and puts `q` before `status`.
  - As the decision says, clearing the box (Esc or deleting every letter) stays part of the same edit. When the edit started from a state with no search, the edit's entry then holds the same state as the one before it, so the next back shows no visible change. For /deep-ui-test and /deep-ux to judge.
- **Step 5** — `e2e/filters.spec.js`, 8 tests. Check: `npm run e2e` 20/20 pass (8 new and 2 existing tests, each on desktop and mobile). Mutation checks: making every keystroke push, letting a status change keep the search edit open, and ignoring `popstate` each make at least one of the history tests fail.
  - The planned back/forward test is split in two: one for back/forward, whole-word entries, typing after back and Esc, and one for "a status change ends the search edit". The second sets the box value and fires `input` from a script, because typing with Playwright focuses the box first and a focus also ends the edit, so the test would pass without the status-change rule.
  - Phone width (Pixel 7, 412 px): the toolbar fits on one line, no horizontal scroll. The status `<select>` renders about 2 px taller than the search box; left for /deep-ux.
- **Step 6** — this doc: the steps above and the tests note below. `docs/README.md` already lists this doc. Check: every relative link in this doc and in `docs/README.md` resolves to an existing file, and every `#…` anchor matches a heading. `README.md` and `AGENTS.md` need no change.
- **Diff check** — every changed line traces to a requirement, a planned test or a doc. One cleanup came out of it: an unused `field-label` class on the two label texts was removed. Final runs: `npm test` 17/17 pass, `npm run e2e` 20/20 pass.

### Tests
- Unit, `test/filters.test.js` (`npm test`): matching (case, accents, Turkish i, special characters, trimming, whole phrase), status filtering and the AND of both, order and no mutation, URL parse and serialize (defaults, unknown status, duplicate parameters, encoding, round trip), and the count text.
- E2E, `e2e/filters.spec.js` (`npm run e2e`, desktop and mobile): search, status, both together, shared links (including `C++`), back/forward with the search-edit rule, a status change ending an edit, the empty state and reset, and a load error with filters in the URL.
- Added by /deep-test: `listView` (rows, count text and empty state for each filter state) and hand-typed links (`%`, `+`, spaces only); see [Unit test pass](#unit-test-pass-deep-test-2026-10-31).
- Added by /deep-ui-test: typing and picking a status before the data loads (held response), a link with an unknown status cleaned without a history entry, the hidden list box in the empty state, and input entered before the script runs; see [UI test pass](#ui-test-pass-deep-ui-test-2026-10-31).
- Added by /deep-ux: `emptyMessage` and the `filtered`/`message` fields of `listView` (unit); the empty-state text naming status and query, a query with markup shown as text, the Clear button, and the hidden list while loading and on a load error (e2e); see [UX review](#ux-review-deep-ux-2026-11-01).
- Added by /deep-review: the start-up test also opens a link that sets the control the user changes (E10); coming back two entries from another page shows that entry's status (form restore); focusing the box again starts a new edit and an edit that leaves the URL as it is adds no entry; forward hiding a focused Clear moves focus to the search box; Clear is hidden in the empty state (one button named "Clear search and filter"), also when it had focus; see [Review](#review-deep-review).

## Unit test pass (deep-test, 2026-10-31)

**Verdict:** proven at the code level; one case (typing before the data loads) needs a real browser and goes to /deep-ui-test.

### Scope
- Target: the uncommitted change against `3977a5a` (`public/lib/filters.js`, `public/app.js`, `public/index.html`, `public/styles.css`, `test/filters.test.js`, `e2e/filters.spec.js`) · Units: 5 helpers in `public/lib/filters.js` (a sixth, `listView`, added by this pass) plus the DOM wiring in `public/app.js` · Reference: Plan (R1–R11, edge cases), Decisions, Implementation notes.
- Test setup: unit tests with `node --test` (`npm test`, `test/*.test.js`); e2e with Playwright (`npm run e2e`), owned by /deep-ui-test. The repo's CI (`.github/workflows/verify.yml`) checks the skills repo only and runs neither suite.
- Baseline (2026-10-31, Node 26): `npm test` 17/17 pass, `npm run e2e` 20/20 pass. No pre-existing failures.
- Independent edge-case pass: skipped. The change is small (one 53-line helper module and about 80 lines of wiring), and the plan already ran a full edge-case sweep and a re-sweep after the answers.

### Change model
| Unit | Purpose (R#) | Inputs and sources | Invariants | Callers / modes |
|------|--------------|--------------------|------------|-----------------|
| `normalizeText` (`public/lib/filters.js:8-10`) | Case, accent and Turkish i folding (R1, R11, Search matching) | Issue titles from `data/issues.json` via `/api/issues` (a static file, every row has a string title); the query from the search box or the URL | Same folding on both sides; never throws on any string | `filterIssues` |
| `filterIssues` (`:19-27`) | Title search AND status filter (R1–R3) | `allIssues` (sorted by `sortByUpdated`); `{ q, status }` from the controls (always strings; the status is one of the four options) | Keeps input order, new array, input untouched; `all` or an unknown status keeps every status | `render` in `app.js` |
| `parseFilters` (`:30-37`) | Read filters from the URL (R5, URL format) | `location.search`: links the app wrote, shared links, hand-typed URLs, history entries | Never throws; `q` trimmed; status always one of `all` + the three keys | `app.js` start-up and `onPopState` |
| `serializeFilters` (`:41-47`) | Write filters to the URL (R5, URL format) | The current control values | Defaults left out (clean `/`); `parseFilters(serializeFilters(f))` gives `f` back for trimmed `q`; the output is what the browser reports back as `location.search`, which `updateUrl` relies on to skip no-op entries | `updateUrl` in `app.js` |
| `countLabel` (`:50-53`) | Count text (R4, Count text) | Row count, total, filtered flag from `render` | Shown number equals the rows rendered; noun follows the total | `render` |
| `app.js` wiring (`public/app.js:40-118`) | Render, history rule, reset, start-up (R4–R8, Back-button history, Loading and error) | DOM events (`input`, `change`, `focus`, `click`, `popstate`), `location.search`, `fetch('/api/issues')` | `render` does nothing until the data loads, then reads the live controls; one entry per search edit; a change that leaves the URL the same adds no entry | Desktop and mobile; loading, loaded, error states |

### Edge cases
Ranked by likelihood × impact. Tests are in `test/filters.test.js`.

| # | Case | Real path that produces it | Unit | Test | Result |
|---|------|----------------------------|------|------|--------|
| E1 | A space typed first, or a query of spaces only: count must read "24 issues" and no empty state | User types a space before the word, or deletes the word and leaves the space | `listView` (`public/lib/filters.js:60`), moved out of `render` | listView shows every issue and the plain count while no search or filter is active | pass |
| E2 | Hand-typed URL with a bare `%` (`/?q=100%`) or a broken escape must not throw (a throw at start-up leaves the page on "Loading…") | A user types or edits the link in the address bar | `parseFilters` | parseFilters reads a hand-typed link without throwing | pass |
| E3 | Typing or choosing a status before the data loads | Slow network (`Slow first load on 3G` is issue #120); the controls are live at once (Loading and error decision) | `render`, `onSearchInput`, `load` (`app.js:44-51, 67-70, 93-98`) | none: DOM wiring and timing, no unit harness; read: `render` returns until the data is in, then reads the live controls, and the URL updates at once | UI-only → deep-ui-test |
| E4 | Other Turkish letters (`ç`, `ş`, `ğ`, `ü`) typed without them | English keyboard; "calismiyor" for "çalışmıyor" (#115) | `normalizeText` | filterIssues ignores accents and Turkish dotted/dotless i (assertion added) | pass |
| E5 | No matches with both a search and a status | "csv" + Open | `listView` | listView shows the empty state only when a search or filter matches nothing | pass |
| E6 | Unfiltered list with no issues shows no empty state (non-goal, unchanged behaviour) | `data/issues.json` emptied | `listView` | listView shows the empty state only when a search or filter matches nothing | pass |
| E7 | A query of only spaces in a shared URL (`?q=%20%20`) gives an empty box | Hand-edited link | `parseFilters` | parseFilters reads a hand-typed link without throwing | pass |
| E8 | Hand-typed `?q=C++` reads as `C` (a `+` means space), accepted in the plan | Hand-typed link | `parseFilters` | parseFilters reads a hand-typed link without throwing | pass |
| E9 | Count text agrees with the rows in every state (R4) | Every state | `listView`, `countLabel` | listView counts the rows it shows while filtered | pass |

Ruled out:
- A missing or non-string title or status in the data: the API is the static `data/issues.json`, every row has string fields, and the plan changes neither.
- A query that folds to nothing (a lone combining mark): not typeable on the keyboards in play; dead keys produce spacing accents, which do not fold away.
- A status outside the four options reaching `filterIssues` or `render`: the `<select>` only holds the four values and `parseFilters` maps anything else to `all`.
- A total of 1 while filtered ("1 of 1 issue"): the dataset is a fixed 24 issues.
- Out-of-order responses: the data is fetched once.

### Test audit
Unit tests in `test/filters.test.js` (added by the implementation). `test/issues.test.js` covers units this change does not modify; kept as is. The e2e specs are audited by /deep-ui-test.

| Test | Verdict | Reason | Mutation check |
|------|---------|--------|----------------|
| filterIssues matches the title case-insensitively | Keep | R1, AC1 | caught: no `toLowerCase` |
| filterIssues ignores accents and Turkish dotted/dotless i | Update | Q2 guard; added "calismiyor" (E4), since a letter-by-letter map of `İ`, `ı`, `Ö` passed the old assertions | caught: no `ı` fold; a letter map in place of NFD (only with the new line) |
| filterIssues treats special characters literally | Keep | R11 | caught: regex match |
| filterIssues trims the query and treats whitespace-only as no search | Keep | Search scope | caught: no `toLowerCase` |
| filterIssues matches the whole phrase, not separate words | Keep | Search scope | caught: no `toLowerCase` |
| filterIssues filters by each status and returns everything for all | Keep | R2, AC2 | caught: AND → OR |
| filterIssues combines search and status | Keep | R3 | caught: AND → OR |
| filterIssues keeps the input order and does not mutate it | Keep | R8 | caught: AND → OR |
| parseFilters reads q and status from a query string | Keep | R5 | not run (the round trip guards the same reading) |
| parseFilters falls back to all for a missing, empty or unknown status | Keep | URL format | caught: `in` instead of `Object.hasOwn` |
| serializeFilters leaves out defaults and encodes special characters | Keep | URL format, R11 | caught: no trim |
| parseFilters and serializeFilters round-trip | Keep | R5, R11 | caught: decoding by hand |
| countLabel shows the total, or shown of total while filtered | Keep | R4, Count text | caught: noun follows the shown number |
| parseFilters reads a hand-typed link without throwing | Missing → added | E2, E7, E8 | caught: no trim of `q`; decoding by hand |
| listView shows every issue and the plain count while no search or filter is active | Missing → added | E1, R8 | caught: filtered flag without trim |
| listView counts the rows it shows while filtered | Missing → added | E9, R4 | caught: count uses the total as the shown number |
| listView shows the empty state only when a search or filter matches nothing | Missing → added | E5, E6, R7 | caught: empty state whenever no rows |

All 14 mutations were restored; `public/lib/filters.js` was compared byte for byte with its saved copy after each run.

### Bugs
- Fixed: none found.
- Code change for testability: the view logic of `render` (which rows, the count text, whether the empty state shows) moved unchanged into `listView` in `public/lib/filters.js:55-66`, per AGENTS.md ("logic that doesn't touch the DOM goes in `public/lib/`"); `render` (`public/app.js:44-51`) now only applies it to the DOM. Behaviour is the same: the e2e suite passes unchanged. The Plan's Changes table lists five helpers; this is the sixth.
- Open: none.

### Checks
| Check | Command | Result |
|-------|---------|--------|
| Unit tests | `npm test` | 21/21 pass (17 in `test/filters.test.js`, 4 in `test/issues.test.js`) |
| E2E (unchanged specs, re-run after the `render` change) | `npm run e2e` | 20/20 pass, desktop and mobile |
| Syntax | `node --check public/app.js`, `node --check public/lib/filters.js` | ok |
| Lint / format | none configured in this example | N/A |
| Skills repo check | `node scripts/check.mjs` (repo root) | ok |

### For deep-ui-test
- E3, typing before the data loads: hold `/api/issues` with `page.route`, type "csv" and pick Closed while the count still reads "Loading…", then release the response. Expect 1 row, "1 of 24 issues", URL `/?q=csv&status=closed`, and back stepping through the entries made before the load.
- E1 as the user sees it: typing a single space keeps "24 issues", no empty state, URL `/`.
- Keyboard on the status `<select>`: where arrow keys change a closed `<select>` directly (Chrome on Windows and Linux), each step fires `change` and so adds a history entry; not checked here (R10, Back-button history). Check and judge.
- The search box's clear button (×) clicked while the box is not focused: the focus ends any edit, so the clear gets its own entry; check that back brings the query back.
- Reload or return to a filtered page: the browser's restored form values must not override the URL (the `<select>` has no `autocomplete="off"`).

### Not verified
- E3 at runtime: checked by reading only; handed to /deep-ui-test above.

### Round 2 (2026-11-01, scoped re-run)

**Verdict:** proven at the code level. No bugs and no code or test changes. One e2e gap found: the start-up test doesn't cover a link and the user setting the same control. It goes to the e2e owner (see "For deep-ui-test" below).

#### Scope
- Units changed since round 1: the start-up code in `public/app.js:119-127` (changed by /deep-ui-test, Decisions round 2), plus `emptyMessage` (`public/lib/filters.js:58-63`) and the `filtered` and `message` fields of `listView` (`:69-79`), both added by /deep-ux (Decisions round 3). Round 1 cases on other units stand: their code is unchanged.
- Baseline: `npm test` 22/22 pass. No pre-existing failures.
- Independent edge-case pass: skipped. Three small units, and the plan and round 1 already ran full sweeps.
- File ownership: this pass could edit `test/` and `public/lib/` only, because /deep-ui-test round 2 ran at the same time. Mutation checks and browser probes ran on scratch copies, so the shared files never changed during either run.

#### Change model
| Unit | Purpose (R#) | Inputs and sources | Invariants | Callers / modes |
|------|--------------|--------------------|------------|-----------------|
| Start-up (`public/app.js:119-127`) | A shared link fills the controls without losing what the user entered while the script loaded (R5, Q9, Decisions round 2) | `location.search` (links, hand-typed URLs, history entries); `search.value` vs `search.defaultValue` (`''`, no `value` attribute in `public/index.html`); `statusFilter.value` vs `'all'` (the first `<option>`, no `selected`), set by the user before the module ran or restored by the browser | A control the user changed keeps its value. The other control follows the URL. The URL is rewritten with `replaceState` (no new entry) | Once per document load. Not on a bfcache restore (the module doesn't run again) |
| `emptyMessage` (`public/lib/filters.js:58-63`) | Empty-state text names what excluded the results (R7, Decisions round 3, UX Q1) | `{ q, status }` from the live controls via `listView` | Shows the query trimmed and as typed (not folded). The status label is lower-cased with `toLowerCase` (locale-independent, so "In progress" never becomes "ın progress"). Returns `''` when nothing is active. The text is plain and the page writes it with `textContent` | `listView` → `render` |
| `listView` `filtered`, `message` (`:69-79`) | Clear button visibility (UX Q6) and the empty-state text (UX Q1) | Same as round 1 | `filtered` agrees with the count text, because both come from the same flag. `empty` implies `filtered`. `message` is ignored while the empty state is hidden | `render` (`public/app.js:46-55`). Never runs before the data loads or after a load error, so Clear stays hidden then (`hidden` in the HTML) |

#### Edge cases
| # | Case | Real path that produces it | Unit | Test | Result |
|---|------|----------------------------|------|------|--------|
| E10 | A link sets a control and the user changes the same control before the script runs: the user's value must win | Opening `/?q=the&status=in_progress` on a slow network, then typing "csv" and picking Closed before `app.js` arrives | Start-up `:124-125` | e2e "what the user enters before the script runs is kept, and the link fills the rest" covers only a link without the control the user changed | **gap**: that test stays green when the link wins over a typed query or over a picked status (mutations U1, U2 below); for the e2e owner |
| E11 | The browser restores form values that differ from the entry's URL, and start-up now keeps them as "user-entered" (the `<select>` has no `autocomplete="off"`) | Reload; leave the page and come back with back/forward (no bfcache) | Start-up `:124-125` | none (browser behaviour, no unit harness); scratch Playwright probe | pass in Chromium and WebKit: after a reload, back after leaving, and back again (same-document, `popstate`), the controls always matched the URL. The restored value is the one saved at unload, which the app has already written to that URL. Firefox not run (not installed). **Later found failing** in Chromium for a two-step back from another page; fixed with `autocomplete="off"` on the `<select>`, see Review round 1 |
| E12 | The query is shown trimmed and as typed, not folded (`İstanbul`, markup) | Any search with no matches | `emptyMessage` | emptyMessage names the active status and the query | pass |
| E13 | Status only, nothing matches: "No closed issues." | A status link on a dataset with no issues of that status | `emptyMessage` | emptyMessage names the active status and the query | pass |
| E14 | A query of only spaces with or without a status: no quoted empty query | User types a space | `emptyMessage`, `listView` | emptyMessage names…; listView shows every issue and the plain count… | pass |
| E15 | Clear shows exactly while a search or filter is active, including status only and the empty state | Any filter state | `listView` `filtered` | listView counts the rows it shows while filtered; listView shows every issue and the plain count… | pass |
| E16 | Spaces typed before the script runs keep the box as typed and drop the link's query (the value differs from the default) | User clicks into the box and presses space during the script load | Start-up `:124` | none | as decided (Decisions round 2: "differs from its HTML default"); low likelihood. Noted, not raised |
| E17 | Typing continues across the moment the script runs: the box was focused before the listener existed, so the next keystroke pushes a new entry after the start-up `replaceState` (back shows the part typed before the script ran) | Typing while `app.js` arrives | Start-up, `onSearchInput` | none | accepted: one extra entry in a sub-second window; before round 2 the typed text was lost entirely. Noted for /deep-review |

Ruled out:
- `filtered` true for an unknown status while `filterIssues` shows everything (`filters.status !== 'all'` vs `isStatus`): the status always comes from the `<select>`, whose only values are the four options.
- The `<select>` default differing from `'all'`: the first option is All with no `selected` attribute. Only a markup change could cause it.

#### Test audit
| Test | Verdict | Reason | Mutation check |
|------|---------|--------|----------------|
| emptyMessage names the active status and the query | Keep | E12-E14, UX Q1 | caught: query shown folded (M1); query not trimmed (M2); status-only text empty (M3); label not lower-cased (M4) |
| listView shows every issue and the plain count while no search or filter is active | Keep | E14, E15 | caught: `filtered` always true (M6) |
| listView counts the rows it shows while filtered | Keep | E15, R4 | caught: `filtered` ignores the status (M5) |
| listView shows the empty state only when a search or filter matches nothing | Keep | E13, R7, `message` field | caught: `message` dropped (M7); `message` ignores the status (M8) |
| e2e "what the user enters before the script runs is kept, and the link fills the rest" (owned by /deep-ui-test) | Update (for the e2e owner) | E10: the core of Decisions round 2 ("keeps that value") isn't asserted when the link also sets that control | **survived**: U1 (`q: fromUrl.q !== '' ? fromUrl.q : search.value`) and U2 (the same for the status) |

M1-M8 ran against a scratch copy of `public/lib/` and `test/filters.test.js`. U1 and U2 ran against a scratch copy of the example, on port 4336, desktop project. In both cases the copy was compared byte for byte with the tree afterwards. The probe spec below fails under U1 and U2 and passes on the current code.

#### Bugs
- Fixed: none found.
- Open: none.

#### Checks
| Check | Command | Result |
|-------|---------|--------|
| Unit tests | `npm test` | 22/22 pass (unchanged) |
| Start-up e2e and probe (scratch copy) | `npx playwright test --project=desktop -g "before the script runs"` | 2/2 pass on the current code; the probe fails under U1 and U2 |
| Syntax | `node --check public/app.js`, `node --check public/lib/filters.js` | ok |
| Skills repo check | `node scripts/check.mjs` (repo root) | ok |
| Full e2e | not run here | owned by /deep-ui-test, which ran it in its round 2 (30/30) |

#### For deep-ui-test
- E10: extend the start-up test in `e2e/filters.spec.js` with a link plus the user's own values. This probe passed on the current code and failed under U1 and U2:
  ```js
  release = await holdScript(page); // after page.unroute('/app.js')
  await page.goto('/?q=the&status=in_progress', { waitUntil: 'commit' });
  await search(page).click();
  await search(page).pressSequentially('csv');
  await status(page).selectOption('closed');
  release();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', status: 'closed', url: '/?q=csv&status=closed' });
  ```
  Not added here: `e2e/` belonged to /deep-ui-test while both ran. /deep-review can add it as a straightforward fix.

#### Not verified
- E11 in Firefox: not installed here. It restores `<select>` values more eagerly than Chromium, so it is worth one manual check (reload a filtered page, leave it and come back).

## UI test pass (deep-ui-test, 2026-10-31)

**Verdict:** all requirements verified. One bug found (S23, typing before the script runs was lost), fixed per Q1 → A and re-verified.

### Scope
- Environment: local `PORT=4320 node server.mjs` (static `data/issues.json`, no backend beyond the file) · Roles: N/A (no auth) · Viewports: 375×812, 412×915 (Pixel 7), 768×1024, 1280×800, 1440×900, 1920×1080, 812×375, 200% zoom · Locales: N/A (English-only UI; the Turkish titles are data, covered by S9)
- Browser: the built-in browser pane for S1, S2 and exploration; scratch Playwright scripts (the repo's `@playwright/test` 1.57.0, Chromium) for held and delayed responses, history, viewports and the saved screenshots.
- Screens: the single list page (`public/index.html`): search box, status `<select>`, count, list, empty state; states loading, loaded, filtered, empty, error. Regression neighbours: none outside this page; on the page, the unfiltered list, the loading text and the load-error message (the change adds a global `[hidden]` rule and hides the `<ul>` when empty).
- Independent scenario pass: skipped. One screen, about 80 lines of wiring; the plan ran a full edge-case sweep and a re-sweep, and /deep-test handed over its UI cases.

### Requirements
| R# | Requirement | Rows | Status |
|----|-------------|------|--------|
| R1 | Search box filters by title | S1, S22 | verified |
| R2 | Status filter | S2 | verified |
| R3 | Search and status combine | S3 | verified |
| R4 | Count matches the rows | S1-S3, S7 | verified |
| R5 | Filters in the URL, shared links | S4, S5, S12, S18, S19 | verified |
| R6 | Back and forward | S6, S13, S20, S21 | verified |
| R7 | Empty state with one-click reset | S7, S21 | verified |
| R8 | Unfiltered behaviour unchanged | S8 | verified |
| R9 | Phone width | S24, S25 | verified |
| R10 | Labelled, keyboard usable | S16, S17 | verified (S15 native arrow keys: not verified) |
| R11 | Special characters and Turkish letters | S5, S9 | verified |
| Q9 | Usable while loading; error state | S10, S11, S23 | verified (S23 after the fix) |

### Scenario matrix
P1 requirement flows and bug-prone areas (history, timing, URL), P2 edge cases, P3 polish. Data is `existing` (the 24 issues in `data/issues.json`) unless the row says otherwise. Evidence files are in [12-search-and-filter-ui-test/](12-search-and-filter-ui-test/README.md); "script" means a scratch Playwright run recorded here.

| ID | P | R# | Scenario | Context | Data | Expected | Status | Evidence |
|----|---|----|----------|---------|------|----------|--------|----------|
| S1 | P1 | R1, R4 | Type "csv" | pane · 1440 | existing | 1 row "Export to CSV drops the last row", "1 of 24 issues", URL `/?q=csv` | pass | pane: as expected, focus stays in the box |
| S2 | P1 | R2, R4 | Pick Open, then In progress, then Closed | pane · 1440 | existing | 12 / 6 / 6 rows, each badge matches, "N of 24 issues" | pass | pane: 12 / 6 / 6, one badge text each, one history entry each |
| S3 | P1 | R3 | "the" with In progress | 1440 | existing | #105, #109, #117 newest first, "3 of 24 issues" | pass | `01-filtered-desktop.jpg` |
| S4 | P1 | R5 | Open `/?q=csv&status=closed` in a new context | 1440 | environment (URL) | "csv", Closed, 1 row | pass | script |
| S5 | P1 | R5, R11 | Type `C++`, `100%`, `&`, `€ vs ₺`, `İstanbul`; reload each | 1440 | existing | Each finds its issue; URL encoded; reload restores | pass | script: `/?q=C%2B%2B`, `/?q=100%25`, `/?q=%26`, `/?q=%E2%82%AC+vs+%E2%82%BA`, `/?q=%C4%B0stanbul`; #104, #105, #119, #109, #106 before and after reload |
| S6 | P1 | R6 | Open, type "fails", back, back, forward, forward | 1440 | existing | Steps per the Back-button decision; one `/api/issues` request | pass | script: 2 rows → 12 → 24 → 12 → 2; 1 request |
| S7 | P1 | R7 | `/?q=zzz`, click reset | 1440, 375 | environment (URL) | Empty state, no list box; reset → 24 rows, empty box, All, URL `/`, focus in the box | pass | `02-empty-state-desktop.jpg`, `07-phone-empty.jpg` |
| S8 | P1 | R8 | Plain `/`, then a load error | 1440 | existing; mocked response (500) | "24 issues", #105 first; error text unchanged | pass | script; the console shows the 500 and the logged `Error: HTTP 500`, as before the change |
| S9 | P1 | R11 | "istanbul", "odeme", "siralama", "calismiyor", "İSTANBUL" | 1440 | existing | #106, #102, #115, #115, #106 | pass | script |
| S10 | P1 | E3 | Type "csv" and pick Closed while `/api/issues` is held, then release | 1440 | environment (held response) | "Loading…" while held, URL updates at once; then 1 row; back steps through the entries made while loading | pass | `03-before-load-1-held.jpg`, `03-before-load-2-released.jpg`; back → `/?q=csv` (1 row) → `/` (24) |
| S11 | P1 | Q9 | Load error with `/?q=csv`, then type and pick a status | 1440 | mocked response (500) | Error text stays, no empty state, box keeps "csv"; changes update the URL only | pass | `04-load-error-with-search.jpg`; URL `/?q=csvx&status=open`, text unchanged, no new console error |
| S12 | P1 | R5 | Reload after changing filters; back then reload; leave to `/api/issues` and come back | 1440 | existing | Controls and rows follow the URL each time | pass | script: `/?q=fail&status=closed` (empty state), `/?q=fail` (2 rows) after back and after reload, `/?q=fail&status=open` on return |
| S13 | P1 | R6 | Click the box's clear (×) button while the box is not focused, then back | 1440 | existing | The clear gets its own entry; back brings "csv" back | pass | script; the pane's click missed the 10 px button, so this ran in Playwright |
| S14 | P2 | E1 | Type a single space, then "csv" | 1440 | existing | "24 issues", no empty state, URL `/`, no entry; "csv" then adds one entry | pass | script |
| S15 | P2 | R10 | Change the closed `<select>` with arrow keys | 1440 | existing | Judge per the Back-button decision | not verified | macOS Chromium opens the menu on arrow keys and the headless menu took no keys, so the value never changed. Windows/Linux Chrome fires `change` per arrow, and `onStatusChange` (`public/app.js:72-76`) then adds one entry per value passed; that matches the decision (each status change is an entry). Needs Chrome on Windows or Linux to see |
| S16 | P2 | R10 | Keyboard only on `/?q=zzz` | 1440 | environment (URL) | Search → status → reset; focus ring visible; Enter does not reload; Space on reset resets | pass | script: that order, each `:focus-visible` with Chrome's default ring; Enter: no navigation; Space: 24 rows, focus in the box |
| S17 | P2 | R10 | Accessible names and live count | 1440 | existing | searchbox "Search titles", combobox "Status", search landmark, `aria-live="polite"` count | pass | script (`ariaSnapshot`) |
| S18 | P2 | R5 | `/?status=blocked&q=`, `/?status=Open`, `/?foo=1&q=csv`, `/?status=closed&status=open`, `/?status=constructor` | 1440 | environment (URL) | Unknown → All; URL rewritten without a new entry | pass | script: `/`, `/`, `/?q=csv`, `/?status=closed`, `/`; no extra entries |
| S19 | P2 | R5 | `/?q=100%`, `/?q=C++`, `/?q=%20%20`, `/?q=%E0%A4%A` | 1440 | environment (URL) | No throw; `100%` finds #105; `C++` reads as "C" (accepted); spaces → empty box | pass | script: no page errors; `C++` gives "C", 17 rows, as accepted in the plan; a broken escape shows "�%A" and the empty state |
| S20 | P2 | R6 | Open, type "csv", Esc, back, back | 1440 | existing | Per Implementation notes: the first back shows no visible change | pass (as decided) | script: Esc → 12 rows at `/?status=open`; back → same; back → 24. For /deep-ux |
| S21 | P2 | R6, R7 | Reset, back, forward | 1440 | environment (URL) | Back → "zzz" with the empty state; forward → 24 | pass | script |
| S22 | P2 | timing | Fast typing; five status changes in a row; five resets in a row | 1440 | existing | The last value wins; repeated resets add one entry | pass | script: "export to csv" → 1 row; ends on Closed, 6 rows; resets add one entry |
| S23 | P1 | Q9 | Type "csv" and pick Closed while `app.js` is still loading | 1440 | environment (held `app.js`) | Typed text and status are kept and applied | pass after fix (failed before) | before: `05-before-script-1-typed.jpg`, `05-before-script-2-script-ran.jpg` (reproduced 3 times); after: `05-before-script-3-fixed.jpg`, 1 row, URL `/?q=csv&status=closed`, no history entry added |
| S24 | P1 | R9 | Filtered, empty and a 230-character query at 375, Pixel 7, 768, 1280, 1440, 1920, 812×375; tap reset on touch | each | existing | No horizontal scroll, nothing overlaps, empty state readable | pass | `06-phone-filtered.jpg`, `07-phone-empty.jpg`; no horizontal scroll anywhere; at 375 the status control wraps to its own line (search 343 px wide), at 412 and up both sit on one line; tap reset works |
| S25 | P3 | R9 | 200% zoom | 720×450 at 2× | existing | As at 768, no overflow | pass | script |
| S26 | P2 | integrity | Console and network over every row | all | – | No console errors except the logged load error in S8 and S11; one `/api/issues` request per page load | pass | script logs |

N/A sections of the checklist: roles, permissions and modes (no auth, flags or shared modes); locales (one UI language); analytics (none); persistence beyond the URL (nothing is saved); floating layers (none).

Observations for /deep-ux (not bugs; behaviour as decided or present before this change):
- S20: after clearing a search that started from no search, the first back shows no visible change (as the Implementation notes predicted).
- While loading and on a load error, the empty `<ul>` shows as a thin bordered strip under the toolbar (visible in `03-before-load-1-held.jpg`). The same strip shows on the base commit; this change hides the list only for the empty state.
- The status `<select>` is 38 px tall and the search box 36 px.
- At 375 px the status control drops to its own line, left-aligned under the full-width box (`06-phone-filtered.jpg`).

### Bugs
- Fixed: S23, typing before the script runs was lost. Minimal steps: hold `app.js` (slow network), type "csv" in the box and pick Closed, let the script load: the box emptied, Closed went back to All, all 24 issues showed, and the URL stayed `/`. Cause: start-up set both controls from the URL unconditionally (`applyFilters(parseFilters(location.search))`, then `public/app.js:116`), overwriting what the user entered while the module was loading. Fix per Q1 → A, `public/app.js:114-122`: a control whose value differs from its HTML default keeps it, the other comes from the URL, then `replaceState` as before. Regression test: e2e "what the user enters before the script runs is kept, and the link fills the rest" (an e2e test because the cause is start-up wiring against the DOM, which has no unit harness). Before/after: `05-before-script-1-typed.jpg`, `05-before-script-2-script-ran.jpg`, `05-before-script-3-fixed.jpg`.
  - Re-run after the fix, all pass with no console errors: S23, and the rows sharing the start-up code: S4 (shared link), S5 (typed special characters, reload restores), S12 (reload, back then reload, leave and return), S18 (unknown parameters cleaned without an entry); a shared link and an unknown status also re-checked in the browser pane.
- Open: none.

### Regression sweep
- Unfiltered list (`/`): 24 issues, newest first, count "24 issues" (S8); `e2e/list.spec.js` passes unchanged.
- Loading text: "Loading…" until the data arrives (S10).
- Load error: unchanged message, no empty state, controls still usable (S8, S11).

### E2E
Audit of `e2e/filters.spec.js` (the implementation's specs), plus the three tests this pass added. `e2e/list.spec.js` predates this work and is unchanged.

| Spec | Verdict | Covers |
|------|---------|--------|
| typing in the search box shows only matching titles | keep | R1, R4, AC1 |
| choosing a status shows only issues with that status | keep | R2, R4, AC2 |
| search and status filter combine | keep | R3 |
| a shared link restores the search, the status and the results | keep | R5, R11, AC3 |
| back and forward step through filter states | keep | R6, Back-button history |
| a status change ends the search edit, so the next keystroke adds an entry | keep | Back-button history (sets the value from a script on purpose, see Implementation notes) |
| no matches shows an empty state whose reset restores the full list | update: also asserts the list box is hidden (plan edge case "Empty list box") | R7, AC4 |
| a load error with filters in the URL shows the error, not the empty state | keep | Q9 |
| a link with an unknown status shows every issue and is cleaned without a history entry | new | R5, URL format (S18) |
| typing and picking a status before the issues load applies both once they arrive | new (from the mocked-data row S10) | E3, Q9 |
| what the user enters before the script runs is kept, and the link fills the rest | new (regression test for S23) | Q9, Typing before the script runs |

Mutation checks on the new and updated tests (each restored, `public/app.js` compared byte for byte afterwards): ignoring input before the data loads → the before-load test fails; dropping the start-up `replaceState` → the unknown-status test fails; making it `pushState` → the unknown-status test fails; not hiding the list when empty → the empty-state test fails. The S23 test fails on the code before the fix, when the search box always takes the URL's query, and when the status always takes the URL's status.

Not added: the clear (×) button (S13) needs a click at a pixel offset inside the input, which differs per platform; covered here by the script. A space-only query (S14) is covered by the `listView` and `serializeFilters` unit tests.

Run (after the fix): `npm run e2e` → 26/26 pass (13 tests × desktop and mobile); `npm test` → 21/21 pass; `node scripts/check.mjs` (repo root) → ok.

### Data
- Created: none. All rows use `data/issues.json` as served, URL parameters, or Playwright route handlers in scratch scripts (held, failed or delayed responses), which ended with each script.

### Not verified
- S15, arrow keys on a closed `<select>` in Chrome on Windows or Linux: needs one of those platforms; judged from the code and the decision above.
- Real touch devices: touch was emulated (Pixel 7 and 375×812 with touch); taps on reset worked.

### Questions (round 1)
- Q1 Typing before the script runs is lost → A (2026-11-01); see [Decisions](#decisions). Fixed, see Bugs.

### Round 2 (2026-11-01, scoped re-run after deep-ux)

**Verdict:** all rows touched by the UX changes verified; no bugs. One observation raised by deep-ux confirmed and left for /deep-review (S32: both resets show in the empty state, with the same accessible name).

#### Scope
- Rows: the ones the deep-ux changes touch (Decisions round 3, UX Q1-Q6) and their regression neighbours. Code changed since round 1: `public/lib/filters.js` (`emptyMessage`, `listView` `filtered`/`message`), `public/index.html` (`#empty-message`, `#clear-filters`, list `hidden`), `public/app.js` (`render`, Clear wired to `reset`), `public/styles.css` (`--control-border`, 40 px controls, `.field-search` 160px, `.header-meta`, `.link-button`). Round 1 rows not listed here touch none of that code and stand.
- Environment: local `PORT=4322 node server.mjs` (static `data/issues.json`) · Roles, locales: N/A as in round 1 · Viewports: 320×640 and 375×812 with touch at 2×, Pixel 7, 768×1024, 812×375 with touch, 1440×900.
- Browser: the built-in browser pane for S7, S30 and S31 (reset, Clear, back), and for the accessible-name check in S32; a scratch Playwright script (the repo's Playwright 1.57.0, Chromium) for held and failed responses, viewports, keyboard, history and the saved screenshots.
- Independent scenario pass: skipped (scoped re-run of six small changes on one screen).

#### Scenario matrix (round 2 rows)
New rows continue the round 1 numbering (S27-S32). Evidence files are in [12-search-and-filter-ui-test/](12-search-and-filter-ui-test/README.md); "script" means the scratch Playwright run.

| ID | P | R# / UX | Scenario | Context | Data | Expected | Status | Evidence |
|----|---|---------|----------|---------|------|----------|--------|----------|
| S7 | P1 | R7, Q1-Q3 | `/?q=zzz`, click (tap on the phone) the empty-state reset | pane · 1440, 375 touch | environment (URL) | "No issues match “zzz”.", no list box; reset → 24 rows, empty box, All, URL `/`, focus in the box, Clear hidden | pass | pane and script: as expected at both sizes, one history entry added; `11-r2-phone-375-empty.jpg` |
| S27 | P1 | R7, Q1 | Empty-state text per filter: `/?q=csv&status=open`, `/?q=zzz&status=in_progress`, `/?q=%20zzz%20`, `/?q=%3Cb%3Ezzz%3C%2Fb%3E`, a 230-character query; status only with no matches | 1440, 375, 320 | environment (URL); status only: mocked response (the 18 issues of `data/issues.json` that are not closed, a set the API can return) | "No open issues match “csv”.", "No in progress issues match “zzz”.", trimmed query, markup shown as text, long query wraps inside the box, "No closed issues." | pass (status-only text with mocked data) | script: each text as expected; `%20zzz%20` rewritten to `/?q=zzz`; no `<b>` element; the long query wraps at 1440, 375 and 320 with no overflow; status only: "No closed issues.", "0 of 18 issues"; `08-r2-empty-state-both-resets.jpg`, `14-r2-phone-long-query.jpg`. Unverified with mocked data: only that the real API returns such a set (it serves the file as is) |
| S28 | P2 | Q2 | Control borders | 1440, Pixel 7 | existing | Search box, status control and reset button `rgb(133, 133, 128)`; list card and empty-state box keep `--border` | pass | script: the three controls `rgb(133, 133, 128)`; list card and empty-state box `rgb(226, 226, 221)` |
| S29 | P2 | Q3 | Control heights | 1440, Pixel 7 | existing | Input, select and reset button 40 px each, bottom edges aligned | pass | script: 40 / 40 / 40 px, input and select bottoms equal (129 px) on both; Clear 26 px tall (above the 24 px minimum) |
| S24 | P1 | R9, Q4, Q6 | Filtered, empty, error and a 230-character query at 320, 375, Pixel 7 (412), 768, 1440, 812×375 | each | existing; mocked response (500) | No horizontal scroll; one toolbar row from 375 (wraps at 320); header with count and Clear fits | pass | script, 24 combinations: no horizontal scroll, no header overlap; one toolbar row at 375 and up (search 207 px at 375, first issue at 146 px), wraps at 320 as predicted (first issue at 219 px); `12-r2-phone-320-filtered.jpg`, `11-r2-phone-375-empty.jpg`. Observation: at 320 to 412 the load-error text wraps to two lines beside the title, close above the "Search titles" label (`13-r2-phone-320-load-error.jpg`); same markup and styles as the base commit, not a regression |
| S10 | P1 | E3, Q5, Q6 | Hold `/api/issues`, type "csv", pick Closed, release | 1440 | environment (held response) | No list box and no Clear while held; after release 1 row, Clear shown; back steps through the entries made while loading | pass | script: held → "Loading…", list and Clear hidden, URL `/?q=csv&status=closed`; released → 1 row, Clear shown; back → `/?q=csv` (1 row, Clear) → `/` (24, no Clear); 1 request; `09-r2-loading-held.jpg` |
| S11 | P1 | Q9, Q5, Q6 | Load error with `/?q=csv`, then type and pick a status | 1440, 375 | mocked response (500) | Error text, no list box, no empty state, no Clear; box keeps "csv"; changes update the URL only | pass | script: as expected at both sizes; after typing "x" and picking Open: URL `/?q=csvx&status=open`, error text unchanged, Clear still hidden; `13-r2-phone-320-load-error.jpg` |
| S8 | P1 | R8, Q5, Q6 | Plain `/` | 1440 | existing | List shown after load, "24 issues", #105 first, no Clear | pass | script |
| S30 | P1 | Q6 | Clear while results show: `/?q=login&status=open`, `/?q=csv`, `/?status=closed`; click (tap on the phone) Clear | pane · 1440, 375 touch | environment (URL) | Clear shown in each; click → 24 rows, empty box, All, URL `/`, focus in the box, Clear hidden | pass | pane (`/?q=login&status=open`) and script (all three, plus tap at 375): as expected, one history entry each, one request per page load |
| S31 | P1 | R6, Q6 | Type "csv", Clear, back, forward, type "fail", back ×3 | pane · 1440 | existing | Clear adds one entry; back → the filtered state with Clear shown; forward → 24; typing after Clear starts a new entry | pass | pane: Clear then back → `/?q=login&status=open` with Clear. Script: Clear → `/`; back → `/?q=csv` (1 row, Clear shown); forward → `/`; "fail" → `/?q=fail` (2 rows); back → `/` → `/?q=csv` → `/`; 1 request |
| S32 | P2 | R7, Q6 | Empty state shows both resets (`/?q=zzz`) | pane · 1440 | environment (URL) | Report only (deep-ux observation) | observed, not changed | Both show: "Clear" after the count and "Clear search and filter" in the empty state (`08-r2-empty-state-both-resets.jpg`). The accessibility tree has two buttons named "Clear search and filter" (pane `find`; Playwright `getByRole('button', { name: 'Clear search and filter' })` matches 2), so a screen-reader user's buttons list shows the same name twice. Each works alone: Clear in the empty state also resets to `/` with focus in the box. Follows the picked UX Q6 ("shown while a search or filter is active"); see Observations |
| S16 | P2 | R10, Q6 | Keyboard only on `/?q=zzz` and `/?q=csv` | 1440 | environment (URL) | Tab order with Clear included; focus ring visible on Clear; Enter and Space on Clear reset; Enter in the box does not reload | pass | script: Tab order Clear → search → status → reset, each `:focus-visible` with Chrome's default ring; Enter and Space on Clear → `/`, 24 rows, focus in the box; Enter in the box: no navigation, no new request; `10-r2-clear-focused.jpg` |
| S17 | P2 | R10, Q6 | Accessible names | 1440 | existing | Clear's name contains its visible text; count stays `aria-live="polite"` | pass | script (`ariaSnapshot`): `button "Clear search and filter": Clear` (name contains the visible "Clear", WCAG 2.5.3); count `aria-live="polite"`; searchbox, combobox and search landmark unchanged |
| S23 | P1 | Q9, Q6 | Type "csv" and pick Closed while `app.js` is held | 1440 | environment (held `app.js`) | Kept as in round 1; list hidden until data, Clear shown after | pass | script: before the script runs, list and Clear hidden, "Loading…"; after → `/?q=csv&status=closed`, 1 row, Clear shown, no history entry added |
| S26 | P2 | integrity | Console and network over every row | all | – | No console errors except the logged load error; one `/api/issues` request per page load | pass | script: the only console errors are the 500 and the logged `Error: HTTP 500` in the load-error runs (S11, S24 error); no page errors |

#### Observations (not bugs)
- S32, both resets in the empty state with the same accessible name: as deep-ux raised, left as is because it follows the picked option. Options for /deep-review if it wants a change: hide Clear while the empty state shows (`clearButton.hidden = !view.filtered || view.empty` in `render`, `public/app.js`), or keep both and give Clear a distinct name. Not changed here.
- S24, load error at phone widths: the two-line error text sits close above the "Search titles" label; unchanged from the base commit.

#### Bugs
- None.

#### E2E
| Spec | Verdict | Covers |
|------|---------|--------|
| the empty state names the status and the query, and shows a query from a link as text (deep-ux) | keep | Q1 |
| the Clear button shows while filtered and restores the full list (deep-ux) | keep | Q6, one history entry |
| no matches shows an empty state whose reset restores the full list (text updated by deep-ux) | keep | R7, Q1 |
| a load error with filters in the URL shows the error, not the empty state (list and Clear hidden, deep-ux) | keep | Q9, Q5, Q6 |
| typing and picking a status before the issues load applies both once they arrive | update: also asserts Clear is hidden while loading and shown once the data is in | E3, Q5, Q6 |

Mutation checks (scratch scripts that serve a mutated `app.js` through `page.route`, so the shared files were never changed while /deep-test ran): setting Clear before the "no data yet" guard in `render` → the updated held-response assertion fails; showing Clear from the URL at start-up → the load-error test's Clear assertion fails.

Not added: the S32 duplicate name (a decided behaviour, not a contract to lock); layout measurements (S24, S28, S29) are brittle as e2e assertions and are recorded here.

Run: `npx playwright test --output <scratch>` (scratch output folder so the parallel /deep-test run's `test-results/` stays untouched) → 30/30 pass (15 tests × desktop and mobile). `node scripts/check.mjs` (repo root) → ok. Unit tests: owned by the parallel /deep-test run; not run here.

#### Data
- Created: none. URL parameters, `data/issues.json` as served, and Playwright route handlers (held, failed or filtered responses, mutated `app.js`) that ended with each script.

#### Not verified
- Real touch devices: touch emulated (375 and 320 with touch, Pixel 7); taps on reset and Clear worked.
- S15 from round 1 (arrow keys on a closed `<select>` in Chrome on Windows or Linux) is untouched by these changes and stays not verified.

## UX review (deep-ux, 2026-11-01)

**Summary:** The page is easy to understand at first sight and every ticket task is done without help. The biggest problem is the empty state: with a search and a status together it says "No issues match your search." even when the search alone has matches, so a lead can read it as "no such issue exists". The rest is S-sized: form-control borders below the WCAG contrast minimum, a 2 px height mismatch, a two-row toolbar on phones, an empty list strip while loading, and no one-step reset while results show.

### Scope
- Screens: the list page (`public/index.html`) as changed by this work: search box, status `<select>`, count, list, empty state · Compared with: the page's existing parts (header, count, list card, status badges); the app has no other screens · Persona: the team lead from the ticket, on a mixed Turkish/English team
- Contexts: browser pane at about 800 px and 375×812 (prototypes); Playwright 1440×900 and 375×812 with touch (evidence); states loaded, filtered, empty, loading (held `/api/issues`) and load error (from the UI test pass, `04-load-error-with-search.jpg`). Roles, modes and locales: N/A (no auth, one UI language) · Independent pass: skipped: one screen with one toolbar and one empty state
- Context docs: no app overview or design-system docs exist; the conventions are `AGENTS.md`, the existing page and the [Decisions](#decisions). Suggestions that revisit a decision say so.

### First impressions
| Screen | What it seems to be for | Main action seen | Matches intent? |
|--------|-------------------------|------------------|-----------------|
| List page | A list of issues, newest first, with their status | Search the titles; narrow by status | Yes |

### Tasks
| Task | Done? | Friction |
|------|-------|----------|
| T1 Find the issue about CSV export ("csv") | yes | none: one row, "1 of 24 issues", focus stays in the box |
| T2 See everything in progress | yes | none beyond the two clicks a native `<select>` takes (decided, Status filter control) |
| T3 Find the Turkish payment issue from an English keyboard ("odeme") | yes | none |
| T4 Check whether an open CSV issue exists ("csv" + Open) | yes | the empty state says "No issues match your search."; nothing says the status is what excludes the closed CSV issue (Q1) |
| T5 From a shared link `/?q=login&status=open`, get back to the full list | yes | two separate actions (clear the box, set All); the one-click reset exists only in the empty state (Q6) |
| T6 T1-T4 at 375 px with touch | yes | the toolbar takes two rows; the first issue starts at 213 px (Q4) |

### Suggestions
Ranked within severity; no item blocks a task. Evidence files are in [12-search-and-filter-ux/](12-search-and-filter-ux/README.md). Measurements are from the running page.

**Q1. The empty state doesn't say what excluded the results** — friction, effort S, empty state
What happens: "csv" with Open shows "No issues match your search." although "csv" alone finds one (closed) issue; a lead can conclude there is no CSV issue at all (`01-empty-state-before.jpg`). The button reads "Clear search and filter" even when only one of them is set. Principle: empty states say why they are empty (heuristics §1). Contradicts the Empty state decision (default Q7): "the message never repeats the typed query, so a shared link cannot inject markup". Worth revisiting: the page writes text with `textContent` only, so repeating the query injects nothing.
- **A. Name the active status and query: "No open issues match “csv”." (Recommended)** — says exactly what to change; built in `public/lib/filters.js` (`listView`) with a unit test, written with `textContent`; status only: "No open issues."; search only: "No issues match “zzz”." Button text unchanged. Prototype: `01-empty-state-after.jpg`.
- B. Generic copy that covers both: "No issues match your search and filter." while both are active, today's text otherwise — keeps the decision, but still doesn't say which control to change.
- C. Keep as is — the lead has to notice the status control to understand an empty result.

**Q2. Form-control borders are nearly invisible** — friction (accessibility), effort S, toolbar and empty-state button
What happens: the search box, the status control and the reset button use `--border` (`#e2e2dd`): 1.30:1 against the white control and 1.21:1 against the page, so the empty search box reads as a white patch rather than a field (`02-controls-before.jpg`). Principle: WCAG 2.2 1.4.11, UI component boundaries 3:1 (heuristics §7). The list card can keep its light border: it is decoration, not a control.
- **A. A `--control-border: #858580` token for the input, select and reset button (Recommended)** — 3.71:1 on white, 3.46:1 on the page; same hue family as `--muted`; the list card and rows unchanged. Prototype: `02-controls-after.jpg` (shown together with Q3).
- B. Use `--muted` (`#5f5f5a`, 6.42:1) — no new token, but the controls then outweigh the list.
- C. Keep as is — fails 1.4.11; low-vision users have trouble finding the box.

**Q3. The status control is 2 px taller than the search box** — polish, effort S, toolbar
What happens: 38 px vs 36 px side by side, so their bottom edges don't line up (`02-controls-before.jpg`; noted in Implementation notes step 5 and the UI test pass). Principle: repeated items share sizes (heuristics §2, §9).
- **A. Give the input, the select and the reset button `box-sizing: border-box; height: 2.5rem` (Recommended)** — all 40 px, edges aligned on every platform. Prototype: `02-controls-after.jpg`.
- B. The same with `2.75rem` (44 px), the recommended touch size — heavier on desktop for a small gain.
- C. Keep as is — a visible misalignment in the page's only toolbar.

**Q4. On phones the status control drops to its own line** — polish, effort S, toolbar at phone width
What happens: at 375 px the search box takes the full row (`flex-basis: 240px` does not fit beside the 124 px select) and the status control sits alone, left-aligned underneath; the first issue starts at 213 px (`03-phone-toolbar-before.jpg`; noted in the UI test pass). Principle: the phone layout keeps the content first (heuristics §8).
- **A. One toolbar row: lower the search box's `flex-basis` to 160px (Recommended)** — both fit on one line from about 330 px wide up; search box 207 px wide at 375; the first issue moves up to 146 px; no horizontal scroll. Prototype: `03-phone-toolbar-after.jpg` (with Q2 and Q3 applied).
- B. Stack both controls full width — tidy column, but the toolbar grows taller than today.
- C. Keep as is — 67 px less list above the fold on every phone visit.

**Q5. An empty bordered strip shows while loading and on a load error** — polish, effort S, loading and error states
What happens: before the data arrives (and after a failed load) the empty `<ul>` renders as a 2 px bordered line under the toolbar (`04-loading-before.jpg`; noted in the UI test pass). It is present on the base commit too; this work hides the list only for the empty state. Principle: loading looks like what's coming, no stray chrome (heuristics §5, §9).
- **A. Start the list `hidden` in the HTML; `render` shows it once the data is in (Recommended)** — one attribute; on a load error it stays hidden, as the empty state does. Prototype: `04-loading-after.jpg`.
- B. Skeleton rows while loading — closer to the coming layout, but new markup and styles for a load that takes milliseconds locally; outside this ticket.
- C. Keep as is — a stray line on every slow load.

**Q6. No one-step reset while results show** — friction, effort S, toolbar and count
What happens: on `/?q=login&status=open` (a shared link) the way back to all 24 issues is two actions: clear the box (Chrome's × or select-and-delete) and set Status to All. The one-click reset only appears in the empty state (`05-clear-before.jpg`). Principle: filters are visible and easy to reset (heuristics §3).
- **A. A "Clear" text button after the count, shown only while a search or filter is active, doing what the empty-state reset does (Recommended)** — next to "1 of 24 issues", where the narrowed state is already stated; new `data-testid="clear-filters"`; `listView` reports whether filters are active. Prototype: `05-clear-after.jpg`.
- B. The same button at the end of the toolbar — near the controls, but a third item that wraps on phones.
- C. Keep as is — two actions, and the status reset is easy to forget.

**Q7. After clearing a search, the first back shows no change** — polish, effort M, history
What happens: from no search, type "csv" then clear the box: the edit's history entry now equals the one before it, so the first back changes nothing visible (UI test S20; predicted in Implementation notes step 4). Follows the Back-button history decision. Principle: every action gets visible feedback (heuristics §3).
- **A. Keep as is (Recommended)** — rare (type, then clear completely, then press back), costs one extra back, and matches the decided rule; a fix touches the history logic all of R6's tests rely on.
- B. When an edit brings the URL back to the entry before it, drop the edit's entry (`history.back()` instead of `replaceState`) — removes the dead step, but `back()` is asynchronous and adds new interleaving cases with typing; would go through /deep-plan.
- C. Push only after a pause (the rejected Q1 option B) — revisits a decision for a minor case.

Considered and not raised: search covering assignees or ids (a non-goal; the label says "Search titles"); the native `<select>` and the count wording (decided, and they work); focus rings (Chrome's default ring is visible on every control, UI test S16); text and badge contrast (muted text 5.99:1 on the page, badges 4.63:1 or more); target sizes (36 px or more, above the 24 px minimum).

### Bugs noticed (for deep-ui-test)
- None. No console errors during the walk or the evidence runs.

### Questions (round 1)
Q1-Q7 above, asked 2026-11-01; all answered A ("All recommended") the same day; see [Decisions](#decisions), round 3.

### Decisions (after answers)
- Implemented (all S, inside this ticket's page):
  - Q1 empty-state text → `public/lib/filters.js` (`emptyMessage`; `listView` returns `filtered` and `message`), `public/index.html` (`#empty-message`), `public/app.js` (`render` writes it with `textContent`), `public/styles.css` (`overflow-wrap: anywhere` on the message, since it now holds the query).
  - Q2 and Q3 → `public/styles.css` (`--control-border`, `box-sizing`, `height: 2.5rem`).
  - Q4 → `public/styles.css` (`.field-search { flex: 1 1 160px }`).
  - Q5 → `public/index.html` (`<ul … hidden>`).
  - Q6 → `public/index.html` (`#clear-filters`, `data-testid="clear-filters"`, accessible name "Clear search and filter", which contains the visible "Clear"), `public/app.js` (shown from `view.filtered`, calls `reset`), `public/styles.css` (`.header-meta`, `.link-button`). Coloured `--text` with an underline rather than the prototype's blue: `--open` (`#1f6feb`) is 4.32:1 on the page background, below 4.5:1.
- For /deep-plan: none.
- Rejected: none. Q7 kept as is by choice (recorded in Decisions).
- Tests: unit `npm test` 21 → 22 (new `emptyMessage names the active status and the query`; the three `listView` tests updated for the new fields). E2E `npm run e2e` 26 → 30 (15 tests × desktop and mobile): new "the empty state names the status and the query, and shows a query from a link as text" and "the Clear button shows while filtered and restores the full list"; updated the empty-state test's text, the load-error test (list and Clear hidden) and the held-response test (list hidden while loading). The Plan's `e2e/list.spec.js` stays unchanged and passes.
- Mutation checks (each restored, files compared byte for byte): Clear always hidden → the Clear test fails; message written with `innerHTML` → the markup test fails; list not hidden at start → the held-response and load-error tests fail; `emptyMessage` ignoring the status → 2 unit tests fail.
- Browser check: the browser pane at about 800 px (empty state for "csv" + Open, Clear resets to `/` with 24 rows and focus in the search box, both controls 40 px), and Playwright at 320, 375 and 412 px with touch: no horizontal scroll at any width; one toolbar row from 375 px (first issue at 146 px), the status control wraps below at 320 px as predicted; tapping Clear works; a 120-character query in the empty state wraps inside the box; Clear is 26 px tall; no console errors. Evidence: `10-implemented-empty-state.jpg` to `13-implemented-phone.jpg`.
- Observation for /deep-review: in the empty state both resets show (Clear in the header and the empty-state button), with the same accessible name. This follows the picked option ("shown while a search or filter is active"); hiding Clear while the empty state shows would be a one-line change if the review prefers it.
- Checks: `node --check` on `public/app.js` and `public/lib/filters.js` ok; `node scripts/check.mjs` (repo root) ok; no linter or formatter configured in this example.

## Review (deep-review)

### Round 1 (2026-11-01)

**Verdict:** ready for PR. The two open items were answered (see "After the answers" at the end of this round). Every requirement is implemented and tested. The review found 6 problems and fixed them: 3 bugs, 2 test gaps and 1 doc correction.

#### Scope
- Base: `3977a5a` · Diff: `git diff 3977a5a -- examples/issue-list/` (`docs/README.md`, `public/app.js`, `public/index.html`, `public/styles.css`) plus the untracked `public/lib/filters.js`, `test/filters.test.js`, `e2e/filters.spec.js` and `docs/features/` · Everything is uncommitted.
- Reference: the ticket, this doc's Plan (R1-R11), Decisions rounds 1-3, the Implementation notes, and the deep-test, deep-ui-test and deep-ux sections.
- Reviewers: own pass, plus an independent agent briefed with the scope and the reference only. The agent reported 9 findings. 7 were confirmed (two reproduced here in Playwright WebKit and Chromium), 1 stays plausible and goes to the user (Q2), and 1 was rejected (the live region, below). The agent was cut off once by a usage limit and restarted.

#### Requirements
| R# | Requirement | Implemented | Tested by | Status |
|----|-------------|-------------|-----------|--------|
| R1 | Search by title | `public/lib/filters.js:8-27`, `public/app.js:91-94` | unit "filterIssues matches the title case-insensitively"; e2e "typing in the search box shows only matching titles" | done |
| R2 | Status filter | `public/index.html:25-30`, `filters.js:19-27` | unit "filterIssues filters by each status…"; e2e "choosing a status shows only issues with that status" | done |
| R3 | Search AND status | `filters.js:22-26` | unit "filterIssues combines search and status"; e2e "search and status filter combine" | done |
| R4 | Count matches rows | `filters.js:50-53`, `:69-79` | unit `countLabel`, `listView` tests; e2e `expectState` in every test | done |
| R5 | Filters in the URL | `filters.js:30-47`, `app.js:71-89`, `:139-147`, `index.html:21`, `:25` | unit parse/serialize and round trip; e2e shared link, unknown status, coming back to an earlier entry, start-up | done |
| R6 | Back and forward | `app.js:91-106`, `:130-132` | e2e "back and forward…", "a status change ends the search edit…", "focusing the box again starts a new edit…" | done |
| R7 | Empty state and reset | `filters.js:58-79`, `index.html:34-37`, `app.js:108-115` | unit `emptyMessage`, `listView`; e2e "no matches shows an empty state…", "the empty state names…" | done |
| R8 | Unfiltered list unchanged | `filters.js:71` | `e2e/list.spec.js` (unchanged); unit "listView shows every issue and the plain count…" | done |
| R9 | Phone width | `public/styles.css` | every e2e on the Pixel 7 project; layout in UI test S24 | done |
| R10 | Labelled, keyboard, test ids | `index.html:13-37` | e2e locators by `data-testid`; names and keyboard path verified in the browser (UI test S16, S17), not in e2e | done |
| R11 | Special characters, Turkish letters | `filters.js:8-10`, `:41-47` | unit special characters, Turkish folding, round trip; e2e `C++` link | done |

Plan deviations, all recorded in earlier sections and justified:
- `listView` is a sixth helper, added in deep-test round 1.
- `emptyMessage`, the Clear button and the list starting `hidden` come from Decisions round 3.
- The start-up rule that keeps what the user entered comes from Decisions round 2.
- The start-up URL rewrite also drops parameters the app doesn't use (Implementation notes, step 4).

No scope creep found.

#### Interactions between decisions
| Decisions that meet | Element | Result |
|---------------------|---------|--------|
| Start-up keeps a control the user changed (round 2) × the browser restoring form values | status `<select>` | **broken, fixed:** Chromium restored a later status after a two-step back from another page (F2) |
| One history write per keystroke (round 1) × Safari's history-write limit | URL, list | **broken, fixed:** the list stopped updating (F1) |
| Clear hidden when nothing is filtered (UX Q6) × back/forward (R6) | Clear button, focus | **broken, fixed:** focus dropped to the page (F3) |
| Clear while filtered (UX Q6) × the empty-state reset (Q7 default) | empty state | two buttons with the same name → Q1 |
| Reset focuses the search box (Q7 default) × Clear tapped on a phone (UX Q6) | search box, phone keyboard | plausible: the keyboard opens over the list → Q2 |
| Empty-state message names the query (UX Q1) × only the count is `aria-live` (plan) | empty state, count | fine: "0 of 24 issues" is announced. A live message would announce twice on every keystroke (rejected finding) |
| List starts hidden (UX Q5) × load error (Q9) | list | fine, covered by e2e |
| Clear waits for the data (UX Q6) × typing before the data loads (E3) | Clear | fine, covered by e2e |
| Start-up rule (round 2) × typing while the script loads (E17) | history | accepted: one extra entry in a sub-second window |
| Search-edit rule (round 1) × clearing the box (UX Q7, kept) | history | as decided |

#### Fixed during review
- **F1 (bug):** `public/app.js:71-89`.
  - Problem: Safari and every iOS browser throw on the 101st `pushState`/`replaceState` call within 10 seconds. The throw skipped `render`, so the box showed "csv" while the list still showed all 24 issues. Reproduced in Playwright WebKit: type and delete "export to cs" six times, then type "csv".
  - Fix: `updateUrl` catches the error and returns false, so the list still renders. (Round 2 correction: "the next write catches the URL up" was wrong when no write followed; a retry now sets the URL.)
  - Verified: the same WebKit run now shows 1 row and no page error. There is no e2e for it, because both e2e projects are Chromium.
- **F2 (bug, R5):** `public/index.html:25`.
  - Problem: from `/`, pick Open, then Closed, open another page, then go back two entries. Chromium showed `/?status=open` in the URL but restored Closed after the script ran, so 6 closed rows showed. This disproves the deep-test round 2 E11 result for this path.
  - Fix: `autocomplete="off"` on the `<select>`, as the search box already had.
  - Verified: the probe now matches the URL in Chromium and WebKit. New e2e: "coming back to an earlier entry from another page shows that entry's status, not a later one".
- **F3 (bug, accessibility):** `public/app.js:48-64`.
  - Problem: when Clear or the empty-state reset had keyboard focus and back/forward hid it, focus fell to the page.
  - Fix: `render` moves focus to the search box, which is where a reset sends it.
  - Test: an assertion added to "the Clear button shows while filtered and restores the full list".
- **F4 (test, E10 from deep-test round 2):** the start-up e2e now also opens `/?q=the&status=in_progress`, types "csv" and picks Closed before the script runs, and expects the user's values. This is the probe recorded under "Unit test pass → Round 2 → For deep-ui-test".
- **F5 (test, round 1 history rule):** new e2e "focusing the box again starts a new edit, and a change that leaves the URL as it is adds no entry". Before this, nothing failed when either rule was removed.
- **F6 (docs):** the E11 row now records the failing case. Line references in earlier sections are as of their round. The current spans are in the Requirements table above (updated in round 2).

Mutation checks ran on a scratch copy of the example, desktop project, and the copy was compared byte for byte afterwards. Each new or extended test failed under its mutation:
- `autocomplete="off"` removed: the restore test fails.
- The focus listener emptied: the focusing test fails.
- The unchanged-URL check removed: the focusing test fails.
- The focus move removed: the Clear test fails.
- U1 (the link's query wins): the start-up test fails.
- U2 (the link's status wins): the start-up test fails.

#### Needs the user's decision
**Q1. Two "Clear search and filter" buttons in the empty state (S32)** — low, confirmed. With `/?q=zzz`, the header shows Clear (accessible name "Clear search and filter", `public/index.html:15`) and the empty state shows its reset button with the same name (`:36`). A screen reader's list of buttons shows the name twice. Each button works. This follows UX Q6 as picked ("shown while a search or filter is active").
- **A. Hide Clear while the empty state shows (Recommended)** — one reset per state, and the empty-state button is the larger target. One line in `render` (`clearButton.hidden = !view.filtered || view.empty`), with e2e assertions updated. This narrows UX Q6 to "while filtered and results show".
- B. Keep both and give Clear its own name, e.g. "Clear and show all issues". The name still contains the visible "Clear" (WCAG 2.5.3). Two different names, no layout change.
- C. Keep as is — matches Q6 as picked, but the name is duplicated.

**Q2. Tapping Clear on a phone opens the keyboard** — low, plausible (not observable in headless emulation). Both resets focus the search box (`public/app.js:114`, from the round 1 Empty state default). On a phone, that focus inside the tap handler usually opens the keyboard over the full list the user just asked for.
- **A. Keep as is (Recommended)** — one decided focus target for both resets, and keyboard users land where they type next. On a phone it costs one tap to close the keyboard.
- B. Clear moves focus to the count (`tabindex="-1"`) and the empty-state reset keeps the search box — no keyboard after Clear, but two different focus targets.
- C. Skip the focus on touch devices (`matchMedia('(pointer: coarse)')`) — no keyboard on phones, at the cost of a device check.

#### Rejected or kept
- The empty-state message is not a live region (independent finding, plausible). The count already announces "0 of 24 issues". Making the message live would announce twice on every keystroke while nothing matches. Kept.
- E17, an extra history entry when typing spans the script load: accepted as deep-test round 2 judged it. The sub-second window is far better than losing the text.

#### Checks
| Check | Command | Result |
|-------|---------|--------|
| Unit | `npm test` | 22/22 pass |
| E2E | `npx playwright test` (scratch `--output`) | 34/34 pass (15 tests in `e2e/filters.spec.js` and 2 in `e2e/list.spec.js`, × desktop and mobile) |
| Syntax | `node --check public/app.js`, `node --check public/lib/filters.js` | ok |
| WebKit and Chromium probes (F1, F2) | scratch Playwright script against `PORT=4345 node server.mjs` | fail before the fixes, pass after |
| Lint / format / typecheck | none configured in this example (no build step, per `AGENTS.md`); none added | N/A |
| Skills repo check | `node scripts/check.mjs` (repo root) | ok |

#### Docs
- Updated in this doc: Resume here, the header status, the E11 row, the Tests list under Implementation notes, and this section. `docs/README.md` already lists this doc; `README.md` and `AGENTS.md` need no change. The evidence READMEs list exactly the files present.

#### Not verified
- Firefox form restore (E11): the Playwright Firefox build in the local cache didn't launch, so it was not run. The `autocomplete="off"` from F2 is the attribute Firefox uses to skip restoring a control, so this path is now probably covered.
- Real Safari and iOS for F1: verified in Playwright WebKit only.
- Q2 on a real phone: whether the keyboard opens.
- S15, arrow keys on a closed `<select>` in Chrome on Windows or Linux: unchanged from the UI test pass.

#### Out-of-scope observations
- At 320-412 px, the load-error text wraps close above the "Search titles" label. It is the same on the base commit (UI test S24).

#### After the answers (2026-11-01)
Answers: Q1 → A (hide Clear while the empty state shows), Q2 → A (keep as is). Both are recorded in [Decisions](#decisions), round 4.
- **Q1 applied:** `public/app.js` `render`.
  - Clear is hidden while `view.empty` as well as when nothing is filtered (`hideClear`).
  - The focus move from F3 now uses the same condition, so a focused Clear that hides because back/forward reached an empty state also sends focus to the search box.
- **Tests:**
  - "no matches shows an empty state…" now asserts that Clear is hidden and that exactly one button is named "Clear search and filter".
  - "the Clear button shows while filtered…" now covers a focused Clear when forward reaches an empty state.
  - Mutation checks on the scratch copy, desktop: Clear hidden only when nothing is filtered → the empty-state test fails; the focus condition left at `!view.filtered` → the Clear test fails.
- **Q2:** no change.
- **Checks:** `npm test` 22/22, `npx playwright test` 34/34, `node --check public/app.js` ok.
- UI test row S32 is resolved by this answer: the empty state now has one reset.

### Round 2 (2026-11-01, scoped)

**Verdict:** ready for PR. The round 2 review found 5 problems. 4 are fixed and 1 is accepted as low. The work is ready for /deep-ship after the user's go.

#### Scope
- Round 1's fixes and everything changed since round 1, as the conductor scoped it:
  - `public/app.js`: in `render`, the `hideClear` rule and the focus move; `updateUrl`'s handling of refused history writes.
  - `public/index.html`: `autocomplete="off"` on the `<select>`.
  - `e2e/filters.spec.js`: the new and extended tests.
- Interactions checked: UX Q6 Clear (narrowed in round 4), R6 back/forward with the round 1 search-edit rule, and the round 2 start-up rule. The rest of the branch was not reviewed again.
- Reviewers: my own pass, plus an independent agent on the same scope. It reported 5 findings: 4 confirmed and 1 plausible. The plausible one is covered by the F7 fix.

#### Fixed
- **F7 (bug, R5):** `public/app.js:71-89`. A refused history write was never retried.
  - Trigger, reproduced in Playwright WebKit: type and delete "export to cs" six times, then type "csv". The box and list show "csv" with 1 row, but the URL stayed `/`, and was still `/` after 11 s idle. A reload or a copied link lost the search.
  - Chromium has the same limit (200 writes in 10 s) but drops writes silently instead of throwing (independent finding, plausible; Playwright disables the limit). After such a drop, `updateUrl` returned true, so a dropped push set `editing` with no entry made.
  - Fix: `updateUrl` now checks `location` after the write. If the URL didn't change, whether by a throw or a silent drop, it returns false and retries once a second with `replaceState`. The retry only ever writes when the URL differs from the controls, and never adds an entry.
  - Tradeoff, accepted: when the refused write was an edit's push, the retry replaces the previous entry, so that one back step is lost. The URL always ends up matching the screen.
  - Verified in WebKit: the URL is `/?q=csv` after the window, no page error, and back works. There is no e2e for it, because both projects are Chromium and the limit is off there.
  - The check relies on the invariant deep-test recorded: `serializeFilters` output is what the browser reports back as `location.search`. The no-op check already depended on it.
- **F8 (test):** in the Clear test, Clear is now asserted visible and focused before each forward step. Before this, focus was already in the search box, so the test passed even when Clear never came back after Back.
  - Mutation `clearButton.hidden = hideClear || focused === search`: the test now fails (it passed before).
- **F9 (test):** the empty-state test now covers the reset button's half of the focus move: back to the empty state, focus the reset, forward, and focus is in the search box.
  - Mutation removing `(focused === resetButton && !view.empty)`: the test now fails (it passed before).
- **F10 (docs):** the round 1 Requirements table, F1, F3 and Q2 now point at the current `app.js` lines, and the F1 claim is corrected.

Mutation checks ran on the scratch copy, desktop project. The copy was compared byte for byte afterwards.

#### Interactions (round 2 scope)
| Pair | Result |
|------|--------|
| `hideClear` (round 4) × reset clicked on Clear | `render` moves focus to the box, then `reset` focuses it again; harmless |
| `hideClear` × back/forward into or out of the empty state with Clear or the reset focused | focus goes to the search box (F3, F8, F9) |
| `hideClear` × loading and load error | both buttons are hidden before the data arrives, so the focus move can't trigger; existing e2e covers it |
| F7 retry × search-edit rule (round 1) | a refused push leaves `editing` false, so the next keystroke pushes again; the retry only re-syncs the current entry with `replaceState` |
| F7 retry × back/forward | after `popstate` the URL matches the controls, so a pending retry does nothing |
| `autocomplete="off"` × start-up rule (round 2) | input entered before the script runs is live input, not a restore, so it is still kept; all three start-up blocks pass |
| `autocomplete="off"` × reload and back from another page | the controls match the URL in Chromium and WebKit |

#### Accepted open items (loop guard B)
- **F7 tradeoff:** a back step can be lost after the browser refuses history writes. This needs about 100 writes within 10 seconds.
- **Not verified:**
  - Firefox form restore (E11): the Playwright Firefox build didn't launch.
  - F1 and F7 in real Safari or on iOS, and Chromium's silent limit: checked in Playwright WebKit only.
  - The phone keyboard after Clear (Q2 kept as is).
  - S15, arrow keys on the `<select>` in Chrome on Windows or Linux.
  - bfcache restores: Playwright Chromium didn't use the bfcache.
- **Outside scope:** the "back and forward…" e2e fails at its Esc step in Playwright WebKit, because Esc doesn't clear a search box there. WebKit isn't a configured project.

#### Checks
| Check | Command | Result |
|-------|---------|--------|
| Unit | `npm test` | 22/22 pass |
| E2E | `npx playwright test` (scratch `--output`) | 34/34 pass (17 tests × desktop and mobile) |
| Syntax | `node --check public/app.js` | ok |
| WebKit probe (F7) | scratch Playwright script against `PORT=4345 node server.mjs` | URL stale before the fix; `/?q=csv` after it |
| Lint / format / typecheck | none configured in this example; none added | N/A |
| Skills repo check | `node scripts/check.mjs` (repo root) | ok |

