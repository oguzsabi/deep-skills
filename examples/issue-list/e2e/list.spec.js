import { test, expect } from '@playwright/test';

test('shows every issue, newest first', async ({ page }) => {
  await page.goto('/');
  const rows = page.getByTestId('issue-row');
  await expect(rows).toHaveCount(24);
  await expect(page.locator('#count')).toHaveText('24 issues');
  await expect(rows.first()).toContainText('100% CPU on the dashboard after an hour');
});

test('shows an error message when the issues cannot load', async ({ page }) => {
  await page.route('/api/issues', (route) => route.fulfill({ status: 500 }));
  await page.goto('/');
  await expect(page.locator('#count')).toHaveText('Could not load issues. Refresh to try again.');
});
