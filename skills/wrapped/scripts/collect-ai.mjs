#!/usr/bin/env node
// /wrapped AI-coding collector: reads local Claude Code and Codex session logs and
// writes ai-stats.json. Counts only: it never copies prompt or response text.
//
//   node collect-ai.mjs [--year 2026 | --since YYYY-MM-DD --until YYYY-MM-DD]
//                       [--claude-dir <dir>] [--codex-dir <dir>] [--anon] [--out <file>]
//
// Session logs are undocumented and change between versions, so every field is
// read defensively and lines that don't parse are skipped.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from './lib/args.mjs';
import { resolveRange, machineLocalParts, inRange, streaks, WEEKDAYS, MONTHS, pct } from './lib/time.mjs';

const args = parseArgs();
const range = resolveRange(args);
const anon = !!args.anon;
const IDLE_MS = 15 * 60 * 1000; // gaps longer than this don't count as active time

const claudeDir = path.resolve(args['claude-dir'] ?? path.join(process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude'), 'projects'));
const codexDir = path.resolve(args['codex-dir'] ?? path.join(process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'sessions'));

const sessions = new Map(); // key -> session
const sources = { claude: emptySource(), codex: emptySource() };

for (const file of jsonlFiles(claudeDir)) readClaude(file);
for (const file of jsonlFiles(codexDir)) readCodex(file);

// ---- aggregate -------------------------------------------------------------
const all = [...sessions.values()].filter((s) => s.stamps.length);
const heatmap = WEEKDAYS.map(() => Array(24).fill(0));
const byMonth = Array(12).fill(0);
const byHour = Array(24).fill(0);
const activeByDay = new Map();
const projectHours = new Map();
let activeMs = 0;
let longestSitting = null;

for (const s of all) {
  s.stamps.sort((a, b) => a - b);
  s.activeMs = 0;
  // A "sitting" is a continuous stretch with no idle gap; resumed sessions span many sittings.
  let sitStart = s.stamps[0], sitMs = 0;
  const closeSitting = () => { if (!longestSitting || sitMs > longestSitting.ms) longestSitting = { ms: sitMs, start: sitStart, project: s.project, source: s.source }; };
  for (let i = 1; i < s.stamps.length; i++) {
    const gap = s.stamps[i] - s.stamps[i - 1];
    if (gap > IDLE_MS) { closeSitting(); sitStart = s.stamps[i]; sitMs = 0; }
    if (gap <= IDLE_MS) {
      s.activeMs += gap;
      sitMs += gap;
      const t = machineLocalParts(new Date(s.stamps[i]).toISOString());
      activeByDay.set(t.day, (activeByDay.get(t.day) ?? 0) + gap);
    }
  }
  closeSitting();
  activeMs += s.activeMs;
  sources[s.source].activeMs += s.activeMs;
  projectHours.set(s.project, (projectHours.get(s.project) ?? 0) + s.activeMs);
  for (const ts of s.promptStamps) {
    const t = machineLocalParts(new Date(ts).toISOString());
    heatmap[t.weekday][t.hour]++; byMonth[t.month]++; byHour[t.hour]++;
  }
}

const promptsTotal = byHour.reduce((a, b) => a + b, 0);
const days = [...activeByDay.keys()].sort();
const { longestStreak } = streaks(days);
const busiest = [...activeByDay.entries()].sort((a, b) => b[1] - a[1])[0];
const projLabel = makeLabeler();
const merged = mergeSources();

const stats = {
  schema: 'wrapped/ai-stats@1',
  generatedAt: new Date().toISOString(),
  range,
  anonymized: anon,
  privacy: 'Counts, names of tools/models/slash commands, and project folder names only. No prompt or response text.',
  found: { claude: fs.existsSync(claudeDir), codex: fs.existsSync(codexDir) },
  totals: {
    sessions: all.length,
    prompts: promptsTotal,
    assistantMessages: merged.assistantMessages,
    toolCalls: merged.toolCalls,
    activeHours: hours(activeMs),
    activeDays: days.length,
    tokens: merged.tokens,
  },
  bySource: Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, {
    sessions: all.filter((s) => s.source === k).length, prompts: v.prompts, activeHours: hours(v.activeMs),
    toolCalls: v.toolCalls, tokens: v.tokens,
  }])),
  models: top(merged.models, 6).map(([name, count]) => ({ name, messages: count })),
  tools: top(merged.tools, 10).map(([name, count]) => ({ name, calls: count })),
  slashCommands: top(merged.slash, 8).map(([name, count]) => ({ name, uses: count })),
  subagentSessions: all.filter((s) => s.sidechain).length,
  projects: top(new Map([...projectHours].filter(([p]) => p !== 'unknown')), 6).map(([p, ms]) => ({ name: projLabel(p), activeHours: hours(ms) })),
  time: {
    longestStreak,
    longestSitting: longestSitting ? { date: machineLocalParts(new Date(longestSitting.start).toISOString()).day, startHour: new Date(longestSitting.start).getHours(), activeHours: hours(longestSitting.ms), project: projLabel(longestSitting.project), source: longestSitting.source } : null,
    busiestDay: busiest ? { date: busiest[0], activeHours: hours(busiest[1]) } : null,
    peakHour: byHour.indexOf(Math.max(...byHour)),
    lateNightPct: pct(byHour.slice(0, 5).reduce((a, b) => a + b, 0), promptsTotal),
    byMonth: Object.fromEntries(MONTHS.map((m, i) => [m, byMonth[i]])),
    byHour,
    heatmap: { rows: WEEKDAYS, cols: '0..23 (this machine local time)', values: heatmap, unit: 'prompts' },
    firstSession: all.length ? machineLocalParts(new Date(Math.min(...all.map((s) => s.stamps[0]))).toISOString()).day : null,
  },
};

const out = path.resolve(args.out ?? 'wrapped-output/ai-stats.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(stats, null, 2));
const t = stats.totals;
console.log([
  `wrapped: ${t.sessions} AI sessions (${stats.bySource.claude.sessions} Claude Code, ${stats.bySource.codex.sessions} Codex), ${t.prompts} prompts, ${t.activeHours} active hours`,
  `  ${t.toolCalls} tool calls, ${fmt(t.tokens.total)} tokens, top model: ${stats.models[0]?.name ?? 'n/a'}, top tool: ${stats.tools[0]?.name ?? 'n/a'}`,
  !stats.found.claude && !stats.found.codex ? '  (no Claude Code or Codex session logs found)' : null,
  `  -> ${out}`,
].filter(Boolean).join('\n'));

// ---- readers ---------------------------------------------------------------
function readClaude(file) {
  const src = sources.claude;
  const assistant = new Map(); // message.id -> { model, usage }
  for (const o of lines(file)) {
    const ts = Date.parse(o.timestamp);
    if (!ts || !inRange(machineLocalParts(o.timestamp).day, range)) continue;
    const s = session('claude', o.sessionId ?? file, o.cwd);
    if (o.isSidechain) s.sidechain = true;
    s.stamps.push(ts);
    const msg = o.message;
    if (o.type === 'user' && msg) {
      const c = msg.content;
      const text = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((p) => p?.type === 'text').map((p) => p.text ?? '').join('') : '';
      if (!text || o.isMeta) continue;
      const cmd = /<command-name>\s*(\/?[\w:.-]+)\s*<\/command-name>/.exec(text);
      if (cmd) { inc(src.slash, cmd[1].startsWith('/') ? cmd[1] : '/' + cmd[1]); continue; }
      if (text.startsWith('<') || o.isSidechain) continue; // system/hook/subagent payloads aren't human prompts
      src.prompts++; s.promptStamps.push(ts);
    } else if (o.type === 'assistant' && msg) {
      const id = msg.id ?? o.uuid;
      const prev = assistant.get(id) ?? {};
      assistant.set(id, { model: msg.model ?? prev.model, usage: msg.usage ?? prev.usage }); // last line per id carries final usage
      for (const p of Array.isArray(msg.content) ? msg.content : []) if (p?.type === 'tool_use' && p.name) { inc(src.tools, normalizeTool(p.name)); src.toolCalls++; }
    }
  }
  for (const { model, usage } of assistant.values()) {
    if (!model || model === '<synthetic>') continue;
    src.assistantMessages++;
    inc(src.models, prettyModel(model));
    if (usage) addTokens(src.tokens, usage.input_tokens, usage.output_tokens, usage.cache_read_input_tokens, usage.cache_creation_input_tokens);
  }
}

function readCodex(file) {
  const src = sources.codex;
  let cwd, model, lastUsage;
  const s = session('codex', file, undefined);
  for (const o of lines(file)) {
    const p = o.payload ?? o;
    const ts = Date.parse(o.timestamp ?? p.timestamp);
    if (o.type === 'session_meta') cwd = p.cwd ?? cwd;
    if (o.type === 'turn_context') { cwd = p.cwd ?? cwd; model = p.model ?? model; }
    if (!ts || !inRange(machineLocalParts(new Date(ts).toISOString()).day, range)) continue;
    s.stamps.push(ts);
    if (o.type === 'event_msg' && p.type === 'user_message') { src.prompts++; s.promptStamps.push(ts); }
    if (o.type === 'event_msg' && p.type === 'token_count' && p.info?.total_token_usage) lastUsage = p.info.total_token_usage;
    if (o.type === 'response_item') {
      if (p.type === 'function_call' || p.type === 'custom_tool_call') { inc(src.tools, normalizeTool(p.name ?? 'tool')); src.toolCalls++; }
      else if (p.type === 'local_shell_call') { inc(src.tools, 'Bash'); src.toolCalls++; }
      else if (p.type === 'message' && p.role === 'assistant') { src.assistantMessages++; if (model) inc(src.models, prettyModel(model)); }
    }
  }
  s.project = cwd ? path.basename(cwd) : 'unknown';
  if (lastUsage) addTokens(src.tokens, (lastUsage.input_tokens ?? 0) - (lastUsage.cached_input_tokens ?? 0), lastUsage.output_tokens, lastUsage.cached_input_tokens, 0);
}

// ---- helpers ---------------------------------------------------------------
function emptySource() {
  return { prompts: 0, assistantMessages: 0, toolCalls: 0, activeMs: 0, models: new Map(), tools: new Map(), slash: new Map(), tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
}

function session(source, id, cwd) {
  const key = source + ':' + id;
  if (!sessions.has(key)) sessions.set(key, { source, project: cwd ? path.basename(cwd) : 'unknown', stamps: [], promptStamps: [], sidechain: false });
  const s = sessions.get(key);
  if (cwd && s.project === 'unknown') s.project = path.basename(cwd);
  return s;
}

function* jsonlFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name.endsWith('.jsonl')) yield path.join(e.parentPath ?? e.path, e.name);
  }
}

function* lines(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { yield JSON.parse(line); } catch {}
  }
}

function mergeSources() {
  const m = { assistantMessages: 0, toolCalls: 0, models: new Map(), tools: new Map(), slash: new Map(), tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
  for (const s of Object.values(sources)) {
    m.assistantMessages += s.assistantMessages; m.toolCalls += s.toolCalls;
    for (const k of ['models', 'tools', 'slash']) for (const [n, c] of s[k]) m[k].set(n, (m[k].get(n) ?? 0) + c);
    for (const k of Object.keys(m.tokens)) m.tokens[k] += s.tokens[k];
  }
  return m;
}

function addTokens(t, input = 0, output = 0, cacheRead = 0, cacheWrite = 0) {
  t.input += input || 0; t.output += output || 0; t.cacheRead += cacheRead || 0; t.cacheWrite += cacheWrite || 0;
  t.total = t.input + t.output + t.cacheRead + t.cacheWrite;
}

function normalizeTool(name) {
  if (name.startsWith('mcp__')) return 'MCP: ' + (name.split('__')[1] ?? 'server').replace(/^claude_ai_|^plugin_[^_]+_/, '');
  if (name === 'shell' || name === 'exec_command') return 'Bash';
  if (name === 'apply_patch') return 'Edit';
  return name;
}

// "claude-opus-5-5-20260101" -> "Claude Opus 5.5"; other providers keep their id.
function prettyModel(id) {
  const m = /^claude-(?:(\d+)-(?:(\d)-)?)?(opus|sonnet|haiku|fable)(?:-(\d+)(?:-(\d{1,2})(?=$|[-[@]))?)?/i.exec(id);
  if (!m) return id;
  const fam = m[3][0].toUpperCase() + m[3].slice(1);
  const ver = m[4] ? `${m[4]}${m[5] ? '.' + m[5] : ''}` : m[1] ? `${m[1]}${m[2] ? '.' + m[2] : ''}` : '';
  return `Claude ${fam} ${ver}`.trim();
}

function makeLabeler() {
  const labels = new Map();
  return (p) => {
    if (!anon) return p;
    if (!labels.has(p)) labels.set(p, `Project ${String.fromCharCode(65 + (labels.size % 26))}`);
    return labels.get(p);
  };
}

function inc(map, key) { map.set(key, (map.get(key) ?? 0) + 1); }
function top(map, n) { return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n); }
function hours(ms) { return Math.round((ms / 3600000) * 10) / 10; }
function fmt(n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); }
