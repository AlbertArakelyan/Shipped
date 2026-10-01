// Date helpers. Commit times are kept in the author's own local time (the offset
// recorded in the commit), so "3am commits" mean 3am where the author was.

const pad = (n) => String(n).padStart(2, '0');

export function resolveRange({ year, since, until }) {
  const y = year ? Number(year) : undefined;
  const start = since ?? (y ? `${y}-01-01` : `${new Date().getFullYear()}-01-01`);
  const end = until ?? (y ? `${y}-12-31` : isoDay(new Date()));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw new Error(`Dates must be YYYY-MM-DD (got since=${start}, until=${end})`);
  }
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return { since: start, until: end, label: y ? String(y) : sameYear ? start.slice(0, 4) : `${start} to ${end}` };
}

export function isoDay(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-03-03T02:14:09+04:00" -> { day: "2026-03-03", hour: 2, weekday: 1 (0=Mon), month: 2 (0=Jan) }
export function localParts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
  if (!m) return null;
  const [, Y, M, D, h] = m;
  const jsDay = new Date(Date.UTC(+Y, +M - 1, +D)).getUTCDay(); // 0=Sun
  return { day: `${Y}-${M}-${D}`, hour: +h, weekday: (jsDay + 6) % 7, month: +M - 1 };
}

// Same, but for a UTC timestamp converted to this machine's local time (AI transcripts store UTC).
export function machineLocalParts(isoUtc) {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return null;
  return { day: isoDay(d), hour: d.getHours(), weekday: (d.getDay() + 6) % 7, month: d.getMonth() };
}

export const inRange = (day, r) => day >= r.since && day <= r.until;

export function dayDiff(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

// Longest run of consecutive active days, and longest gap between active days.
export function streaks(daysSorted) {
  let best = { days: 0, start: null, end: null };
  let gap = { days: 0, start: null, end: null };
  let runStart = null;
  for (let i = 0; i < daysSorted.length; i++) {
    const d = daysSorted[i];
    const prev = daysSorted[i - 1];
    const diff = prev ? dayDiff(prev, d) : null;
    if (diff !== 1) runStart = d;
    if (diff && diff - 1 > gap.days) gap = { days: diff - 1, start: prev, end: d };
    const len = dayDiff(runStart, d) + 1;
    if (len > best.days) best = { days: len, start: runStart, end: d };
  }
  return { longestStreak: best, longestBreak: gap };
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Week key for grouping "moments": the Monday of that week.
export function weekKey(day) {
  const t = Date.parse(day + 'T00:00:00Z');
  const wd = (new Date(t).getUTCDay() + 6) % 7;
  return new Date(t - wd * 86400000).toISOString().slice(0, 10);
}

export const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
