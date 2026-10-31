# Browser setup

Shared by `/deep-ui-test` and `/deep-ux`.

## The app

- Find how the app runs here: repo docs and `CLAUDE.md`, project memory, the `run` skill if installed, package scripts, `.env` examples. Note the port, which backend it talks to (local, dev, test, staging) and any worktree it should run from.
- Check whether it's already running (request the port) before starting it. Start long-lived servers in the background and wait for the ready URL.
- Never point the app at production. If the only backend available is production, stop and ask.

## Accounts

- Find test accounts and roles in the repo docs, `.env` files or project memory. Never echo credentials into reports, docs or the work doc.
- List the roles the scenarios need. If one is missing, ask the user, or create it through an admin UI on a non-production environment if the docs say that's allowed.

## The browser tool

Any browser tool that can navigate, click, type, resize the viewport, read the console and network, and run JavaScript will do: Claude in Chrome, a Playwright MCP server, a built-in browser pane. Each step below says what to do; the names in backticks are Claude in Chrome's tools, so use your tool's equivalents.

- If your agent defers tool schemas, load all the browser tools in one call (Claude in Chrome, one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`, `tabs_close_mcp`, `navigate`, `computer`, `read_page`, `find`, `get_page_text`, `javascript_tool`, `read_console_messages`, `read_network_requests`, `resize_window`, `gif_creator`, `form_input`).
- List the open tabs first (`tabs_context_mcp`), then work in a new tab of your own. Don't use the user's existing tabs unless asked.
- Viewports: resize (`resize_window`) to 375×812, 768×1024, 1280×800, 1440×900, 1920×1080, plus short ones (1280×600, 812×375) for floating content. If the window can't be resized, use a scratch Playwright script with `page.setViewportSize` instead, and don't skip heights. Resizing doesn't emulate touch: for hover-only content, check the touch alternative exists in the code and DOM, and list "real touch device" under not verified where it matters.
- Observe: page structure (`read_page`, `find`), screenshots (`computer`), console messages filtered by a pattern (`read_console_messages`), failed and duplicate requests (`read_network_requests`), state through JavaScript (`javascript_tool`: storage, URL, DOM measurements such as overflow).
- Evidence: a GIF for multi-step flows (`gif_creator`, with extra frames before and after each action; a numbered screenshot series if your tool can't record), screenshots for single states, all with meaningful names.
- Don't trigger native `alert` / `confirm` / `prompt` dialogs: they block every further browser command. If one appears, ask the user to dismiss it.
- If the same action fails 2-3 times, stop and ask instead of looping.

## Playwright alongside the browser tool

Use a scratch Playwright script (with the repo's Playwright install and config) when a scenario needs precise control: mocked or delayed responses, offline, clock and time zone, locale, many viewports in a row. Take screenshots from it as evidence. Scripts worth keeping become e2e specs (deep-ui-test Phase 9).
