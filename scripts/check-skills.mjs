#!/usr/bin/env node
// Repo checks for /shipped. Run before every release (and in CI):
//   node scripts/check-skills.mjs
// - every SKILL.md has name + description frontmatter
// - skills/shipped/slim.md is identical to skills/shipped-slim/SKILL.md
// - relative links inside skill markdown point at files that exist
// - all manifests carry the same name and version
// - collector scripts parse, and a dry run over this repo succeeds

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// Frontmatter
for (const skill of fs.readdirSync(path.join(root, 'skills'))) {
  const file = `skills/${skill}/SKILL.md`;
  if (!fs.existsSync(path.join(root, file))) { errors.push(`${file} missing`); continue; }
  const fm = /^---\n([\s\S]*?)\n---/.exec(read(file).replace(/\r\n/g, '\n'));
  if (!fm) { errors.push(`${file}: no frontmatter`); continue; }
  const name = /^name:\s*(.+)$/m.exec(fm[1])?.[1].trim();
  if (name !== skill) errors.push(`${file}: name "${name}" should be "${skill}"`);
  if (!/^description:\s*\S/m.test(fm[1])) errors.push(`${file}: missing description`);
}

// slim copy in sync
if (read('skills/shipped-slim/SKILL.md') !== read('skills/shipped/slim.md')) {
  errors.push('skills/shipped/slim.md is out of sync. Fix: cp skills/shipped-slim/SKILL.md skills/shipped/slim.md');
}

// Relative links
const mdFiles = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md')) mdFiles.push(p); } };
walk(path.join(root, 'skills'));
for (const f of mdFiles) {
  for (const [, target] of fs.readFileSync(f, 'utf8').matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(f), target))) errors.push(`${path.relative(root, f)}: broken link ${target}`);
  }
}

// Manifests agree
const manifests = ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', 'plugin.json'].map((p) => [p, JSON.parse(read(p))]);
const [, first] = manifests[0];
for (const [p, m] of manifests) {
  if (m.name !== first.name) errors.push(`${p}: name ${m.name} != ${first.name}`);
  if (m.version !== first.version) errors.push(`${p}: version ${m.version} != ${first.version}`);
}
const market = JSON.parse(read('.claude-plugin/marketplace.json'));
if (!market.plugins?.some((p) => p.name === first.name)) errors.push('marketplace.json does not list the plugin');

// Collectors run
const scripts = path.join(root, 'skills/shipped/scripts');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shipped-check-'));
for (const [script, extra] of [['collect-git.mjs', ['--path', root, '--since', '2000-01-01']], ['collect-ai.mjs', ['--claude-dir', tmp, '--codex-dir', tmp]]]) {
  const r = spawnSync(process.execPath, [path.join(scripts, script), ...extra, '--out', path.join(tmp, script + '.json')], { encoding: 'utf8' });
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout).trim().split('\n').pop();
    if (script === 'collect-git.mjs' && /Not inside a git repository|No git user.email/.test(msg)) continue; // fresh checkout without git config
    errors.push(`${script} failed: ${msg}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${mdFiles.length} markdown files, ${manifests.length} manifests, collectors OK (v${first.version})`);
