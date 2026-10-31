#!/usr/bin/env node
// Checks that the skills, their references, the shared copies, the plugin
// manifests and the README agree. Zero dependencies; CI runs it on every push.
//
//   node scripts/check.mjs

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { root, staleCopies } from './sync-shared.mjs';

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);
const read = (path) => readFileSync(join(root, path), 'utf8');

const markdownFiles = (dir) =>
  readdirSync(join(root, dir)).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(join(root, path)).isDirectory()) return markdownFiles(path);
    return name.endsWith('.md') ? [path] : [];
  });

const skills = readdirSync(join(root, 'skills'))
  .filter((name) => statSync(join(root, 'skills', name)).isDirectory())
  .sort();

// 1. Each skill has frontmatter with a matching name and a description that fits the 1024-character limit.
for (const skill of skills) {
  const path = `skills/${skill}/SKILL.md`;
  if (!existsSync(join(root, path))) {
    fail(path, 'missing');
    continue;
  }
  const frontmatter = read(path).match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!frontmatter) {
    fail(path, 'no frontmatter');
    continue;
  }
  const field = (key) => frontmatter.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1]?.trim();
  if (field('name') !== skill) fail(path, `name is "${field('name')}", expected "${skill}"`);
  const description = field('description');
  if (!description) fail(path, 'no description');
  else if (description.length > 1024) fail(path, `description is ${description.length} characters, limit 1024`);
}

// 2. Every file a skill points to exists inside that skill's own folder.
// Checked: paths in backticks or Markdown links that start with ../, ./ or
// references/, and bare lowercase file names (`routing.md`). Paths into the
// user's repo (docs/..., CLAUDE.md, <placeholders>) are not ours to check.
const internal = /^(\.\.?\/|references\/)|^[a-z0-9-]+\.md$/;
for (const skill of skills) {
  const skillRoot = `skills/${skill}`;
  for (const file of markdownFiles(skillRoot)) {
    const text = read(file);
    const refs = [...text.matchAll(/`([^`\s]+\.md)`|\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g)].map((m) => m[1] ?? m[2]);
    for (const ref of new Set(refs)) {
      if (!internal.test(ref)) continue;
      const candidates = [join(dirname(file), ref), join(skillRoot, ref), join(skillRoot, 'references', ref)];
      const found = candidates.find((path) => existsSync(join(root, path)));
      if (!found) fail(file, `points to ${ref}, which does not exist`);
      else if (relative(skillRoot, found).startsWith('..')) fail(file, `points to ${ref}, outside ${skillRoot}`);
    }
  }
}

// 3. Shared copies match their sources.
for (const { source, target } of staleCopies()) {
  fail(target, `missing or out of date with ${source}; run node scripts/sync-shared.mjs`);
}

// 4. The plugin manifests list every skill, and every version agrees with the latest CHANGELOG entry.
const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
const listed = plugin.skills.map((path) => path.replace(/^\.\/skills\//, '')).sort();
if (listed.join() !== skills.join()) {
  fail('.claude-plugin/plugin.json', `skills lists [${listed}], folders are [${skills}]`);
}
const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
const changelogVersion = read('CHANGELOG.md').match(/^## \[?(\d+\.\d+\.\d+)/m)?.[1];
const versions = {
  'plugin.json version': plugin.version,
  'marketplace.json metadata.version': marketplace.metadata?.version,
  'marketplace.json plugins[0].version': marketplace.plugins?.[0]?.version,
  'CHANGELOG.md latest entry': changelogVersion,
};
if (new Set(Object.values(versions)).size !== 1) {
  fail('versions', Object.entries(versions).map(([k, v]) => `${k} ${v}`).join(', '));
}

// 5. Relative links in the README resolve.
for (const [, target] of read('README.md').matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
  if (/^[a-z]+:/.test(target)) continue;
  if (!existsSync(join(root, target))) fail('README.md', `links to ${target}, which does not exist`);
}

if (failures.length) {
  console.log(failures.join('\n'));
  console.log(`\n${failures.length} problem(s)`);
  process.exit(1);
}
console.log(`ok: ${skills.length} skills, references, shared copies, manifests and README agree`);
