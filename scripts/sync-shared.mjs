#!/usr/bin/env node
// Copies the reference files that several skills read into each skill that
// reads them, so every skill folder works on its own (a store or a manual
// install may take one folder without its neighbours). scripts/shared.json
// maps each source file to the skills that get a copy.
//
//   node scripts/sync-shared.mjs          write the copies
//   node scripts/sync-shared.mjs --check  list missing or stale copies, exit 1 if any
//
// Edit the source, never a copy: the next sync overwrites copies.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const header = (source) =>
  `<!-- Copied from ${source} by scripts/sync-shared.mjs. Edit the source, not this copy. -->\n\n`;

// Every copy as { source, target, content }, paths relative to the repo root.
export function plannedCopies() {
  const shared = JSON.parse(readFileSync(join(root, 'scripts/shared.json'), 'utf8'));
  return Object.entries(shared).flatMap(([source, skills]) => {
    const content = header(source) + readFileSync(join(root, source), 'utf8');
    return skills.map((skill) => ({
      source,
      target: `skills/${skill}/references/${basename(source)}`,
      content,
    }));
  });
}

// Copies whose file is missing or differs from its source.
export function staleCopies() {
  return plannedCopies().filter(
    ({ target, content }) =>
      !existsSync(join(root, target)) || readFileSync(join(root, target), 'utf8') !== content,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stale = staleCopies();
  if (process.argv.includes('--check')) {
    for (const { source, target } of stale) console.log(`stale: ${target} (from ${source})`);
    process.exit(stale.length ? 1 : 0);
  }
  for (const { target, content } of stale) {
    writeFileSync(join(root, target), content);
    console.log(`wrote ${target}`);
  }
  if (!stale.length) console.log('all copies current');
}
