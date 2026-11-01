// Pure helpers for searching and filtering the issue list, and for keeping the
// filters in the URL. Like issues.js, nothing here touches the DOM.

import { STATUS_LABELS, statusLabel } from './issues.js';

// Folds case, accents and the Turkish dotted/dotless i, so "istanbul" finds
// "İstanbul", "odeme" finds "Ödeme" and "siralama" finds "Sıralama".
export function normalizeText(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i').toLowerCase();
}

function isStatus(status) {
  return Object.hasOwn(STATUS_LABELS, status);
}

// Keeps the issues whose title contains the query (a literal, trimmed phrase)
// and whose status matches; 'all' or an unknown status keeps every status.
// Returns a new array in the input order.
export function filterIssues(issues, { q = '', status = 'all' } = {}) {
  const query = normalizeText(q.trim());
  const byStatus = isStatus(status);
  return issues.filter(
    (issue) =>
      (!byStatus || issue.status === status) &&
      (query === '' || normalizeText(issue.title).includes(query)),
  );
}

// Reads the filters from a query string such as location.search.
export function parseFilters(search) {
  const params = new URLSearchParams(search);
  const status = params.get('status') ?? '';
  return {
    q: (params.get('q') ?? '').trim(),
    status: isStatus(status) ? status : 'all',
  };
}

// Writes the filters as a query string, leaving out an empty search and the
// 'all' status, so the unfiltered page is plain "/". Returns '' or '?...'.
export function serializeFilters({ q = '', status = 'all' } = {}) {
  const params = new URLSearchParams();
  if (q.trim() !== '') params.set('q', q.trim());
  if (isStatus(status)) params.set('status', status);
  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

// The text above the list: "24 issues", or "12 of 24 issues" while filtered.
export function countLabel(shown, total, filtered) {
  const noun = (n) => (n === 1 ? 'issue' : 'issues');
  return filtered ? `${shown} of ${total} ${noun(total)}` : `${total} ${noun(total)}`;
}

// The empty-state text, naming what excluded the results: "No open issues
// match “csv”.", "No issues match “csv”." or "No open issues.". The page writes
// it with textContent, so a query from a shared link is shown, never parsed.
export function emptyMessage({ q = '', status = 'all' } = {}) {
  const query = q.trim();
  const which = isStatus(status) ? `${statusLabel(status).toLowerCase()} issues` : 'issues';
  if (query === '') return isStatus(status) ? `No ${which}.` : '';
  return `No ${which} match “${query}”.`;
}

// What the page shows for the loaded issues and the current filters: the rows,
// the count text, whether a search or filter is active (it shows the Clear
// button), and whether to show the empty state (only while a search or filter
// is active and nothing matches) with its message.
export function listView(issues, filters) {
  const shown = filterIssues(issues, filters);
  const filtered = filters.q.trim() !== '' || filters.status !== 'all';
  return {
    issues: shown,
    count: countLabel(shown.length, issues.length, filtered),
    filtered,
    empty: filtered && shown.length === 0,
    message: emptyMessage(filters),
  };
}
