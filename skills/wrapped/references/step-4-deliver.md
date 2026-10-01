# Step 4: Render and deliver

## Preview (optional, recommended)

```bash
cd <out>/composition
npx hyperframes preview
```

Give the user the localhost URL and offer them a look before the final render. If they ask for changes, edit and re-run `check`.

## Render

```bash
cd <out>/composition
npx hyperframes render --quality high --output ../wrapped.mp4
```

For a quick iteration pass, use `--quality draft`.

## Poster frame → `wrapped.jpg`, baked as frame 0

The poster is what people see before they press play: in a feed, a DM or a link preview. The best poster is usually the **persona reveal** fully settled, or the **summary card**. Pick a moment where the text has fully landed and isn't exiting yet; the plan's timings tell you the window.

```bash
ffmpeg -y -ss <t> -i ../wrapped.mp4 -frames:v 1 -q:v 2 ../wrapped.jpg
```

If the frame lands mid-motion, move it a few tenths of a second and extract again.

Then bake the poster in as the video's frame 0, so every player's idle thumbnail shows it. This *replaces* frame 0 rather than adding a frame, so duration and audio sync stay exactly the same:

```bash
cd <out>
ffmpeg -y -i wrapped.mp4 -i wrapped.jpg \
  -filter_complex "[1:v]scale=<W>:<H>[p];[0:v][p]overlay=enable='eq(n\,0)',format=yuv420p[v]" \
  -map "[v]" -map 0:a? -c:v libx264 -crf 18 -preset medium -c:a copy -movflags +faststart wrapped.tmp.mp4 \
  && mv wrapped.tmp.mp4 wrapped.mp4
```

## Share card → `wrapped-card.png`

```bash
cd <out>/card
npx hyperframes check
npx hyperframes render --output ../card.mp4
ffmpeg -y -sseof -0.1 -i ../card.mp4 -frames:v 1 ../wrapped-card.png && rm ../card.mp4
```

(If `npx hyperframes snapshot` can write a full-resolution PNG in the installed version, it's fine to use that instead.) Check it at 1080×1350: it must read on a phone at thumbnail size. That means 4–6 numbers, the persona, the name and the period. Nothing else.

## Share copy → `share-copy.txt`

Write 3 variants. All are first person, specific, and use a real number. No corporate tone.

```
X / Threads:  1,625 commits, a 19-day streak, and apparently I'm a Midnight Refactorer. My 2026 in code 👇 #CodeWrapped
LinkedIn:     2026 in code: 1,625 commits across 33 projects, mostly TypeScript and Vue. The biggest week was a 91-commit filter rewrite in March. Made with /wrapped.
Short:        My year in code, wrapped. 🎁
```

Add the "Made with /wrapped" credit line only to the LinkedIn variant, and the user can delete it.

## Final check

Run `ffmpeg -i <out>/wrapped.mp4` to confirm the duration and resolution. Then snapshot or extract 4–6 frames (the big number, heatmap, languages, AI, persona, summary) and compare each number against the fact sheet. Fix and re-render if anything differs.

## Hand-off message

Keep it short:

```
Your 2026 wrap is ready 🎁
  video   wrapped-output/wrapped.mp4  (1080×1920, 41s)
  poster  wrapped-output/wrapped.jpg
  card    wrapped-output/wrapped-card.png
  copy    wrapped-output/share-copy.txt
Persona: The Midnight Refactorer. Want a different tone (try --tone roast), a square version, or a re-cut?
```
