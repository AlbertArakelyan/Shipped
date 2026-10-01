# Audio

The default is a music bed plus a few well-timed SFX. Turn them off with `--no-music` / `--no-sfx`, or when the plan deliberately chooses silence (deadpan can use near-silence as the joke).

## Music: resolved at run time, not bundled

/wrapped doesn't ship music, because we only bundle audio whose license clearly allows redistribution. Get a track per run through the HyperFrames `media-use` skill:

```bash
node <media-use-skill-dir>/scripts/resolve.mjs --type bgm --intent "<mood from plan, e.g. bright synth-pop year-in-review, builds to a drop, 120 bpm>" --project <out>/composition
```

- Let the `media-use` skill locate its own directory. Don't hardcode a path.
- Before resolving fresh, run the same command with `--candidates` and reuse a cached track if it fits the mood.
- If media-use isn't set up (its first run needs the `heygen` CLI signed in; check with `--doctor`), or nothing resolves: tell the user in one line ("No music source set up, so this one has SFX only. Run `/media-use` setup or drop an MP3 into `composition/assets/music/` and re-render."). Then continue without music. Never block the render on music.
- If the user gives their own track ("use song.mp3"), copy it into `<out>/composition/assets/music/` and use it. They're responsible for its rights; mention that once if they plan to post publicly.

Moods by tone:

| Tone | Mood intent |
|---|---|
| default | bright, bouncy synth-pop, joyful, year-in-review, clear beat ~115–125 bpm |
| hype | trailer hybrid, risers and drops, hard-hitting, 130+ bpm |
| deadpan | sparse lo-fi or plain elevator music, very low volume |
| roast | cheeky funk or comedic bounce |
| cinematic | orchestral-electronic build, slow swell to a big hit |
| retro | chiptune, 8-bit, upbeat |

Bed volume is 0.30–0.40 (0.12–0.20 for deadpan) and never above 0.5. Fade in over ~0.3s and fade out under the summary card.

## Beat sync

Once the music is wired into the composition, get the beat grid:

```bash
npx hyperframes beats <out>/composition
```

Use the highest-strength beats as strong cues:
- Lock 2–3 major moments within ±0.15s: the unwrap, the big-number slam, and the persona reveal (always).
- Snap sequential items (award cards, heatmap sweep milestones, bar-race finishes) to the beat grid within ±0.10s.
- For readable text, use every other beat at fast tempos. Readability beats rhythm.

If `beats` isn't available (older HyperFrames), write "Music cue guidance: unavailable" in the brief and time to the edit.

## SFX: bundled, CC0

38 Kenney sounds (public domain) live in `<skill-dir>/assets/sfx/{impact,interface,casino}/`. Read `<skill-dir>/assets/sfx/sfx-analysis.md` for each file's character and the safest picks by moment.

- Copy only the files actually used into `<out>/composition/assets/sfx/<family>/`. Reference them with relative paths (`assets/sfx/impact/impactSoft_medium_001.ogg`), never absolute ones.
- Put music on a low track index (e.g. 10) and give each overlapping SFX its own ascending index (11+).
- SFX volume 0.55–0.85. Repeated ticks 0.35–0.5.
- Density by tone: deadpan 1–3 · cinematic 3–4 big ones · default 5–8 · roast 6–10 (comic stings) · hype/retro dense, on most beats.
- Align a sound to the **start** of its motion. Score the first, last and strongest item of a sequence, not every item.

## Voice (only with `--voice`)

Write the narration in `wrapped-plan.md` under `## Voiceover script`. It should complement the cards, not read them aloud: the cards show "1,625", and the voice says "That's a lot of commits. Let's see where they went." Keep it short enough to fit the duration.

```bash
npx hyperframes tts "<script>" --voice af_heart --output <out>/composition/assets/voiceover.wav
```

Put the voice on its own track and duck the music to 0.12–0.15 while it speaks. Check the WAV length and adjust scene durations to fit. If it runs long, cut words rather than stretching past 45s.
