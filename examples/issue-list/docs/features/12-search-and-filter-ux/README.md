# Evidence: UX review for #12

Before/after screenshots from the [UX review](../12-search-and-filter.md#ux-review-deep-ux-2026-11-01). Each "after" is a prototype injected into the running page (CSS or text), never saved to the source. Taken with Playwright (Chromium) against the local server: desktop shots are the page column at 1440×900, 2× (1584 px wide); phone shots are 375×812 at 2× with touch (750 px wide).

| Files | Question | Shows |
|-------|----------|-------|
| `01-empty-state-before.jpg`, `01-empty-state-after.jpg` | Q1 | "csv" with Open: "No issues match your search." vs "No open issues match “csv”." |
| `02-controls-before.jpg`, `02-controls-after.jpg` | Q2, Q3 | Control borders at 1.30:1 and a 36/38 px height mismatch vs a 3.71:1 border and both controls 40 px |
| `03-phone-toolbar-before.jpg`, `03-phone-toolbar-after.jpg` | Q4 | 375 px, Open: status on its own line (first issue at 213 px) vs one toolbar row (first issue at 146 px) |
| `04-loading-before.jpg`, `04-loading-after.jpg` | Q5 | `/api/issues` held: the empty list box as a thin strip vs the list hidden until data arrives |
| `05-clear-before.jpg`, `05-clear-after.jpg` | Q6 | `/?q=login&status=open`: no way back to the full list in one step vs a "Clear" button next to the count |

After the answers (all A), the picked items implemented in the source, same capture settings:

| File | Question | Shows |
|------|----------|-------|
| `10-implemented-empty-state.jpg` | Q1, Q2, Q3, Q6 | "csv" with Open: "No open issues match “csv”.", 40 px controls with visible borders, Clear next to the count |
| `11-implemented-clear.jpg` | Q6 | `/?q=login&status=open`: one row and the Clear button after "1 of 24 issues" |
| `12-implemented-loading.jpg` | Q5 | `/api/issues` held: no list strip under the toolbar |
| `13-implemented-phone.jpg` | Q4, Q6 | 375 px, Open: one toolbar row, first issue at 146 px, Clear in the header |
