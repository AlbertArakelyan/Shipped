# Personas

The persona is the climax of the video, and it's the part people screenshot. Pick exactly one.

**How to pick:** walk the table top to bottom and take the **first** persona whose rule matches. Rules use `stats.json` (`s`) and `ai-stats.json` (`ai`, only if AI stats were collected). If nothing matches, use **The Steady Shipper**.

| # | Persona | Rule | One-liner (adapt to tone) |
|---|---|---|---|
| 1 | **The Claude Whisperer** | `ai.totals.prompts ≥ 500` and `ai.totals.activeHours ≥ 40` | You don't code alone. You conduct. |
| 2 | **The Midnight Refactorer** | `s.time.lateNightPct ≥ 15` | Your best ideas show up after midnight, and so do your commits. |
| 3 | **The Weekend Warrior** | `s.time.weekendPct ≥ 30` | Saturdays are for shipping. |
| 4 | **The Early Bird** | `s.time.earlyBirdPct ≥ 15` | Pushed before the coffee finished brewing. |
| 5 | **The Marathoner** | `s.time.longestStreak.days ≥ 30` | You showed up. Every. Single. Day. |
| 6 | **The Marie Kondo** | `s.totals.linesDeleted ≥ 0.6 × s.totals.linesAdded` | Your favorite key is backspace. Codebases spark joy now. |
| 7 | **The Professional Fixer** | `s.messages.counts.fix ≥ 0.25 × s.totals.commits` | If it's broken, you've already got a branch for it. |
| 8 | **The Polyglot** | ≥ 5 entries in `s.languages` with `code: true` and `pct ≥ 3` | You don't have a stack. You have a buffet. |
| 9 | **The Ship-It Sprinter** | `s.time.busiestDay.commits ≥ 25` or `s.moments[0].commits ≥ 60` | When you go, you GO. |
| 10 | **The Big-Bang Builder** | `s.biggestCommit.codeLines ≥ 3000` | Why make ten small commits when one will do. |
| 11 | **The Architect** | `s.repos.length ≥ 6` | Many projects, one mind behind them all. |
| 12 | **The Steady Shipper** | fallback | No drama. Just a year of good work, shipped. |

## Rules for the reveal

- Show the persona's **name big**, then the one-liner, then **one supporting number** from its rule (e.g. "23% of your commits landed between midnight and 5am").
- Build up to it first: a short beat like "And your coding personality is…" (about 1s) before the reveal. Lock the reveal to a strong music cue.
- Each persona gets its own visual motif, a symbol you design in HTML/SVG. No emoji, no stock icons. Ideas:
  - Midnight Refactorer: crescent moon over a terminal cursor
  - Marathoner: a calendar strip that never breaks
  - Claude Whisperer: two cursors typing in sync
  - Marie Kondo: lines folding neatly away
  - Polyglot: overlapping syntax glyphs
- Tone changes the one-liner, not the persona. In `roast`: "Your best ideas show up after midnight. So do your worst." In `deadpan`: "You commit at night. That is all."
- In the video, the persona name is free creative framing. The supporting number is a fact and goes in the fact sheet.
