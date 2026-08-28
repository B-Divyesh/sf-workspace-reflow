# Workspace Reflow visual thesis

## Direction: field-guide neo-brutalism

Workspace Reflow should feel like a dependable accessibility instrument clipped
onto a crowded desk: blunt, legible, and calm under pressure. The neo-brutalist
language uses square corners, heavy ink outlines, visible state labels, and
offset shadows. Unlike decorative brutalism, every strong edge marks a control,
selection, or reading boundary. The reflow pane itself stays quieter than the
marketing surface because reading is the product.

## Palette

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| Paper | `#FFF8E8` | `#171914` | page / reading ground |
| Surface | `#FFFFFF` | `#242820` | raised regions |
| Ink | `#151713` | `#FFFBEF` | primary text and rules |
| Muted | `#4F534B` | `#C9CCBE` | secondary copy |
| Signal yellow | `#FFD53D` | `#F5CB32` | selected region / primary action |
| Tool blue | `#2457F5` | `#8CA8FF` | focus and active reading marker |
| Proof green | `#147A45` | `#69DEA1` | saved / valid state |
| Alert red | `#B4232D` | `#FF8A92` | failure / destructive warning |

The warm paper is easier than a clinical white field for sustained reading;
yellow borrows the visual language of a physical highlighter, and blue behaves
like a machinist's active tool mark. All text combinations meet WCAG AA. The
extension also offers an explicit dark reading treatment rather than assuming
the host page theme.

## Type

- Display and controls: `Arial Black`, `Arial`, system sans-serif. Short,
  compressed labels make utility state visible at a glance.
- Reading and body: `Verdana`, `Arial`, system sans-serif. Wide counters and
  familiar forms remain clear at large sizes.
- No font files or remote requests. The system pairing is intentional for a
  local-first browser utility and avoids delaying the first readable frame.
- Scale: 16, 18, 22, 30, 46, and 68 px; reading leading ranges from 1.55–1.75.

## Spacing and shape

The base rhythm is 4 px. Common gaps are 8, 12, 16, 24, 32, 48, and 72 px.
Controls are at least 44 px tall with 8 px between targets. Corners remain
mostly square (`0–4px`) and use 2–3 px ink borders. Offset shadows use a fixed
4–8 px translation to suggest paper tools stacked on a work surface.

## Interaction grammar

- Selection is announced with a yellow crosshatch outline and a compact label.
- The reflow pane enters from the edge nearest its final position; focus moves
  to its close button and returns to the user's previous page focus on close.
- `J`/`K` and arrow keys move a blue sentence marker through the reading copy.
- Buttons depress by removing their offset shadow. Saved states use both a
  check mark and text, never color alone.
- Escape is the universal exit. Native controls and links retain their
  semantics in the extracted reading content where safe.

## Responsive intent

Desktop keeps the live workspace visible beside a right-side reading pane.
At narrow widths the pane becomes a full-screen sheet; secondary toolbar labels
shorten, controls wrap, and marketing comparison panels stack. No content or
feature disappears at 390 px.

## Motion policy

Pane and menu transitions last 180–220 ms and animate only opacity and
transform. Reading-marker changes are instant to avoid disorientation. Under
`prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed.
Nothing loops, flashes, or autoplays.

## Asset plan and provenance

- Hero: an original, generated cut-paper illustration of a dense workspace
  being physically reflowed into a broad, readable strip. It explains the
  product's “keep context, enlarge one region” model without pretending to be
  a screenshot.
- Icons and extension marks: original hand-authored SVG using the same paper,
  ink, yellow, and blue primitives.

### Hero prompt sheet

Use case: stylized-concept. Asset: landing-page hero. Subject: an abstract web
workspace made from thick cut-paper layers; a small dense list region is held
by a bright yellow selection bracket and unfolds into a large cream reading
panel with generous dark horizontal sentence marks, while surrounding cobalt
and green workspace panels remain visible. World/materials: tactile screen-print
paper, subtle fibers, crisp block shadows, square corners, neo-brutalist utility
poster. Light/lens: straight-on orthographic studio light, minimal perspective.
Palette words: warm cream, nearly-black ink, signal yellow, tool cobalt, proof
green. Composition: landscape, visual weight to the right, safe negative space,
no realistic browser chrome. Negative list: no people, no logos, no real brands,
no words, no letters, no numbers, no watermark, no gradients, no glassmorphism,
no tiny illegible pseudo-text.

Generated with the factory image deployment (`factory-image`) through
`/opt/fleet/lib/gen-image.sh` on 2026-08-28. The output is original for this
product. The selected source and exact prompt are stored in `assets/src/`.
Production derivatives are responsive AVIF and WebP files with a JPEG fallback;
each shipped hero variant remains below the 300 KB mobile-image budget.
