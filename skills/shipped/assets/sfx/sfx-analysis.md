# SFX library (bundled with /shipped)

38 CC0 sounds from [Kenney](https://kenney.nl/) (public domain). Signal analysis comes from [/brag](https://github.com/latent-spaces/brag)'s analyzer (MIT), filtered to the files bundled here. The full data is in `sfx-analysis.json`.

- **brightness:** warm / balanced / bright (spectral centroid).
- **HF risk:** how sharp or fatiguing the sound gets when repeated. Use low/medium risk for anything that repeats (counter ticks, list rows); keep high-risk sounds for single accents.

| File | Duration | Brightness | HF risk | Use in /shipped |
|---|---|---|---|---|
| `casino/card-fan-1.ogg` | 0.72s | bright | high | top-5 list fanning in |
| `casino/card-place-1.ogg` | 0.69s | bright | high | award card landing |
| `casino/card-place-2.ogg` | 0.46s | bright | high | award card landing |
| `casino/card-slide-1.ogg` | 0.60s | balanced | medium | story card sliding in |
| `casino/card-slide-2.ogg` | 0.58s | bright | high | story card sliding in |
| `casino/card-slide-3.ogg` | 0.60s | bright | high | story card sliding in |
| `casino/cards-pack-open-1.ogg` | 0.94s | bright | high | the cold-open reveal |
| `casino/chips-collide-1.ogg` | 0.26s | bright | high | celebration, totals landing |
| `casino/chips-collide-2.ogg` | 0.23s | bright | high | celebration, totals landing |
| `casino/chips-stack-1.ogg` | 0.29s | bright | high | count-up numbers stacking |
| `casino/chips-stack-2.ogg` | 0.17s | bright | medium | count-up numbers stacking |
| `casino/chips-stack-3.ogg` | 0.37s | bright | high | count-up numbers stacking |
| `impact/impactBell_heavy_000.ogg` | 1.48s | warm | medium | persona reveal, final card, award landing |
| `impact/impactBell_heavy_003.ogg` | 0.65s | warm | medium | persona reveal, final card, award landing |
| `impact/impactBell_heavy_004.ogg` | 0.30s | warm | medium | persona reveal, final card, award landing |
| `impact/impactGlass_light_001.ogg` | 0.21s | warm | medium | sparkle on a record, streak badge, small achievement |
| `impact/impactGlass_light_002.ogg` | 0.21s | warm | medium | sparkle on a record, streak badge, small achievement |
| `impact/impactGlass_light_003.ogg` | 0.21s | warm | medium | sparkle on a record, streak badge, small achievement |
| `impact/impactPunch_heavy_002.ogg` | 0.46s | warm | medium | hype/chaotic accents only |
| `impact/impactPunch_medium_001.ogg` | 0.41s | warm | medium | hype/chaotic accents only |
| `impact/impactSoft_heavy_001.ogg` | 0.57s | warm | medium | comedic bonk (roast tone), heavy reveal |
| `impact/impactSoft_heavy_003.ogg` | 0.54s | warm | medium | comedic bonk (roast tone), heavy reveal |
| `impact/impactSoft_medium_000.ogg` | 0.12s | warm | low | big-number slam, card transition, chapter change |
| `impact/impactSoft_medium_001.ogg` | 0.18s | warm | low | big-number slam, card transition, chapter change |
| `impact/impactSoft_medium_002.ogg` | 0.14s | warm | low | big-number slam, card transition, chapter change |
| `impact/impactSoft_medium_003.ogg` | 0.14s | warm | low | big-number slam, card transition, chapter change |
| `impact/impactSoft_medium_004.ogg` | 0.15s | warm | low | big-number slam, card transition, chapter change |
| `interface/bong_001.ogg` | 0.12s | warm | low | soft announcement, polished tone accent |
| `interface/click_002.ogg` | 0.01s | balanced | low | counter ticks, heatmap cells, selection |
| `interface/click_003.ogg` | 0.01s | balanced | low | counter ticks, heatmap cells, selection |
| `interface/click_005.ogg` | 0.01s | balanced | low | counter ticks, heatmap cells, selection |
| `interface/drop_001.ogg` | 0.11s | balanced | medium | label pop-in, stat landing, gentle placement |
| `interface/drop_002.ogg` | 0.19s | warm | medium | label pop-in, stat landing, gentle placement |
| `interface/drop_003.ogg` | 0.19s | warm | medium | label pop-in, stat landing, gentle placement |
| `interface/error_005.ogg` | 0.50s | warm | medium | comedic fail ("you typed fix 296 times") |
| `interface/glitch_002.ogg` | 0.03s | bright | low | AI section intro, tech moment (tiny accent) |
| `interface/select_008.ogg` | 0.05s | bright | medium | list focus, top-5 row highlight |
| `interface/switch_002.ogg` | 0.61s | balanced | medium | mode change, AI on |

## Safest picks by moment

- **Big number slams in:** `impact/impactSoft_medium_001.ogg` or `_004` (warm, low risk).
- **Count-up while ticking:** `interface/click_003.ogg`, at most every 2–3 frames of the count and quiet (0.35–0.5). Or a single `casino/chips-stack-*` under the whole count.
- **Story card slides in:** `casino/card-slide-*`. Vary the file between cards.
- **Award or persona reveal:** `impact/impactBell_heavy_000.ogg` once. Don't stack bells.
- **Cold-open reveal:** `casino/cards-pack-open-1.ogg`.
- **AI section switch-on:** `interface/switch_002.ogg`, or `interface/glitch_002.ogg` as a tiny accent.
