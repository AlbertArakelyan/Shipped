---
name: wrapped-slim
description: Turn someone's year in code into a short, shareable Wrapped-style recap video (vertical MP4, share card, share copy) from local git history and, with permission, Claude Code / Codex session logs. One file, no bundled assets; built entirely by the model with the tools already on the machine. Use when someone says "/wrapped-slim", "my year in code", or "code wrapped". If the /wrapped skill is also installed, let /wrapped handle those phrases; it hands off here on Opus 5.5.
---

# /wrapped-slim

Your year in code, wrapped. You make the whole thing yourself (data, story, visuals, audio, render) with whatever tools are on the machine.

Usage: `/wrapped-slim [options]`. Options can be flags or plain language:

| Option | Default |
|---|---|
| scope: current repo · `--all` (every repo under home) · `--roots <dirs>` | current repo (if not in a repo, ask) |
| `--year <YYYY>` or `--since/--until` | current year to date |
| `--ai` / `--no-ai` | ask once |
| `--format vertical\|square\|landscape` | vertical 1080×1920 (square 1080×1080, landscape 1920×1080), 30fps |
| `--duration <s>` | 30–45s |
| `--tone default\|hype\|deadpan\|roast\|cinematic\|retro\|<freeform>` | default |
| `--anon` | off: hides repo names, paths, emails |

Write the deliverables to `wrapped-output/` in the current directory (`wrapped-output-YYYY-MM-DD-HHmmss/` if it already exists). Keep every intermediate file in a `work/` subfolder inside it.

## 1. Collect

If the /wrapped collectors are installed (`scripts/collect-git.mjs` and `scripts/collect-ai.mjs` in this skill's directory, or in `../wrapped/scripts/` next to it), run them with the same flags:

```bash
node <scripts>/collect-git.mjs [--all | --roots a,b | --path repo] [--year YYYY] [--anon] --out wrapped-output/stats.json
node <scripts>/collect-ai.mjs [--year YYYY] [--anon] --out wrapped-output/ai-stats.json   # only if AI = yes
```

Otherwise compute the same facts yourself with `git log --all --no-merges --numstat --date=iso-strict` per repo. Count the user's identities (git `user.email` local + global, plus emails committed under the same `user.name`), de-duplicate commits by hash, and exclude lockfiles, vendored, build and generated files from line counts. Facts to compute:
- totals: commits, lines added and deleted, active days
- time: longest streak, busiest day, peak hour and weekday, late-night % (00–05), weekend %, a 7×24 heatmap
- top languages by lines changed, top repos, most-committed file, biggest commit by code lines
- commit-message habits (how often "fix" appears) and the 3 busiest weeks with their commit subjects

**AI stats** are opt-in. Ask once unless the user passed `--ai` / `--no-ai`. If yes, read `~/.claude/projects/**/*.jsonl` and `~/.codex/sessions/**/*.jsonl` for **counts only**: sessions, human prompts, tool calls by name, models, active hours (gaps of 15 minutes or less), the longest sitting, and top projects. Never copy prompt or response text anywhere.

**Privacy gate:** before planning, show the user a short list of what could appear on screen: period, identities (masked), headline numbers, repo names, commit messages you might quote, and the AI numbers. Wait for an OK. Apply what they ask (anonymize, no quotes, drop AI, remove a repo).

## 2. Story and plan

Read the busiest weeks' commit subjects (and `git show --stat` on one or two big commits) to find what actually happened. Write `wrapped-plan.md`:
- a one-line story of the year
- 6–9 chapters with exact copy and durations that sum to the target
- 3 awards grounded in the numbers
- one persona
- the summary card
- a **fact sheet** that maps every on-screen number to its source

**Default arc:** Unwrap ("<Name>'s 2026, in code") → the big number (count-up) → lines added and deleted → when you code (heatmap filling in) → streak → languages (bar race) → the busiest week as a story → 3 awards → AI pair (if allowed) → "your coding personality is…" → **persona reveal** (the climax) → summary card.

**Personas** (take the first that matches): Claude Whisperer (≥500 prompts and ≥40h AI) · Midnight Refactorer (late-night ≥15%) · Weekend Warrior (weekend ≥30%) · Early Bird (05–08 ≥15%) · Marathoner (streak ≥30 days) · Marie Kondo (deleted ≥0.6× added) · Professional Fixer ("fix" in ≥25% of messages) · Polyglot (≥5 code languages at ≥3%) · Ship-It Sprinter (≥25 commits in a day or ≥60 in a week) · Big-Bang Builder (one commit ≥3,000 code lines) · Architect (≥6 active repos) · Steady Shipper (fallback). Show the name big, a one-liner in the tone's voice, and one supporting number.

## Creative laws

- **True.** Every number on screen comes from the collected stats. Jokes and framing are free; facts aren't.
- **Private.** No emails, prompt text or file contents on screen, ever. Names and quotes appear only if the user approved them.
- **Ours, not Spotify's.** Wrapped is a format. No Spotify logo, Circular font, green-on-black look, or the words "Spotify Wrapped".
- **Story cards.** One idea per card, full-bleed saturated color that changes every chapter, huge numbers, small everything else. Cuts land on the beat.
- **Real data visuals.** Build the heatmap, streak strip and bar race from the JSON, not from screenshots or stock charts.
- **Readable.** Count-ups take 0.8–1.2s and then hold at least 1.2s. Sentences hold about 0.3s per word. Keep clear of the top 160px and bottom 220px on vertical.
- **Every frame postable.** Freeze any frame and it should be worth sharing.
- **Tones:** default (warm, playful, candy brights) · hype (trailer caps, neon, fast) · deadpan (dry, long holds, near-mono palette) · roast (affectionate burns at habits, never at the person) · cinematic (epic narrator, deep gradients, slow build) · retro (terminal / 8-bit, phosphor colors, scanlines).

## Sound

Write the music and the effects as one piece, with effects in the same key and space as the music and mixed softly under it. If there's no music source on the machine, generate a simple bed (synth pad, kick on the beat, a riser into the persona reveal) or go SFX-only. Tell the user which. Lock the persona reveal to the strongest hit.

## 3. Build, check, render

Build it with whatever works on this machine: HyperFrames if installed, otherwise an HTML page where every frame is a pure function of time, captured headlessly frame by frame and encoded with ffmpeg. Wait for fonts to load before capturing.

Before the full render, look at stills from every chapter and from mid-transition. Fix overflow, collisions and low contrast. Then render `wrapped.mp4`.

## 4. Deliver

- **Poster:** the strongest settled frame (usually the persona or summary card) saved as `wrapped.jpg` and baked in as frame 0 of `wrapped.mp4`. Replace frame 0 rather than adding a frame.
- **Share card:** `wrapped-card.png` at 1080×1350, the summary card redesigned for a feed: 4–6 numbers, the persona, name and period.
- **`share-copy.txt`:** X, LinkedIn and short variants. First person, specific, with a real number, matching the tone.
- **Final check:** compare 4–6 rendered frames against the fact sheet.
- **Tell the user** where everything is, name their persona, and offer another tone or format.
