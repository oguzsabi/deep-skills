import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { countLabel, emptyMessage, filterIssues, listView, parseFilters, serializeFilters } from '../public/lib/filters.js';

const issues = JSON.parse(readFileSync(new URL('../data/issues.json', import.meta.url), 'utf8'));
const ids = (list) => list.map((issue) => issue.id);

test('filterIssues matches the title case-insensitively', () => {
  assert.deepEqual(ids(filterIssues(issues, { q: 'csv' })), [103]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'CSV' })), [103]);
});

test('filterIssues ignores accents and Turkish dotted/dotless i', () => {
  assert.deepEqual(ids(filterIssues(issues, { q: 'istanbul' })), [106]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'İSTANBUL' })), [106]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'odeme' })), [102]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'siralama' })), [115]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'Sıralama' })), [115]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'calismiyor' })), [115]);
});

test('filterIssues treats special characters literally', () => {
  assert.deepEqual(ids(filterIssues(issues, { q: 'C++' })), [104]);
  assert.deepEqual(ids(filterIssues(issues, { q: '100%' })), [105]);
  assert.deepEqual(ids(filterIssues(issues, { q: '&' })), [119]);
  assert.deepEqual(ids(filterIssues(issues, { q: '(€' })), [109]);
  assert.deepEqual(ids(filterIssues(issues, { q: '.*' })), []);
});

test('filterIssues trims the query and treats whitespace-only as no search', () => {
  assert.deepEqual(ids(filterIssues(issues, { q: '  csv  ' })), [103]);
  assert.equal(filterIssues(issues, { q: '   ' }).length, 24);
  assert.equal(filterIssues(issues, { q: '' }).length, 24);
});

test('filterIssues matches the whole phrase, not separate words', () => {
  assert.deepEqual(ids(filterIssues(issues, { q: 'export to csv' })), [103]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'csv export' })), []);
});

test('filterIssues filters by each status and returns everything for all', () => {
  const count = (status) => filterIssues(issues, { status }).length;
  assert.equal(count('open'), 12);
  assert.equal(count('in_progress'), 6);
  assert.equal(count('closed'), 6);
  assert.equal(count('all'), 24);
  assert.ok(filterIssues(issues, { status: 'open' }).every((issue) => issue.status === 'open'));
});

test('filterIssues combines search and status', () => {
  assert.deepEqual(ids(filterIssues(issues, { q: 'the', status: 'in_progress' })), [105, 109, 117]);
  assert.deepEqual(ids(filterIssues(issues, { q: 'csv', status: 'open' })), []);
});

test('filterIssues keeps the input order and does not mutate it', () => {
  const input = [
    { id: 2, status: 'open', title: 'B fails' },
    { id: 1, status: 'closed', title: 'A fails' },
    { id: 3, status: 'open', title: 'C fails' },
  ];
  const before = structuredClone(input);
  assert.deepEqual(ids(filterIssues(input, { q: 'fails', status: 'open' })), [2, 3]);
  assert.deepEqual(input, before);
  assert.notEqual(filterIssues(input, {}), input);
});

test('parseFilters reads q and status from a query string', () => {
  assert.deepEqual(parseFilters('?q=csv&status=open'), { q: 'csv', status: 'open' });
  assert.deepEqual(parseFilters('?status=in_progress'), { q: '', status: 'in_progress' });
});

test('parseFilters falls back to all for a missing, empty or unknown status', () => {
  assert.deepEqual(parseFilters(''), { q: '', status: 'all' });
  assert.deepEqual(parseFilters('?status='), { q: '', status: 'all' });
  assert.deepEqual(parseFilters('?status=blocked'), { q: '', status: 'all' });
  assert.deepEqual(parseFilters('?status=Open'), { q: '', status: 'all' });
  assert.deepEqual(parseFilters('?status=constructor'), { q: '', status: 'all' });
  assert.deepEqual(parseFilters('?q=a&q=b&status=closed&status=open'), { q: 'a', status: 'closed' });
});

test('parseFilters reads a hand-typed link without throwing', () => {
  // A bare or broken % escape must not stop the page from loading.
  assert.deepEqual(parseFilters('?q=100%'), { q: '100%', status: 'all' });
  assert.doesNotThrow(() => parseFilters('?q=%E0%A4%A'));
  // Only spaces give an empty box; an unencoded + is a space, so C++ reads as C.
  assert.deepEqual(parseFilters('?q=%20%20&status=open'), { q: '', status: 'open' });
  assert.deepEqual(parseFilters('?q=C++'), { q: 'C', status: 'all' });
});

test('serializeFilters leaves out defaults and encodes special characters', () => {
  assert.equal(serializeFilters({ q: '', status: 'all' }), '');
  assert.equal(serializeFilters({ q: '   ', status: 'blocked' }), '');
  assert.equal(serializeFilters({ q: ' csv ', status: 'closed' }), '?q=csv&status=closed');
  assert.equal(serializeFilters({ q: 'C++', status: 'all' }), '?q=C%2B%2B');
  assert.equal(serializeFilters({ q: '100%', status: 'all' }), '?q=100%25');
  assert.equal(serializeFilters({ q: 'a&status=closed', status: 'all' }), '?q=a%26status%3Dclosed');
});

test('parseFilters and serializeFilters round-trip', () => {
  for (const q of ['C++', '100%', 'Tags with &', '€ vs ₺', 'İstanbul', "reads status as 'in_progress'"]) {
    for (const status of ['all', 'open', 'in_progress', 'closed']) {
      assert.deepEqual(parseFilters(serializeFilters({ q, status })), { q, status });
    }
  }
});

test('countLabel shows the total, or shown of total while filtered', () => {
  assert.equal(countLabel(24, 24, false), '24 issues');
  assert.equal(countLabel(1, 1, false), '1 issue');
  assert.equal(countLabel(12, 24, true), '12 of 24 issues');
  assert.equal(countLabel(1, 24, true), '1 of 24 issues');
  assert.equal(countLabel(0, 24, true), '0 of 24 issues');
});

const all = { q: '', status: 'all' };

test('listView shows every issue and the plain count while no search or filter is active', () => {
  for (const filters of [all, { q: '   ', status: 'all' }]) {
    const view = listView(issues, filters);
    assert.equal(view.issues.length, 24);
    assert.equal(view.count, '24 issues');
    assert.equal(view.filtered, false);
    assert.equal(view.empty, false);
  }
});

test('listView counts the rows it shows while filtered', () => {
  const cases = [
    [{ q: 'csv', status: 'all' }, 1, '1 of 24 issues'],
    [{ q: '', status: 'open' }, 12, '12 of 24 issues'],
    [{ q: 'the', status: 'in_progress' }, 3, '3 of 24 issues'],
    [{ q: 'zzz', status: 'all' }, 0, '0 of 24 issues'],
  ];
  for (const [filters, rows, count] of cases) {
    const view = listView(issues, filters);
    assert.equal(view.issues.length, rows);
    assert.equal(view.count, count);
    assert.equal(view.filtered, true);
  }
});

test('listView shows the empty state only when a search or filter matches nothing', () => {
  assert.equal(listView(issues, { q: 'zzz', status: 'all' }).empty, true);
  assert.equal(listView(issues, { q: 'csv', status: 'open' }).empty, true);
  assert.equal(listView(issues, { q: 'csv', status: 'all' }).empty, false);
  assert.equal(listView(issues, { q: 'csv', status: 'open' }).message, 'No open issues match “csv”.');
  // An empty dataset with nothing active keeps today's plain "0 issues" list.
  assert.deepEqual(listView([], all), { issues: [], count: '0 issues', filtered: false, empty: false, message: '' });
});

test('emptyMessage names the active status and the query', () => {
  assert.equal(emptyMessage({ q: 'csv', status: 'open' }), 'No open issues match “csv”.');
  assert.equal(emptyMessage({ q: ' the ', status: 'in_progress' }), 'No in progress issues match “the”.');
  assert.equal(emptyMessage({ q: 'zzz', status: 'all' }), 'No issues match “zzz”.');
  assert.equal(emptyMessage({ q: '', status: 'closed' }), 'No closed issues.');
  assert.equal(emptyMessage({ q: '   ', status: 'all' }), '');
  // The query is kept literally; the page writes it with textContent.
  assert.equal(emptyMessage({ q: '<b>İstanbul</b>', status: 'all' }), 'No issues match “<b>İstanbul</b>”.');
});
