// Find git repositories under one or more root folders.
import fs from 'node:fs';
import path from 'node:path';

const SKIP = new Set([
  'node_modules', 'AppData', 'Library', 'vendor', 'dist', 'build', 'target', 'venv', '__pycache__',
  'Applications', 'Program Files', 'Program Files (x86)', 'Windows', '$Recycle.Bin', 'OneDrive',
  'Music', 'Pictures', 'Videos', 'Movies',
]);

export function findRepos(roots, maxDepth = 4) {
  const found = new Set();
  const walk = (dir, depth) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (entries.some((e) => e.name === '.git')) { found.add(path.resolve(dir)); return; } // don't descend into a repo
    if (depth >= maxDepth) return;
    for (const e of entries) {
      if (!e.isDirectory() || SKIP.has(e.name) || e.name.startsWith('.')) continue;
      walk(path.join(dir, e.name), depth + 1);
    }
  };
  for (const r of roots) walk(path.resolve(r), 0);
  return [...found].sort();
}
