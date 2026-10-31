# Getting the data a scenario needs

A scenario is never skipped for lack of data. Pick the highest rung of the ladder that works: higher rungs exercise more of the real system.

## The ladder

1. **Existing data** in the environment that already matches the case. Search through the UI or API.
2. **Create it through the app's own UI**, the way a user would. Most realistic; also tests the creation flow.
3. **Create it through the backend**: its API with test credentials, admin tools, the repo's seed scripts, e2e fixtures and helpers, or a project MCP server that writes data. Check the other repos (backend, shared libraries) for seeders and factories first.
4. **Shape the real response in flight**: let the real request go out, then change the response. Everything else (routing, interceptors, rendering, other requests) stays real. See "Mocking responses" below.
5. **Control the environment**: clock and time zone, locale, offline, slow or failing requests, storage, cookies and URL params to reach a state.
6. **Last resort: set component state directly** in dev mode (e.g. Angular `ng.getComponent(el)`, React devtools hooks). Only for presentation checks; label the row clearly, since nothing upstream was exercised.

## Realism check

Before trusting a created or mocked case:

- **Shape**: matches the DTO/types and what the backend code fills (read it, e.g. through the code graph of the backend repo). Fields the backend never leaves null are never null in a mock.
- **Values**: plausible together. Dates inside the parent's range, counts that add up, statuses that can co-exist, ids that point at real related entities.
- **Reachability**: name how a real user or system gets there. If you can't confirm the backend can produce it, mark the row "plausible" and ask, instead of reporting a bug.
- **It took effect**: confirm the UI shows the mocked or created value before judging the result. A mock that never matched its URL gives a false pass.

## Mocking responses

**Playwright** (preferred for mocks, timing and network control; reuses the repo's Playwright install). Write a scratch script or spec in the session scratchpad; promote it to an e2e spec when the case is worth keeping.

```ts
await page.route('**/api/<resource>/**', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.items[0].dueDate = null; // the case under test
  await route.fulfill({ response, json });
});

await page.route('**/api/<resource>/**', (route) => route.fulfill({ status: 500 }));       // error
await page.route('**/api/<resource>/**', async (route) => { await new Promise((r) => setTimeout(r, 3000)); await route.continue(); }); // slow
await context.setOffline(true);                                                            // offline
await page.clock.setFixedTime(new Date('2026-03-29T01:30:00Z'));                           // time, DST
```

Also available: `browser.newContext({ locale, timezoneId, viewport })` for locale, time zone and viewport.

**In the browser tool** (when the scenario is easier to drive by hand): install a shim with the JavaScript tool, then trigger the request with in-app navigation, because a full reload drops the shim. It covers `fetch` and `XMLHttpRequest` (Angular's `HttpClient` uses XHR unless `withFetch()` is configured, and reads JSON responses as text).

```js
(() => {
  const match = (url) => String(url).includes('/api/<resource>');
  const mutate = (json) => { /* change json here */ return json; };

  const origFetch = window.fetch;
  window.fetch = async (input, init) => {
    const res = await origFetch(input, init);
    if (!match(typeof input === 'string' ? input : input.url)) return res;
    const body = JSON.stringify(mutate(await res.clone().json()));
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  };

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__mockUrl = url;
    return open.call(this, method, url, ...rest);
  };
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    if (match(this.__mockUrl)) {
      this.addEventListener('readystatechange', () => {
        if (this.readyState !== 4) return;
        const body = JSON.stringify(mutate(JSON.parse(this.responseText)));
        Object.defineProperty(this, 'responseText', { value: body });
        Object.defineProperty(this, 'response', { value: this.responseType === 'json' ? JSON.parse(body) : body });
      });
    }
    return send.apply(this, args);
  };
})();
```

Remove the shim afterwards by reloading the page.

## Safety in shared environments

- Confirm the environment before creating anything; never production.
- Name created data so it's recognisable: `deep-ui-test <date> <short case>`.
- Log every created entity (type, id, environment) in the work doc as you go.
- Delete what you created at the end, or list it if the user wants to keep it.
- Don't change or delete data you didn't create without asking.
- Ask before anything that reaches people or systems outside the app: emails, invites, notifications to real users, external publishing, payments, webhooks.

## Recording

Each row's Data column says the method: `existing`, `created (UI)`, `created (API)`, `fixture`, `mocked response`, `environment`, `component state`. Mocked and component-state rows say what remained unverified (e.g. "backend producing null dueDate not verified").
