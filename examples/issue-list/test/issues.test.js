import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortByUpdated, statusLabel } from '../public/lib/issues.js';

test('statusLabel turns status keys into readable labels', () => {
  assert.equal(statusLabel('open'), 'Open');
  assert.equal(statusLabel('in_progress'), 'In progress');
  assert.equal(statusLabel('closed'), 'Closed');
});

test('statusLabel falls back to the raw value for an unknown status', () => {
  assert.equal(statusLabel('blocked'), 'blocked');
});

test('sortByUpdated puts the newest first and breaks ties by higher id', () => {
  const issues = [
    { id: 1, updated: '2026-10-01' },
    { id: 3, updated: '2026-10-05' },
    { id: 2, updated: '2026-10-05' },
  ];
  assert.deepEqual(sortByUpdated(issues).map((i) => i.id), [3, 2, 1]);
});

test('sortByUpdated does not mutate its input', () => {
  const issues = [{ id: 1, updated: '2026-10-01' }, { id: 2, updated: '2026-10-02' }];
  sortByUpdated(issues);
  assert.deepEqual(issues.map((i) => i.id), [1, 2]);
});
