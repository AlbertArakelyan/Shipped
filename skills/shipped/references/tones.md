# Tones

A tone sets the copy voice, pacing, palette, type and transitions. It never changes the facts. Freeform directions ("like a sports broadcast", "museum audio guide") map to the nearest preset for pacing; the user's own words go in the plan and the brief.

## Shared look (all tones)

The "story card" grammar: one idea per card, full-bleed color, huge type, everything else small. Each chapter gets its own background color so cuts feel like turning pages. Numbers are the hero. Text sits on a 64px safe margin (vertical), with nothing important in the bottom 220px or top 160px, where platform UI overlays sit.

Our palette system, not Spotify's: pick 5–7 saturated colors that work as one family, and alternate light and dark cards. Don't use green-on-black as the main look.

| Tone | Voice | Pacing | Palette direction | Type | Transitions |
|---|---|---|---|---|---|
| `default` | Warm, playful, second person ("You shipped…") | Medium: 7–9 chapters, holds 1.2–1.8s | Candy brights: magenta, electric blue, lime, tangerine, lilac, cream | Heavy grotesk display (e.g. "Archivo Black", "Space Grotesk" 700), clean sans body | Hard cuts on the beat, the odd shape wipe |
| `hype` | Trailer announcer, ALL-CAPS beats, short | Fast: 9–11 chapters, some under 2s | Neon on near-black, one acid accent | Condensed extra-bold ("Anton", "Bebas Neue") | Flash cuts, zoom punches, shake on slams |
| `deadpan` | Dry, literal, one fact per card ("You committed 1,625 times. Okay.") | Slow: 6–7 chapters, long holds, lots of empty space | Off-white and one gray, one muted accent | Serif or mono, small | Plain cuts, no easing tricks |
| `roast` | Affectionate burns, never cruel; punch at habits, never at the person or their employer | Medium-fast, comic timing (beat, pause, punchline) | Loud clashing brights | Chunky display, sticker-style labels | Hard cuts, record-scratch style stops |
| `cinematic` | Epic narrator ("In a year of 1,625 commits… one file stood alone.") | Slow build, big final reveal; 6–8 chapters | Deep gradients: midnight, ember, gold | Wide-tracked serif or thin display caps | Slow push-ins, light leaks, crossfades |
| `retro` | Terminal / 8-bit game ("LEVEL 2026 COMPLETE") | Medium, stepped motion | Phosphor green or amber on black, or a 4-color game palette | Pixel or mono ("Press Start 2P", "VT323", "JetBrains Mono") | Scanline wipes, CRT power-on, glitch frames |

## Tone → copy examples

| Moment | default | roast | deadpan |
|---|---|---|---|
| Commits | "You made 1,625 commits this year." | "1,625 commits. Some of them even compiled." | "1,625 commits." |
| Late night | "23% of your commits happened after midnight." | "23% after midnight. Your sleep schedule wants a word." | "23% after midnight. Noted." |
| Fix count | "You fixed things 296 times." | "296 commits say 'fix'. The bugs are winning." | "296 fixes." |

## Registry and effects

For `retro` (CRT, scanlines, glitch) and `cinematic` (film grain, light leaks), search the HyperFrames registry (`hyperframes-registry`) before hand-building an effect.
