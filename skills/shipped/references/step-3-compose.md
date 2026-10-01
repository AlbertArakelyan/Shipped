# Step 3: Compose with HyperFrames

## 3a. Write `<out>/composition-brief.md`

The brief is the boundary between the two skills. /shipped decides *what* the video says and how it should feel; HyperFrames decides *how* it's built.

```markdown
# HyperFrames Composition Brief: <Name>'s <range.label>, shipped

## Objective
A <N>-second, <format> recap of one developer's year in code, made to be posted. Story-card grammar: one idea per card, huge numbers, full-bleed color, cuts on the beat, persona reveal as the climax.

## Output
- Video composition: `<out>/composition/` → `<out>/shipped.mp4`, [W]x[H], 30fps, [N]s
- Share-card composition: `<out>/card/` → `<out>/shipped-card.png`, 1080x1350, a single still frame

## Source of truth
- Plan and storyboard: `<out>/shipped-plan.md` (the creative contract)
- Every on-screen number and quote: the plan's **Fact sheet**. Copy values exactly; format them with thousands separators, and never round in a way that changes the claim.
- Data available for visuals: `<out>/stats.json` (heatmap 7×24, byMonth, byHour, languages), `<out>/ai-stats.json` if present

## Creative direction
- Tone: [preset] — [interpretation]
- Palette per chapter: [list from the plan]
- Type: [display] / [body] (Google Fonts or a local fallback)
- Texture: [grain / halftone / scanlines / none]
- Persona motif: [description from the plan]
- Avoid: Spotify branding (logo, Circular font, green-on-black, the word "Wrapped" anywhere); emoji as icons; stock imagery; dashboards with tiny text; generic particle backgrounds; waveform/equalizer visuals

## Chapters
[one line per chapter: # — name — duration — exact copy — the visual (count-up / heatmap fill / bar race / calendar strip / cards) — sequential reveals]

## Data visuals (build from the JSON, never from screenshots)
- Heatmap: 7 rows (Mon–Sun) × 24 columns from `time.heatmap.values`. Cells fill in a sweep, the peak cell pulses once, and a label shows the peak.
- Streak: a strip of day cells for the streak's month(s), lighting up one by one, faster as it goes.
- Languages: horizontal bars, top 3–5 code languages, growing to their `pct`, with the leader's label landing last.
- Count-ups: ease-out, 0.8–1.2s, end on the exact value, then hold.

## Audio
- Music: [resolved file in composition/assets/music/ or "none"] · mood [..] · bed volume 0.30–0.40, fading out under the summary card
- Beat locks: persona reveal on the strongest cue; big-number slam and cold open on strong cues (±0.15s); sequential items on the beat grid (±0.10s) but never faster than the reading floor
- SFX guidance: `<skill-dir>/assets/sfx/sfx-analysis.md`. HyperFrames chooses exact files and times after the animation exists; copy only the used files into `composition/assets/sfx/`.
- Audio-reactive: subtle, e.g. background grain or card glow breathing on bass. Never on text size.

## HyperFrames instructions
Load `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli` (and `hyperframes-registry` for named effects). /shipped is its own workflow: don't run the `hyperframes` intent interview and don't route into another workflow. Prefer native HyperFrames conventions over anything in this brief.

Requirements:
- All text readable: big numbers hold ≥ 1.2s settled, sentences ≈ 0.3s/word.
- Safe areas (vertical): nothing important in the top 160px or bottom 220px.
- Numbers on screen exactly equal the fact sheet.
- The share card reuses the video's summary-card design at 1080x1350.
- `npx hyperframes check` passes with zero errors in both compositions.
- Everything stays local: no remote rendering or publishing.
```

## 3b. Prepare audio

Read [audio.md](audio.md). In short:

1. **Music** (unless `--no-music`): resolve one track with the `media-use` skill, using the plan's mood as the intent, into `<out>/composition/assets/music/`. If media-use isn't set up or can't resolve one, tell the user in one line and continue without music. The SFX still carry the rhythm.
2. **SFX** (unless `--no-sfx`): leave the exact picks to HyperFrames. Pass it the analysis file.
3. **Voice** (only with `--voice`): see audio.md.

## 3c. Build

1. Load the HyperFrames domain skills listed in the brief.
2. Give HyperFrames the brief, the plan, and the stats JSON paths.
3. Let it build `<out>/composition/` and `<out>/card/`, with its own structure and choice of runtime.
4. Run `npx hyperframes check` in each and fix everything it reports, including contrast.
5. Optionally run `npx hyperframes snapshot --at <t1>,<t2>,...` on the strongest beats and look at the frames before rendering.

Don't paste composition snippets from this skill into the output. The point of delegating is that HyperFrames' current guidance wins.

## 3d. Self-review before delivery

- [ ] Every number and quote on screen appears in the fact sheet, with the same value.
- [ ] No emails, prompt text or file contents are on screen. Repo and file names appear only if approved and not `--anon`.
- [ ] The persona reveal is the climax, is beat-locked, and has a build-up beat.
- [ ] At least one real data visual (heatmap, streak strip or bar race) is built from the JSON.
- [ ] Text respects the reading floor and the safe areas.
- [ ] Nothing looks like Spotify's branding.
- [ ] Duration is within ±1s of the plan.
- [ ] `hyperframes check` is clean for both compositions.
