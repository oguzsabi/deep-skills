# #12 Search and filter the issue list

**Type:** Story · **Priority:** Medium

As a team lead, I want to find issues quickly, because the list is getting long.

## What we need

- A search box above the list. Typing filters the issues by title.
- A status filter: All, Open, In progress, Closed.
- Search and status filter work together.
- The current search and filter are kept in the URL, so I can share a link to exactly what I'm looking at, and the browser's back button works.
- When nothing matches, show a clear empty state with a way to reset.

## Acceptance criteria

1. Typing "csv" shows only "Export to CSV drops the last row".
2. Choosing "Open" shows only open issues; the count above the list matches what's shown.
3. Opening a shared link with a search and a filter shows the same results.
4. With no matches, the page says so and one click brings back the full list.

## Design

No mockup. Match the existing page.
