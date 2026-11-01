# Evidence: UI test pass for #12

Screenshots from the [UI test pass](../12-search-and-filter.md#ui-test-pass-deep-ui-test-2026-10-31), taken with Playwright (Chromium) against the local server. Desktop shots are 1440×900; phone shots are 375×812 at 2× (750 px wide).

| File | Row | Shows |
|------|-----|-------|
| `01-filtered-desktop.jpg` | S3 | "the" with In progress: #105, #109, #117 and "3 of 24 issues" |
| `02-empty-state-desktop.jpg` | S7 | `/?q=zzz`: the empty state with its reset button, no list box |
| `03-before-load-1-held.jpg` | S10 | "csv" and Closed chosen while `/api/issues` is held: "Loading…" |
| `03-before-load-2-released.jpg` | S10 | The same page after the response arrives: one row, "1 of 24 issues" |
| `04-load-error-with-search.jpg` | S11 | A load error with `/?q=csv`: the error text, no empty state |
| `05-before-script-1-typed.jpg` | S23 | Bug, before the fix: "csv" typed and Closed picked while `app.js` is still loading |
| `05-before-script-2-script-ran.jpg` | S23 | Bug, before the fix: once the script runs, both controls are reset and all 24 issues show |
| `05-before-script-3-fixed.jpg` | S23 | After the fix: the same steps keep "csv" and Closed, one row, URL `/?q=csv&status=closed` |
| `06-phone-filtered.jpg` | S24 | Phone, Open selected: the toolbar wraps, the status control sits on its own line |
| `07-phone-empty.jpg` | S24 | Phone, the empty state |

Round 2 (scoped re-run after the UX changes, [Round 2](../12-search-and-filter.md#round-2-2026-11-01-scoped-re-run-after-deep-ux)), same capture settings; the 320 px phone shots are 640 px wide. Files 01-07 show the page before the UX changes.

| File | Row | Shows |
|------|-----|-------|
| `08-r2-empty-state-both-resets.jpg` | S27, S32 | "csv" with Open: "No open issues match “csv”.", Clear in the header and the empty-state reset both showing |
| `09-r2-loading-held.jpg` | S10 | `/api/issues` held after typing "csv" and picking Closed: "Loading…", no list strip, no Clear |
| `10-r2-clear-focused.jpg` | S16 | `/?q=csv` after one Tab: Clear focused with Chrome's focus ring |
| `11-r2-phone-375-empty.jpg` | S7, S24 | 375 px, `/?q=zzz`: one toolbar row, the empty state, Clear in the header |
| `12-r2-phone-320-filtered.jpg` | S24 | 320 px, Open: the status control wraps below the search box (as predicted), no horizontal scroll |
| `13-r2-phone-320-load-error.jpg` | S11, S24 | 320 px load error: the message wraps to two lines next to the title (same as on the base commit), no list, no Clear |
| `14-r2-phone-long-query.jpg` | S27 | 375 px, a 230-character query: the message wraps inside the empty-state box |
