# Step 1: Collect

## 1a. Ask about AI stats (once)

Unless the invocation already says `--ai` or `--no-ai`, ask one question before collecting:

> Want an "AI pair" chapter too? I'd read your local Claude Code / Codex session logs and count sessions, prompts, hours, tools and models. I never read or show what you typed or what the AI answered. (yes / no)

A yes covers this run only. Don't ask again in the same run.

## 1b. Run the collectors

```bash
mkdir -p <out>
node <skill-dir>/scripts/collect-git.mjs <scope flags> <range flags> [--author a@x.com,b@y.com] [--anon] --out <out>/stats.json
node <skill-dir>/scripts/collect-ai.mjs <range flags> [--anon] --out <out>/ai-stats.json     # only if AI = yes
```

- Scope flags: none (repo containing the current dir), `--path <repo>`, `--roots <dir,dir>`, or `--all` (home folder, depth 4; add `--depth N` to change it).
- Range flags: `--year 2026`, or `--since 2026-01-01 --until 2026-12-31`. Default: Jan 1 of this year to today.
- The git collector takes about a second per repo. For `--all` on a big machine, tell the user it may take a minute; it prints progress to stderr.
- Both scripts print a 3–4 line summary. Read that first, then open the JSON.

If `collect-git` reports **0 commits**, the user's identity is probably different in those repos. Look at `otherAuthorsTop` in `stats.json`. If an email there is clearly the user's (same name, a work domain), ask, then re-run with `--author`. Never add someone else's email without asking.

If a repo is listed under `scope.skipped`, mention it in one line and continue.

## What's in the files

`stats.json` (`wrapped/stats@1`):

| Path | Meaning |
|---|---|
| `totals.commits / linesAdded / linesDeleted / netLines / filesTouched / activeDays` | headline counts (merges, lockfiles, vendored, generated and binary files excluded) |
| `time.longestStreak {days,start,end}` / `time.longestBreak` | consecutive active days / longest gap |
| `time.busiestDay`, `peakHour`, `peakWeekday`, `peakMonth` | when you code |
| `time.lateNightPct` (00–05), `earlyBirdPct` (05–08), `weekendPct` | habits, % of commits |
| `time.heatmap.values[weekday][hour]` | 7×24 commit counts, Mon first, in the author's local time |
| `time.byMonth`, `time.byHour` | for bar/line visuals |
| `time.first`, `time.last` | first and last commit of the period |
| `languages[] {name, lines, pct, code}` | by lines changed; `code:false` marks Markdown/JSON/YAML, which can't be "top language" |
| `repos[]` | top 10 by commits |
| `files.mostCommitted[]`, `files.mostChurned[]` | most-touched files |
| `biggestCommit` | ranked by code lines; `topFiles` shows what it touched |
| `messages.counts {fix, wip, refactor, revert, typo, oops, finally, conventional}` | commit-message habits |
| `messages.topWords[]`, `messages.funnyShortlist[]` | material for awards; the shortlist is *candidates*, you pick |
| `moments[] {weekOf, commits, repos, subjects, sampleHashes}` | the 3 busiest weeks, the raw material for Step 2 |
| `identities[]` | which emails were counted as the user |

`ai-stats.json` (`wrapped/ai-stats@1`):

| Path | Meaning |
|---|---|
| `totals.sessions / prompts / toolCalls / activeHours / activeDays / tokens.total` | headline AI numbers. Active hours count only gaps of 15 minutes or less. |
| `bySource.claude`, `bySource.codex` | split by tool |
| `models[]`, `tools[]`, `slashCommands[]` | favorites |
| `projects[]` | where the AI time went |
| `time.longestSitting`, `time.busiestDay`, `time.longestStreak`, `time.peakHour` | AI habits |
| `time.heatmap` | 7×24 prompt counts |

## 1c. Privacy review (gate)

Before planning, show the user what could end up on screen, in under 15 lines:

```
Here's what your wrap can show. Nothing leaves this machine.

• Period: 2026-01-01 → 2026-10-01 · 33 repos · counted as you: a***@zeniosoft.com, a***@gmail.com
• Headline: 1,625 commits · +200,080 / −40,770 lines · 200 active days · 19-day streak
• Repo names that may appear: Cargoo_v2_Frontend, Lumark, ui, parshn-landing, Parshn-Desktop
• Commit messages I might quote (busiest weeks + funniest): "fix fix fix", "final final v2", …
• AI chapter: 50 Claude Code sessions · 657 prompts · 63 h · top tool Bash · Claude Opus 5
  (no prompt or response text)

OK to use this? You can say: hide repo names / don't quote commits / drop the AI part / remove <repo>.
```

Mask emails like the example. Apply what the user asks:

- **Hide repo names / paths:** re-run both collectors with `--anon`.
- **Don't quote commits:** note it in the plan. Step 2 then uses no commit messages on screen, only counts.
- **Remove a repo:** re-run with `--roots` listing the remaining folders, or with `--path` for a single repo.
- **Drop the AI part:** delete `ai-stats.json` and plan without it.

Move on only after an explicit OK.
