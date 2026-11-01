import { test, expect } from '@playwright/test';

const rows = (page) => page.getByTestId('issue-row');
const search = (page) => page.getByTestId('search-input');
const status = (page) => page.getByTestId('status-filter');
const count = (page) => page.locator('#count');

// The visible state: rows shown, count, both controls and the query string.
async function expectState(page, { rows: n, count: text, q = '', status: value = 'all', url = '/' }) {
  await expect(rows(page)).toHaveCount(n);
  await expect(count(page)).toHaveText(text);
  await expect(search(page)).toHaveValue(q);
  await expect(status(page)).toHaveValue(value);
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(url);
}

async function openList(page, path = '/') {
  await page.goto(path);
  await expect(count(page)).not.toHaveText('Loading…');
}

test('typing in the search box shows only matching titles', async ({ page }) => {
  await openList(page);
  await search(page).fill('csv');
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', url: '/?q=csv' });
  await expect(rows(page)).toContainText(['Export to CSV drops the last row']);
});

test('choosing a status shows only issues with that status', async ({ page }) => {
  await openList(page);
  await status(page).selectOption('open');
  await expectState(page, { rows: 12, count: '12 of 24 issues', status: 'open', url: '/?status=open' });
  await expect(rows(page).locator('.status')).toHaveText(Array(12).fill('Open'));
});

test('search and status filter combine', async ({ page }) => {
  await openList(page);
  await search(page).fill('the');
  await status(page).selectOption('in_progress');
  await expectState(page, { rows: 3, count: '3 of 24 issues', q: 'the', status: 'in_progress', url: '/?q=the&status=in_progress' });
  await expect(rows(page).locator('.issue-meta')).toContainText(['#105', '#109', '#117']);
});

test('a shared link restores the search, the status and the results', async ({ page }) => {
  await openList(page, '/?q=csv&status=closed');
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', status: 'closed', url: '/?q=csv&status=closed' });
  await expect(rows(page)).toContainText(['Export to CSV drops the last row']);

  await openList(page, '/?q=C%2B%2B');
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'C++', url: '/?q=C%2B%2B' });
  await expect(rows(page)).toContainText(['C++ build fails on the CI runner']);
});

test('coming back to an earlier entry from another page shows that entry\'s status, not a later one', async ({ page }) => {
  await openList(page);
  await status(page).selectOption('open');
  await status(page).selectOption('closed');
  await page.goto('/api/issues');
  // Two steps back loads the "Open" entry as a new document; the browser must
  // not restore the status saved when the page was left (Closed).
  await page.evaluate(() => history.go(-2));
  await page.waitForURL('**/?status=open');
  await expect(count(page)).not.toHaveText('Loading…');
  await expectState(page, { rows: 12, count: '12 of 24 issues', status: 'open', url: '/?status=open' });
});

test('a link with an unknown status shows every issue and is cleaned without a history entry', async ({ page }) => {
  await openList(page, '/?status=blocked&q=');
  await expectState(page, { rows: 24, count: '24 issues' });
  // The cleaned URL replaced the link's entry: one back leaves the page.
  await page.goBack();
  expect(page.url()).toBe('about:blank');
});

test('back and forward step through filter states', async ({ page }) => {
  let fetches = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/issues') fetches += 1;
  });
  await openList(page);
  const all = { rows: 24, count: '24 issues' };
  const open = { rows: 12, count: '12 of 24 issues', status: 'open', url: '/?status=open' };
  const openFails = { rows: 2, count: '2 of 24 issues', q: 'fails', status: 'open', url: '/?q=fails&status=open' };

  await status(page).selectOption('open');
  await search(page).click();
  await search(page).pressSequentially('fails');
  await expectState(page, openFails);

  // The whole word is one entry: one back undoes it.
  await page.goBack();
  await expectState(page, open);
  await page.goBack();
  await expectState(page, all);
  await page.goForward();
  await expectState(page, open);
  await page.goForward();
  await expectState(page, openFails);

  // Typing after back starts a new edit and drops the forward entry.
  await page.goBack();
  await search(page).click();
  await search(page).pressSequentially('crash');
  const openCrash = { rows: 1, count: '1 of 24 issues', q: 'crash', status: 'open', url: '/?q=crash&status=open' };
  await expectState(page, openCrash);
  await page.goForward();
  await expectState(page, openCrash);

  // Clearing the box with Esc is part of the same edit: one back returns to
  // the state before the edit, not to "crash".
  await search(page).press('Escape');
  await expectState(page, open);
  await page.goBack();
  await expectState(page, open);
  await page.goBack();
  await expectState(page, all);

  // Moving through history re-renders from memory; the data loads once.
  expect(fetches).toBe(1);
});

test('a status change ends the search edit, so the next keystroke adds an entry', async ({ page }) => {
  await openList(page);
  await search(page).click();
  await search(page).pressSequentially('fail');
  await status(page).selectOption('open');
  // Type into the box without focusing it again, so no focus event ends the edit.
  await search(page).evaluate((input) => {
    input.value += 's';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expectState(page, { rows: 2, count: '2 of 24 issues', q: 'fails', status: 'open', url: '/?q=fails&status=open' });

  await page.goBack();
  await expectState(page, { rows: 2, count: '2 of 24 issues', q: 'fail', status: 'open', url: '/?q=fail&status=open' });
  await page.goBack();
  await expectState(page, { rows: 2, count: '2 of 24 issues', q: 'fail', url: '/?q=fail' });
});

test('focusing the box again starts a new edit, and a change that leaves the URL as it is adds no entry', async ({ page }) => {
  await openList(page);
  await search(page).click();
  await search(page).pressSequentially('csv');
  // Leaving the box and coming back ends the edit: deleting a letter gets its own entry.
  await page.locator('h1').click();
  await search(page).click();
  await search(page).press('End');
  await search(page).press('Backspace');
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'cs', url: '/?q=cs' });
  // A new edit that only adds a trailing space leaves the URL as it is: no entry.
  await page.locator('h1').click();
  await search(page).click();
  await search(page).press('End');
  await search(page).pressSequentially(' ');
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'cs ', url: '/?q=cs' });

  await page.goBack();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', url: '/?q=csv' });
  await page.goBack();
  await expectState(page, { rows: 24, count: '24 issues' });
});

test('no matches shows an empty state whose reset restores the full list', async ({ page }) => {
  await openList(page, '/?q=zzz');
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await expect(page.getByTestId('empty-state')).toContainText('No issues match “zzz”.');
  await expect(page.locator('#issues')).toBeHidden();
  await expectState(page, { rows: 0, count: '0 of 24 issues', q: 'zzz', url: '/?q=zzz' });
  // One reset per state: the header's Clear hides while the empty state shows.
  await expect(page.getByTestId('clear-filters')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear search and filter' })).toHaveCount(1);

  await page.getByTestId('reset-filters').click();
  await expect(page.getByTestId('empty-state')).toBeHidden();
  await expectState(page, { rows: 24, count: '24 issues' });
  await expect(search(page)).toBeFocused();

  // Back hides the empty state while its reset has focus: focus moves to the search box.
  await page.goBack();
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await page.getByTestId('reset-filters').focus();
  await expect(page.getByTestId('reset-filters')).toBeFocused();
  await page.goForward();
  await expectState(page, { rows: 24, count: '24 issues' });
  await expect(search(page)).toBeFocused();
});

test('the empty state names the status and the query, and shows a query from a link as text', async ({ page }) => {
  await openList(page, '/?q=csv&status=open');
  await expect(page.getByTestId('empty-state')).toContainText('No open issues match “csv”.');

  await openList(page, '/?q=%3Cb%3Ezzz%3C%2Fb%3E');
  await expect(page.getByTestId('empty-state')).toContainText('No issues match “<b>zzz</b>”.');
  await expect(page.getByTestId('empty-state').locator('b')).toHaveCount(0);
});

test('the Clear button shows while filtered and restores the full list', async ({ page }) => {
  await openList(page);
  await expect(page.getByTestId('clear-filters')).toBeHidden();

  await openList(page, '/?q=login&status=open');
  await expect(rows(page)).toHaveCount(1);
  await page.getByTestId('clear-filters').click();
  await expectState(page, { rows: 24, count: '24 issues' });
  await expect(page.getByTestId('clear-filters')).toBeHidden();
  await expect(search(page)).toBeFocused();
  // Like the empty-state reset, Clear adds one history entry.
  await page.goBack();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'login', status: 'open', url: '/?q=login&status=open' });
  // Forward hides Clear while it has focus: focus moves to the search box, not the page.
  await expect(page.getByTestId('clear-filters')).toBeVisible();
  await page.getByTestId('clear-filters').focus();
  await expect(page.getByTestId('clear-filters')).toBeFocused();
  await page.goForward();
  await expectState(page, { rows: 24, count: '24 issues' });
  await expect(search(page)).toBeFocused();

  // Clear hides in the empty state too (it has its own reset), also when focused.
  await openList(page, '/?q=csv');
  await search(page).fill('csvzzz');
  await page.goBack();
  await expect(page.getByTestId('clear-filters')).toBeVisible();
  await page.getByTestId('clear-filters').focus();
  await expect(page.getByTestId('clear-filters')).toBeFocused();
  await page.goForward();
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await expect(page.getByTestId('clear-filters')).toBeHidden();
  await expect(search(page)).toBeFocused();
});

test('a load error with filters in the URL shows the error, not the empty state', async ({ page }) => {
  await page.route('/api/issues', (route) => route.fulfill({ status: 500 }));
  await page.goto('/?q=csv');
  await expect(count(page)).toHaveText('Could not load issues. Refresh to try again.');
  await expect(page.getByTestId('empty-state')).toBeHidden();
  await expect(page.locator('#issues')).toBeHidden();
  await expect(page.getByTestId('clear-filters')).toBeHidden();
  await expect(search(page)).toHaveValue('csv');
});

test('typing and picking a status before the issues load applies both once they arrive', async ({ page }) => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('/api/issues', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/');
  await search(page).click();
  await search(page).pressSequentially('csv');
  await status(page).selectOption('closed');
  await expect(count(page)).toHaveText('Loading…');
  await expect(page.locator('#issues')).toBeHidden();
  // Clear waits for the data, though the filters are already active.
  await expect(page.getByTestId('clear-filters')).toBeHidden();
  expect(new URL(page.url()).search).toBe('?q=csv&status=closed');

  release();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', status: 'closed', url: '/?q=csv&status=closed' });
  await expect(page.getByTestId('clear-filters')).toBeVisible();
  // The entries made while loading step back like any others.
  await page.goBack();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', url: '/?q=csv' });
  await page.goBack();
  await expectState(page, { rows: 24, count: '24 issues' });
});

// Holds /app.js until the returned function is called, so the page shows its
// controls before the script has run (a slow connection).
async function holdScript(page) {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('/app.js', async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

test('what the user enters before the script runs is kept, and the link fills the rest', async ({ page }) => {
  let release = await holdScript(page);
  await page.goto('/', { waitUntil: 'commit' });
  await search(page).click();
  await search(page).pressSequentially('csv');
  await status(page).selectOption('closed');
  release();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', status: 'closed', url: '/?q=csv&status=closed' });

  // A shared link: the untouched search box takes the link's query.
  await page.unroute('/app.js');
  release = await holdScript(page);
  await page.goto('/?q=the', { waitUntil: 'commit' });
  await status(page).selectOption('in_progress');
  release();
  await expectState(page, { rows: 3, count: '3 of 24 issues', q: 'the', status: 'in_progress', url: '/?q=the&status=in_progress' });

  // A link that sets both controls: what the user entered wins over the link.
  await page.unroute('/app.js');
  release = await holdScript(page);
  await page.goto('/?q=the&status=in_progress', { waitUntil: 'commit' });
  await search(page).click();
  await search(page).pressSequentially('csv');
  await status(page).selectOption('closed');
  release();
  await expectState(page, { rows: 1, count: '1 of 24 issues', q: 'csv', status: 'closed', url: '/?q=csv&status=closed' });
});
