# Step 2: Find the story

A recap is good when it feels like *this person's* year and not a stats dashboard. The numbers are the skeleton; the story comes from what the commits say.

## 2a. Read the moments

For each of the 3 `moments` in `stats.json`:

1. Read its `subjects`. What was going on that week? Look for a theme: a launch, a migration, a redesign, a bug hunt, a new project.
2. If `sampleHashes` exist (not in `--anon`) and the subjects are vague ("fix", "wip"), run `git -C <repoPath> show --stat --format=%s <hash>` on one or two of them. Look at file names and the shape of the change. Don't read whole diffs and don't quote code.
3. Write one line per moment: "Week of Mar 2 — 91 commits — the great filter rewrite in Cargoo_v2_Frontend."

Also look at:

- `biggestCommit` and its `topFiles`: what was the big drop?
- `files.mostCommitted[0]`: the file you couldn't leave alone.
- `time.first` / `time.last`: how the year opened and where it is now.
- `messages.funnyShortlist`: pick at most **one** to quote. Choose something funny but harmless. Skip anything with names, customer data, swearing aimed at people, or security details. If none qualifies, quote none.

If the user said "don't quote commits", describe moments in your own words ("a 91-commit week on filters") and quote nothing.

## 2b. Choose the chapters

The default arc for vertical, 30–45s. Pick 6–9 chapters; cut the weakest rather than speeding up.

| # | Chapter | Typical length | Data |
|---|---|---|---|
| 1 | **Cold open**: "<Name>'s 2026, in code" | 2.5s | `range`, `--name` |
| 2 | **The big number**: commits, counting up | 3s | `totals.commits` |
| 3 | **Lines**: added vs deleted, with a beat on net | 3s | `totals.linesAdded/Deleted/netLines` |
| 4 | **When you code**: heatmap fills in, peak called out | 4s | `time.heatmap`, `peakHour`, `peakWeekday`, `lateNightPct` |
| 5 | **Streak**: calendar strip lights up day by day | 3s | `time.longestStreak` |
| 6 | **Languages**: top 3–5 as a bar race | 3.5s | `languages` (code only) |
| 7 | **Top repos** (skip in `--anon` if it's only "Project A/B/C") | 3s | `repos` |
| 8 | **The moment**: the busiest week told as a story | 4s | `moments[0]` + 2a |
| 9 | **Awards**: 3 cards | 5s | see 2c |
| 10 | **AI pair** (only with AI stats) | 5s | `ai-stats.json` |
| 11 | **Persona reveal** (the climax) | 4s | `personas.md` |
| 12 | **Summary card** (doubles as the share card) | 4s | best 4–6 numbers + persona |

Rules:
- Lead with the most impressive or the funniest number, not always commits. If `longestStreak.days` ≥ 30, or `lateNightPct` ≥ 15, that's the hook.
- Never show a chapter whose number is embarrassing in a bad way (e.g. "longest streak: 1 day"). Reframe it ("You code in bursts: 47 separate sprints") or drop it.
- If total commits are under ~40, go shorter (25–30s) and lean on the moment and the persona.
- The AI chapter talks about the *partnership*: "You and Claude: 657 prompts, 63 hours, 4,986 tool calls. Favorite move: Bash." Not "AI wrote your code."

## 2c. Awards (pick 3)

Each award is a title plus one number and a one-line reason. Make them affectionate, never mean, even in `roast` tone. All are grounded in the stats:

| Award | Condition | Data |
|---|---|---|
| The File You Couldn't Leave Alone | always available | `files.mostCommitted[0]` |
| 3am Hero | `lateNightPct` ≥ 5 | `lateNightPct` |
| Early Bird | `earlyBirdPct` ≥ 10 | `earlyBirdPct` |
| Weekend Warrior | `weekendPct` ≥ 20 | `weekendPct` |
| Professional Fixer | `counts.fix` / `commits` ≥ 0.15 | `counts.fix` |
| Conventional Citizen | `counts.conventional` / `commits` ≥ 0.5 | `counts.conventional` |
| The Big Drop | always available | `biggestCommit.codeLines` |
| Marie Kondo | `linesDeleted` / `linesAdded` ≥ 0.6 | `linesDeleted` |
| Polyglot | ≥ 5 code languages with ≥ 3% | `languages` |
| Commit Message Poet | a quote picked in 2a | the quote |
| Slash Command Fan (AI) | `slashCommands[0].uses` ≥ 5 | `slashCommands[0]` |
| Bash Enjoyer / Edit Machine (AI) | top tool | `tools[0]` |

## 2d. Persona

Pick one persona from [personas.md](personas.md) using its rules. The persona is the climax, so the reveal needs a build-up beat.

## 2e. Write `<out>/shipped-plan.md`

```markdown
# Shipped Plan: <Name>, <range.label>

## Story in one line
[e.g. "A Vue-and-TypeScript year that peaked with a 91-commit filter rewrite in March."]

## Tone
- Preset: [default / hype / deadpan / roast / cinematic / retro]
- Direction: [user's words, if any]
- Interpretation: [one sentence on pacing and voice]

## Format: [vertical] [1080x1920] · Duration: [N]s

## Look
- Palette per chapter: [e.g. 1 hot magenta, 2 electric blue, 3 lime ...] (see tones.md)
- Display type: [font] · Body: [font]
- Texture: [grain / halftone / none]

## Chapters
### 1 — Cold open — 2.5s
On screen: [exact copy]
Motion idea: [e.g. the year number stamps in, then the title types out]
Sequential: [none / what appears one by one]
Audio: [intent]
Transition → 2: [hard cut / wipe / match]
[... every chapter ...]

## Awards
1. [title] — [number] — [one line]
2. ...
3. ...

## Persona
[name] — [one-line description] — why: [the rule it matched]

## Summary card (share card)
[the 4–6 numbers + persona, exact text]

## Fact sheet
| On screen | Value | Source |
|---|---|---|
| "1,625 commits" | 1625 | stats.totals.commits |
| ... | ... | ... |

## Audio direction
- Music mood: [e.g. bright synth-pop, 115–125 BPM, builds to the persona]
- SFX posture: [sparse / moderate / dense]
- Beat-locked moments: [persona reveal, big number slam]

## Share copy (draft)
[one line, first person, e.g. "1,625 commits, a 19-day streak and apparently I'm a Midnight Refactorer. My 2026 in code 👇"]
```

## Reading time

- A big number with a one-line label needs at least 1.2s settled.
- A sentence needs about 0.3s per word, minimum 1.2s.
- Count-ups run 0.8–1.2s, then **hold**. The hold is the moment.
- Award cards: give each card at least 1.4s fully visible, or reveal them fast and then hold all three together for at least 2s.
