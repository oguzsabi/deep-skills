# issue-list

A small issue list: one page, plain HTML, CSS and JavaScript modules, a Node static server. No framework and no build step; keep it that way.

## Commands

- `npm start`: the app on http://localhost:4310
- `npm test`: unit tests (`node --test`)
- `npm run e2e`: Playwright tests, desktop and mobile; starts its own server on port 4311

## Conventions

- Logic that doesn't touch the DOM goes in `public/lib/` and gets unit tests in `test/`.
- Rows and controls tests rely on carry a `data-testid`.
- Feature docs live in `docs/features/`, listed in `docs/README.md`. Tickets are in `docs/tickets/`.
- Commits: Conventional Commits (`feat(issue-list): ...`).
