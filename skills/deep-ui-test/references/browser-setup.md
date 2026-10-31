# Browser setup

Shared by `/deep-ui-test` and `/deep-ux`.

## The app

- Find how the app runs here: repo docs and `CLAUDE.md`, project memory, the `run` skill if installed, package scripts, `.env` examples. Note the port, which backend it talks to (local, dev, test, staging) and any worktree it should run from.
- Check whether it's already running (request the port) before starting it. Start long-lived servers in the background and wait for the ready URL.
- Never point the app at production. If the only backend available is production, stop and ask.

## Accounts

- Find test accounts and roles in the repo docs, `.env` files or project memory. Never echo credentials into reports, docs or the work doc.
- List the roles the scenarios need. If one is missing, ask the user, or create it through an admin UI on a non-production environment if the docs say that's allowed.

## Chrome

These steps name the Claude in Chrome tools. With another browser tool (a Playwright MCP server, a built-in browser pane), use its equivalents for the same steps.

- Load the browser tools in one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`, `tabs_close_mcp`, `navigate`, `computer`, `read_page`, `find`, `get_page_text`, `javascript_tool`, `read_console_messages`, `read_network_requests`, `resize_window`, `gif_creator`, `form_input`.
- Call `tabs_context_mcp` first, then work in a new tab of your own. Don't use the user's existing tabs unless asked.
- Viewports: `resize_window` to 375×812, 768×1024, 1280×800, 1440×900, 1920×1080, plus short ones (1280×600, 812×375) for floating content. If the window can't be resized, use a scratch Playwright script with `page.setViewportSize` instead, and don't skip heights. Resizing doesn't emulate touch: for hover-only content, check the touch alternative exists in the code and DOM, and list "real touch device" under not verified where it matters.
- Observe with `read_page` / `find` for structure, screenshots via `computer`, `read_console_messages` with a `pattern`, `read_network_requests` for failed and duplicate requests, `javascript_tool` for state (storage, URL, DOM measurements such as overflow).
- Evidence: `gif_creator` for multi-step flows (extra frames before and after each action), screenshots for single states, both with meaningful names.
- Don't trigger native `alert` / `confirm` / `prompt` dialogs: they block every further browser command. If one appears, ask the user to dismiss it.
- If the same action fails 2-3 times, stop and ask instead of looping.

## Playwright alongside Chrome

Use a scratch Playwright script (with the repo's Playwright install and config) when a scenario needs precise control: mocked or delayed responses, offline, clock and time zone, locale, many viewports in a row. Take screenshots from it as evidence. Scripts worth keeping become e2e specs in Phase 9.
