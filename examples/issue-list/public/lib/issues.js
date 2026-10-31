// Pure helpers for the issue list. The page imports them in the browser and
// the unit tests import them in Node, so nothing here touches the DOM.

export const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

// Newest first; ties keep the higher id first so the order is stable.
export function sortByUpdated(issues) {
  return [...issues].sort((a, b) => b.updated.localeCompare(a.updated) || b.id - a.id);
}
