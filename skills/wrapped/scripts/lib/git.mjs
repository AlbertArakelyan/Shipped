// Read commits from one repository with a single `git log` call.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const RS = '\x1e';
const US = '\x1f';

export function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 30, windowsHide: true });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`git ${args[0]} failed in ${cwd}: ${(r.stderr || '').trim().split('\n')[0]}`);
  return r.stdout;
}

export function repoRoot(dir) {
  try { return path.resolve(git(dir, ['rev-parse', '--show-toplevel']).trim()); } catch { return null; }
}

export function configEmails(cwd) {
  const emails = new Set();
  for (const scope of [[], ['--global']]) {
    try {
      const e = git(cwd, ['config', ...scope, 'user.email']).trim();
      if (e) emails.add(e.toLowerCase());
    } catch {}
  }
  return emails;
}

export function configName(cwd) {
  try { return git(cwd, ['config', 'user.name']).trim(); } catch { return ''; }
}

// Returns [{ hash, name, email, date (ISO, author offset), subject, files: [{ path, added, deleted, binary }] }]
// across all local refs, merges excluded. Callers de-duplicate by hash across repos.
export function readCommits(cwd, { since, until }) {
  let out;
  try {
    out = git(cwd, [
      'log', '--all', '--no-merges', '--numstat', '--no-renames', '--date=iso-strict',
      `--since=${since}T00:00:00`, `--until=${until}T23:59:59`,
      `--format=${RS}%H${US}%an${US}%ae${US}%ad${US}%s`,
    ]);
  } catch (e) {
    if (/does not have any commits|bad default revision|unknown revision/.test(e.message)) return [];
    throw e;
  }
  const commits = [];
  for (const chunk of out.split(RS)) {
    if (!chunk.trim()) continue;
    const [header, ...rest] = chunk.split('\n');
    const [hash, name, email, date, subject] = header.split(US);
    const files = [];
    for (const line of rest) {
      const m = /^(-|\d+)\t(-|\d+)\t(.+)$/.exec(line);
      if (!m) continue;
      const binary = m[1] === '-';
      files.push({ path: m[3], added: binary ? 0 : +m[1], deleted: binary ? 0 : +m[2], binary });
    }
    commits.push({ hash, name: name || '', email: (email || '').toLowerCase(), date, subject: subject || '', files });
  }
  return commits;
}
