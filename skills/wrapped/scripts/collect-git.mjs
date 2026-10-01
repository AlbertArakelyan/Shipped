#!/usr/bin/env node
// /wrapped git collector: reads local git history and writes stats.json.
//
//   node collect-git.mjs [--path <repo>] [--roots <dir,dir>] [--all]
//                        [--year 2026 | --since YYYY-MM-DD --until YYYY-MM-DD]
//                        [--author <email,email>] [--anon] [--out <file>]
//
// Default: the repo containing the current directory, the current year, your git
// user.email (local + global) plus any other email committed under the same name.
// --all scans your home folder for repos (depth 4); --roots picks the folders.
// Nothing leaves the machine; the output is plain JSON for the agent to read.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, list } from './lib/args.mjs';
import { resolveRange, localParts, inRange, streaks, weekKey, WEEKDAYS, MONTHS, pct } from './lib/time.mjs';
import { languageOf, isIgnored, NON_CODE } from './lib/langs.mjs';
import { findRepos } from './lib/discover.mjs';
import { readCommits, repoRoot, configEmails, configName } from './lib/git.mjs';

const STOP = new Set('the a an and or of to in on for with from by at is it this that be as into via add added update updated use using make new more some when not no up out all'.split(' '));

const args = parseArgs();
const range = resolveRange(args);
const anon = !!args.anon;

// ---- which repos -----------------------------------------------------------
let repos;
if (args.roots || args.all) {
  const roots = args.roots ? list(args.roots) : [os.homedir()];
  repos = findRepos(roots, Number(args.depth ?? 4));
} else {
  const root = repoRoot(path.resolve(args.path ?? process.cwd()));
  if (!root) fail(`Not inside a git repository: ${args.path ?? process.cwd()}. Use --path, --roots or --all.`);
  repos = [root];
}
if (!repos.length) fail('No git repositories found.');

// With --anon, words from repo folder names are redacted from commit messages too.
const repoWords = new Set(repos.flatMap((r) => path.basename(r).toLowerCase().split(/[^a-z0-9]+/)).filter((w) => w.length > 3)); // 4+ chars so "app"/"web" don't over-redact
const repoWordRe = repoWords.size ? new RegExp([...repoWords].sort((x, y) => y.length - x.length).map((w) => w.replace(/[^a-z0-9]/g, '')).join('|'), 'gi') : null;
const redact = (text) => (anon && repoWordRe ? text.replace(repoWordRe, '***') : text); // also catches CamelCase like FooButton

// ---- which identities count as "you" ----------------------------------------
const explicit = new Set(list(args.author).map((e) => e.toLowerCase()));
const emails = new Set(explicit);
const names = new Set();
if (!explicit.size) {
  for (const r of repos) {
    configEmails(r).forEach((e) => emails.add(e));
    const n = configName(r);
    if (n) names.add(n.toLowerCase());
  }
}
if (!emails.size && !names.size) fail('No git user.email configured. Pass --author you@example.com.');

// ---- read ------------------------------------------------------------------
const seen = new Set();
const mine = [];
const skipped = [];
const otherAuthors = new Map();
for (const [i, repo] of repos.entries()) {
  if (repos.length > 1) process.stderr.write(`\rwrapped: reading ${i + 1}/${repos.length} ${path.basename(repo).slice(0, 40).padEnd(40)}`);
  let commits;
  try { commits = readCommits(repo, range); } catch (e) { skipped.push({ repo: path.basename(repo), reason: e.message.split('\n')[0] }); continue; }
  for (const c of commits) {
    if (seen.has(c.hash)) continue; // same commit in a fork/clone
    seen.add(c.hash);
    const isMe = emails.has(c.email) || (!explicit.size && names.has(c.name.toLowerCase()));
    if (!isMe) { otherAuthors.set(c.email, (otherAuthors.get(c.email) ?? 0) + 1); continue; }
    const t = localParts(c.date);
    if (!t || !inRange(t.day, range)) continue;
    mine.push({ ...c, subject: redact(c.subject), t, repo });
  }
}
if (repos.length > 1) process.stderr.write('\n');
mine.sort((a, b) => (a.date < b.date ? -1 : 1));

// ---- aggregate -------------------------------------------------------------
const repoLabel = makeRepoLabeler();
const heatmap = WEEKDAYS.map(() => Array(24).fill(0));
const byMonth = Array(12).fill(0);
const byHour = Array(24).fill(0);
const byWeekday = Array(7).fill(0);
const byDay = new Map();
const byWeek = new Map();
const langLines = new Map();
const fileStats = new Map();
const repoStats = new Map();
const identities = new Map();
const wordCounts = new Map();
let added = 0, deleted = 0, ignoredLines = 0, biggest = null;

for (const c of mine) {
  const { t } = c;
  heatmap[t.weekday][t.hour]++; byMonth[t.month]++; byHour[t.hour]++; byWeekday[t.weekday]++;
  byDay.set(t.day, (byDay.get(t.day) ?? 0) + 1);
  const wk = weekKey(t.day);
  if (!byWeek.has(wk)) byWeek.set(wk, []);
  byWeek.get(wk).push(c);
  identities.set(c.email, (identities.get(c.email) ?? 0) + 1);

  let cAdd = 0, cDel = 0, cCode = 0;
  for (const f of c.files) {
    if (f.binary) continue;
    if (isIgnored(f.path)) { ignoredLines += f.added + f.deleted; continue; }
    cAdd += f.added; cDel += f.deleted;
    const lang = languageOf(f.path);
    if (lang) langLines.set(lang, (langLines.get(lang) ?? 0) + f.added + f.deleted);
    if (lang && !NON_CODE.has(lang)) cCode += f.added + f.deleted;
    const key = c.repo + '\0' + f.path;
    const fs_ = fileStats.get(key) ?? { repo: c.repo, path: f.path, commits: 0, churn: 0 };
    fs_.commits++; fs_.churn += f.added + f.deleted;
    fileStats.set(key, fs_);
  }
  added += cAdd; deleted += cDel;
  c.size = cAdd + cDel;
  c.codeSize = cCode; // "biggest commit" ranks by code lines so a dumped data file doesn't win

  const rs = repoStats.get(c.repo) ?? { commits: 0, added: 0, deleted: 0, first: t.day, last: t.day, langs: new Map() };
  rs.commits++; rs.added += cAdd; rs.deleted += cDel; rs.last = t.day;
  for (const f of c.files) { const l = languageOf(f.path); if (l && !NON_CODE.has(l)) rs.langs.set(l, (rs.langs.get(l) ?? 0) + f.added + f.deleted); }
  repoStats.set(c.repo, rs);

  if (!biggest || c.codeSize > biggest.codeSize) biggest = c;
  for (const w of words(c.subject)) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
}

const days = [...byDay.keys()].sort();
const { longestStreak, longestBreak } = streaks(days);
const total = mine.length;
const lateNight = byHour.slice(0, 5).reduce((a, b) => a + b, 0);
const earlyBird = byHour.slice(5, 8).reduce((a, b) => a + b, 0);
const weekend = byWeekday[5] + byWeekday[6];
const busiestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
const peakHour = byHour.indexOf(Math.max(...byHour));
const peakWeekday = byWeekday.indexOf(Math.max(...byWeekday));
const peakMonth = byMonth.indexOf(Math.max(...byMonth));
const langTotal = [...langLines.values()].reduce((a, b) => a + b, 0);

const subjects = mine.map((c) => c.subject);
const countRe = (re) => subjects.filter((s) => re.test(s)).length;

const stats = {
  schema: 'wrapped/stats@1',
  generatedAt: new Date().toISOString(),
  range,
  anonymized: anon,
  scope: { repoCount: repos.length, activeRepoCount: repoStats.size, skipped },
  identities: [...identities.entries()].sort((a, b) => b[1] - a[1]).map(([email, commits]) => ({ email: anon ? maskEmail(email) : email, commits })),
  otherAuthorsTop: anon ? undefined : [...otherAuthors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([email, commits]) => ({ email, commits })),
  totals: {
    commits: total,
    linesAdded: added,
    linesDeleted: deleted,
    netLines: added - deleted,
    linesIgnored: ignoredLines,
    filesTouched: fileStats.size,
    activeDays: days.length,
    avgCommitsPerActiveDay: days.length ? Math.round((total / days.length) * 10) / 10 : 0,
  },
  time: {
    longestStreak,
    longestBreak,
    busiestDay: busiestDay ? { date: busiestDay[0], commits: busiestDay[1] } : null,
    peakHour,
    peakWeekday: WEEKDAYS[peakWeekday],
    peakMonth: MONTHS[peakMonth],
    lateNightPct: pct(lateNight, total), // 00:00 to 04:59
    earlyBirdPct: pct(earlyBird, total), // 05:00 to 07:59
    weekendPct: pct(weekend, total),
    byMonth: Object.fromEntries(MONTHS.map((m, i) => [m, byMonth[i]])),
    byWeekday: Object.fromEntries(WEEKDAYS.map((d, i) => [d, byWeekday[i]])),
    byHour,
    heatmap: { rows: WEEKDAYS, cols: '0..23 (author local time)', values: heatmap },
    first: mine[0] ? commitRef(mine[0]) : null,
    last: mine.at(-1) ? commitRef(mine.at(-1)) : null,
  },
  languages: [...langLines.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, lines]) => ({ name, lines, pct: pct(lines, langTotal), code: !NON_CODE.has(name) })),
  repos: [...repoStats.entries()].sort((a, b) => b[1].commits - a[1].commits).slice(0, 10).map(([r, s]) => ({
    name: repoLabel(r), commits: s.commits, linesAdded: s.added, linesDeleted: s.deleted, first: s.first, last: s.last,
    topLanguage: [...s.langs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  })),
  files: {
    mostCommitted: [...fileStats.values()].sort((a, b) => b.commits - a.commits).slice(0, 5).map(fileRef),
    mostChurned: [...fileStats.values()].sort((a, b) => b.churn - a.churn).slice(0, 5).map(fileRef),
  },
  biggestCommit: biggest ? {
    ...commitRef(biggest), codeLines: biggest.codeSize, lines: biggest.size, files: biggest.files.length,
    topFiles: anon ? undefined : biggest.files.slice().sort((a, b) => b.added + b.deleted - a.added - a.deleted).slice(0, 3).map((f) => f.path),
  } : null,
  messages: {
    avgLength: total ? Math.round(subjects.reduce((a, s) => a + s.length, 0) / total) : 0,
    topWords: [...wordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([word, count]) => ({ word, count })),
    counts: {
      fix: countRe(/\bfix(e[sd])?\b/i), wip: countRe(/\bwip\b/i), refactor: countRe(/\brefactor/i), revert: countRe(/^revert\b/i),
      typo: countRe(/\btypo/i), oops: countRe(/\b(oops|whoops|ugh|damn|why)\b/i), finally: countRe(/\bfinally\b/i),
      conventional: countRe(/^(feat|fix|chore|docs|refactor|test|perf|ci|build|style)(\(.+\))?!?:/i),
    },
    funnyShortlist: funnyShortlist(mine),
  },
  moments: [...byWeek.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3).map(([week, cs]) => ({
    weekOf: week,
    commits: cs.length,
    repos: [...new Set(cs.map((c) => repoLabel(c.repo)))],
    subjects: cs.slice(0, 20).map((c) => c.subject),
    sampleHashes: anon ? undefined : cs.slice().sort((a, b) => b.size - a.size).slice(0, 3).map((c) => ({ repoPath: c.repo, hash: c.hash.slice(0, 10) })),
  })),
};

const out = path.resolve(args.out ?? 'wrapped-output/stats.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(stats, null, 2));
console.log(summary(stats, out));

// ---- helpers ---------------------------------------------------------------
function fail(msg) { console.error(`wrapped: ${msg}`); process.exit(1); }

function makeRepoLabeler() {
  const labels = new Map();
  return (r) => {
    if (!anon) return path.basename(r);
    if (!labels.has(r)) labels.set(r, `Project ${String.fromCharCode(65 + (labels.size % 26))}${labels.size >= 26 ? Math.floor(labels.size / 26) : ''}`);
    return labels.get(r);
  };
}

function commitRef(c) {
  return { date: c.t.day, hour: c.t.hour, repo: repoLabel(c.repo), subject: c.subject, hash: anon ? undefined : c.hash.slice(0, 10) };
}

function fileRef(f) {
  return { repo: repoLabel(f.repo), path: anon ? `a ${languageOf(f.path) ?? 'mystery'} file` : f.path, commits: f.commits, churn: f.churn };
}

function maskEmail(e) { const [u, d] = e.split('@'); return `${u.slice(0, 1)}***@${d ?? ''}`; }

function words(s) {
  return s.replace(/\b[A-Z][A-Z0-9]+-\d+\b/g, ' ') // ticket ids like ABC-123
    .toLowerCase().replace(/^[a-z]+(\(.+?\))?!?:\s*/, '').split(/[^a-z0-9']+/).filter((w) => w.length > 2 && !STOP.has(w) && !(anon && repoWords.has(w)) && !/^\d+$/.test(w));
}

// Candidates for "funniest commit message": the agent makes the final pick.
function funnyShortlist(cs) {
  const score = (s) => {
    let p = 0;
    if (s.length <= 12) p += 2;
    if (/!{1,}/.test(s)) p += 1;
    if (/\?/.test(s)) p += 1;
    if (/[A-Z]{4,}/.test(s) && s === s.toUpperCase()) p += 2;
    if (/\p{Extended_Pictographic}/u.test(s)) p += 1;
    if (/\b(oops|whoops|ugh|why|please|again|finally|hack|hacky|temp|tmp|asdf|test|lol|wtf|final|actually|sorry|magic|pray|idk)\b/i.test(s)) p += 3;
    if (/^(wip|fix|\.|update|changes|stuff|minor)$/i.test(s.trim())) p += 2;
    return p;
  };
  const uniq = [...new Set(cs.map((c) => c.subject.trim()).filter(Boolean))];
  return uniq.map((s) => ({ s, p: score(s) })).filter((x) => x.p >= 2).sort((a, b) => b.p - a.p).slice(0, 12).map((x) => x.s);
}

function summary(s, file) {
  const t = s.totals;
  return [
    `wrapped: ${t.commits} commits across ${s.scope.activeRepoCount}/${s.scope.repoCount} repos (${s.range.since} to ${s.range.until})`,
    `  +${t.linesAdded} / -${t.linesDeleted} lines, ${t.activeDays} active days, longest streak ${s.time.longestStreak.days} days`,
    `  top language: ${s.languages.find((l) => l.code)?.name ?? 'n/a'}, peak hour ${s.time.peakHour}:00, late-night ${s.time.lateNightPct}%`,
    s.scope.skipped.length ? `  skipped ${s.scope.skipped.length} repo(s): ${s.scope.skipped.map((x) => x.repo).join(', ')}` : null,
    `  -> ${file}`,
  ].filter(Boolean).join('\n');
}
