import { sortByUpdated, statusLabel } from './lib/issues.js';
import { listView, parseFilters, serializeFilters } from './lib/filters.js';

const list = document.querySelector('#issues');
const count = document.querySelector('#count');
const filters = document.querySelector('#filters');
const search = document.querySelector('#search');
const statusFilter = document.querySelector('#status-filter');
const emptyState = document.querySelector('#empty-state');
const emptyMessage = document.querySelector('#empty-message');
const resetButton = document.querySelector('#reset-filters');
const clearButton = document.querySelector('#clear-filters');

// All issues, newest first; null until they load (or if loading fails).
let allIssues = null;
// True once a search edit has its own history entry: the first keystroke of an
// edit pushes, later ones replace. Focusing the box, a status change, a reset
// and back/forward each end the edit.
let editing = false;
// A pending retry of a history write the browser refused (see updateUrl).
let resync;

function row(issue) {
  const li = document.createElement('li');
  li.className = 'issue';
  li.dataset.testid = 'issue-row';

  const title = document.createElement('span');
  title.className = 'issue-title';
  title.textContent = issue.title;

  const status = document.createElement('span');
  status.className = `status status-${issue.status}`;
  status.textContent = statusLabel(issue.status);

  const meta = document.createElement('span');
  meta.className = 'issue-meta';
  meta.textContent = `#${issue.id} · ${issue.assignee} · ${issue.updated}`;

  li.append(title, status, meta);
  return li;
}

function currentFilters() {
  return { q: search.value, status: statusFilter.value };
}

function render() {
  if (!allIssues) return;
  const view = listView(allIssues, currentFilters());
  // The empty state has its own reset, so Clear shows only while results show.
  const hideClear = !view.filtered || view.empty;
  // A reset button that back/forward hides while it has focus would drop focus
  // to the page; send it to the search box, as a reset does.
  const focused = document.activeElement;
  const losesFocus = (focused === clearButton && hideClear) || (focused === resetButton && !view.empty);
  list.replaceChildren(...view.issues.map(row));
  list.hidden = view.empty;
  emptyState.hidden = !view.empty;
  emptyMessage.textContent = view.message;
  clearButton.hidden = hideClear;
  count.textContent = view.count;
  if (losesFocus) search.focus();
}

function applyFilters({ q, status }) {
  search.value = q;
  statusFilter.value = status;
}

// Writes the current filters to the URL; returns false when no history write
// happened (the URL already matches, or the browser refused the write).
// Browsers limit history writes (Safari throws after 100 in 10 seconds, Chrome
// ignores them after 200); holding Backspace on a long query can get there. The
// list still renders, and the URL is set again a second later with
// replaceState, so it matches the screen without adding an entry.
function updateUrl(method) {
  const url = `${location.pathname}${serializeFilters(currentFilters())}`;
  if (url === `${location.pathname}${location.search}`) return false;
  clearTimeout(resync);
  try {
    history[method](null, '', url);
  } catch {
    // Checked below: the URL did not change.
  }
  if (`${location.pathname}${location.search}` === url) return true;
  resync = setTimeout(() => updateUrl('replaceState'), 1000);
  return false;
}

function onSearchInput() {
  if (updateUrl(editing ? 'replaceState' : 'pushState')) editing = true;
  render();
}

function onStatusChange() {
  updateUrl('pushState');
  editing = false;
  render();
}

function onPopState() {
  applyFilters(parseFilters(location.search));
  editing = false;
  render();
}

function reset() {
  search.value = '';
  statusFilter.value = 'all';
  updateUrl('pushState');
  editing = false;
  render();
  search.focus();
}

async function load() {
  try {
    const response = await fetch('/api/issues');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allIssues = sortByUpdated(await response.json());
    render();
  } catch (error) {
    count.textContent = 'Could not load issues. Refresh to try again.';
    console.error(error);
  }
}

filters.addEventListener('submit', (event) => event.preventDefault());
search.addEventListener('focus', () => {
  editing = false;
});
search.addEventListener('input', onSearchInput);
statusFilter.addEventListener('change', onStatusChange);
resetButton.addEventListener('click', reset);
clearButton.addEventListener('click', reset);
window.addEventListener('popstate', onPopState);

// A shared link sets the controls, except a control the user already changed
// while this script was loading: that one keeps its value. An unknown status or
// an empty parameter is dropped from the URL without adding a history entry.
const fromUrl = parseFilters(location.search);
applyFilters({
  q: search.value !== search.defaultValue ? search.value : fromUrl.q,
  status: statusFilter.value !== 'all' ? statusFilter.value : fromUrl.status,
});
updateUrl('replaceState');
load();
