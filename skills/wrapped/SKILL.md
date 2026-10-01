---
name: wrapped
description: Turn someone's year in code into a short, shareable, Wrapped-style recap video, rendered locally with HyperFrames. Reads local git history (one repo or every repo on the machine) and, with permission, Claude Code / Codex session logs, then finds the story of the year and renders a vertical MP4, a share card and share copy. Use when someone says "/wrapped", "my year in code", "code wrapped", "wrap up my year", "year in review video", or wants a recap of their coding year to post.
---

# /wrapped

Your year in code, wrapped. A 30–45 second vertical recap video people actually want to post.

It runs fully locally. Commit messages, repo names and AI usage stay on the machine, and nothing appears on screen until the user has reviewed it.

## Invocation dispatch (must happen first)

**Model check.** If you are Claude Opus 5.5 and the invocation doesn't ask for the full workflow (`--full`, "use the full wrapped") or for voiceover (`--voice`), switch to wrapped-slim: read `<skill-dir>/slim.md` and follow it for the rest of this run instead of this file. Pass along every option. Tell the user in one line first, e.g. "You're on Opus 5.5, so I'm using /wrapped-slim: I build the whole video myself. Say 'use the full wrapped' to switch back." If you are any other model, or can't tell which model you are, skip this check.

Parse the complete invocation before doing anything else. Users may pass flags or plain language ("wrap up my whole year, all my repos, make it roast me").

| Option | Values | Default |
|---|---|---|
| scope | current repo / `--all` (every repo under the home folder) / `--roots <dir,dir>` | current repo; if the current dir isn't a repo, ask: all repos, or which folder |
| `--year` | `2026`, or `--since YYYY-MM-DD --until YYYY-MM-DD` | current year |
| `--ai` / `--no-ai` | include Claude Code / Codex stats | **ask once** (see Step 1) |
| `--author` | extra emails, comma-separated | git `user.email` (local + global) + any email committed under the same `user.name` |
| `--format` | `vertical` (1080×1920), `square` (1080×1080), `landscape` (1920×1080) | `vertical` |
| `--duration` | seconds | auto, 30–45s |
| `--tone` | preset or freeform | `default` |
| `--anon` | hide repo names, file paths, emails | off |
| `--name` | name or handle on the title card | git `user.name` |
| `--no-music` / `--no-sfx` | flags | music and SFX on |
| `--voice` | Kokoro narration | off |

Tone presets (full definitions in [references/tones.md](references/tones.md)): `default` (bold, joyful), `hype` (trailer energy), `deadpan` (dry facts, long holds), `roast` (affectionate burns), `cinematic` (epic, slow reveals), `retro` (CRT, 8-bit terminal). A freeform tone ("like a nature documentary about my commits") maps to the nearest preset for pacing; keep the user's wording in the plan.

## Output directory

Write everything to `wrapped-output/` in the current directory. If it already exists, use `wrapped-output-YYYY-MM-DD-HHmmss/` (timestamp taken once at the start of the run). Below, `<out>` means whichever one this run uses.

When scope is `--all` or `--roots`, write the output in the directory the user ran the command from, not inside one of the scanned repos.

## Skill directory

`<skill-dir>` is the directory containing this `SKILL.md`. Claude Code prints it as "Base directory for this skill" when the skill loads; for other agents it's wherever the skill was installed. Scripts are under `<skill-dir>/scripts/`, sounds under `<skill-dir>/assets/sfx/`. Don't guess an install path.

## Requirements

Node 18+, git and ffmpeg on PATH, plus the HyperFrames skills (`hyperframes-core`, `-animation`, `-creative`, `-keyframes`, `-cli`, `media-use`). If the HyperFrames skills are missing, tell the user to run `npx skills add heygen-com/hyperframes --all` (or `npx hyperframes skills`), then stop. Don't try to build the video without them; `/wrapped-slim` is the no-HyperFrames path.

---

## Step 1: Collect

**Read:** [references/step-1-collect.md](references/step-1-collect.md)

Run the bundled collectors: `collect-git.mjs` always, and `collect-ai.mjs` only if the user said yes to AI stats. They write `<out>/stats.json` and `<out>/ai-stats.json`. Then show the user a short privacy review of everything that could appear on screen.

**Gate:** the stats files exist, and the user has approved the privacy review (or asked for changes, which you've applied by re-running with `--anon` / `--author` / a narrower scope).

---

## Step 2: Find the story

**Read:** [references/step-2-story.md](references/step-2-story.md) and [references/personas.md](references/personas.md)

Turn numbers into a story. Look at the 3 busiest weeks' commits and a few diffs to work out what actually happened. Choose the chapters, 3 awards and a persona, then write `<out>/wrapped-plan.md` with a full storyboard.

**Gate:** `<out>/wrapped-plan.md` exists. Scene durations sum to the target (30–45s). Every number on screen is copied from `stats.json` / `ai-stats.json`, and the plan's "Fact sheet" section lists each one next to its JSON path.

---

## Step 3: Compose with HyperFrames

**Read:** the HyperFrames domain skills `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. /wrapped is its own workflow: do not enter the `hyperframes` entry-point intent interview or route into a generic HyperFrames workflow.
**Read:** [references/step-3-compose.md](references/step-3-compose.md) and [references/audio.md](references/audio.md)

Write `<out>/composition-brief.md`, prepare audio, and let HyperFrames build `<out>/composition/` (the video) and `<out>/card/` (the share card).

/wrapped owns the story, numbers, chapter order, copy, tone, palette direction and audio choice. HyperFrames owns the composition structure, animation mechanics, exact timing, linting and rendering.

**Gate:** `npx hyperframes check` passes with zero errors in both `<out>/composition/` and `<out>/card/`.

---

## Step 4: Render and deliver

**Read:** [references/step-4-deliver.md](references/step-4-deliver.md)

Render `<out>/wrapped.mp4`. Pick the best settled frame as `<out>/wrapped.jpg` and bake it in as frame 0. Export `<out>/wrapped-card.png` and write `<out>/share-copy.txt`.

**Gate:** all four files exist. Re-read the rendered frames once against the fact sheet: no number on screen differs from the stats.

---

## Non-negotiables

- **Truth over hype.** Numbers come only from the collector output. Jokes, framing and persona names are free; facts are not. "You wrote 200,080 lines" must be what `totals.linesAdded` says.
- **Privacy first.** Never put prompt text, response text, emails, or file contents on screen. Commit messages and repo or file names appear only if the user approved them in the privacy review. AI stats are opt-in.
- **Not Spotify.** "Wrapped" is the format, not the brand. No Spotify logo, green-on-black Spotify palette, Circular font, or the words "Spotify Wrapped" in the video. Use our own look.
- **Readable.** Big numbers hold at least 1.2s once settled. Sentences hold about 0.3s per word. Fast motion, never fast reading.
- **Local only.** No uploads, publishing or cloud rendering unless the user explicitly asks for it later.
