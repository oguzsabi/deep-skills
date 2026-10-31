import { sortByUpdated, statusLabel } from './lib/issues.js';

const list = document.querySelector('#issues');
const count = document.querySelector('#count');

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

function render(issues) {
  list.replaceChildren(...issues.map(row));
  count.textContent = `${issues.length} issues`;
}

async function load() {
  try {
    const response = await fetch('/api/issues');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(sortByUpdated(await response.json()));
  } catch (error) {
    count.textContent = 'Could not load issues. Refresh to try again.';
    console.error(error);
  }
}

load();
