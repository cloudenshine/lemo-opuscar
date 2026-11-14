# Cloud & Ink · 云山墨序

Based on Chinese Ink Wash (`ink-wash`) from [Lemo-Opuscar by Lemomo (LemoLab)](https://github.com/lemomo-ai/lemo-opuscar). Adapted for a personal Chinese-language studio. Documentation: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), with the additional filmmaking permission in the library's LICENSE.

Default size: 1920×1080. Version 1.1.0. Selected direction: ink wash and Eastern aesthetics. The starter now moves into the leaf before returning to the wider landscape, and reserves clean paper behind the title. This is an editable implementation, not a claim of a separate visual approval.

## 1. Essence

A quiet Chinese ink painting on warm xuan paper, brought into motion by loaded strokes and the space between them. Nature and daily life carry the story. It is not a decorative title card, a flat vector drawing with a texture, or a red-and-gold festival graphic.

## 2. Materials & rendering

Generate paper procedurally. Keep wet ink and dry bristles in separate layers. Multiply ink density into paper using bleed, pigment rims and stable grain. Loaded strokes carry their own dark edge. Landscape masses fade downward into mist; water remains unpainted paper. A bamboo joint needs a pressure change and a break, not a uniform outlined tube. Cache seeded materials; no fresh random noise per frame.

## 3. Colour logic

Paper is warm ivory, approximately `#F3EFE4`; ink ranges through five densities: .16, .34, .60, .82, .96. Use depth through value, not coloured washes. Vermilion `#A63B32` belongs to one small seal only. No red titles, large red fields or gold gradients. Aim for at least 60% visually quiet space.

## 4. Type & inscriptions

Chinese is the default language. Use locally available KaiTi for a compact vertical title and SimSun for an inscription; never redistribute proprietary font files. A system font is typeset text, not a claim of stroke-traced calligraphy. This version deliberately uses quiet printed inscriptions. Titles are at most eight characters, inscription at most twenty-four, seal at most two. Keep text in paper space. Readability is checked at full resolution; platform fallback fonts may differ.

## 5. Motion quality

Render at 24 fps. Strokes grow along pressure-bearing paths; bristle gaps stay fixed along arc length. A falling leaf anticipates, turns and settles before it drifts; water rings follow contact. Let a held picture breathe before a single decisive movement. Never make the camera stutter with a stepped character.

## 6. Camera grammar

Use a slow push to notice something, lateral motion to give it room, a pull back to place it in its surroundings, or a locked frame for quiet attention. Not a mandatory sequence. Keep foreground ink away from the inscription. Transitions grow through paint or empty space; no generic slide transitions.

## 7. Sound palette

Original sparse guqin writing in a pentatonic collection, soft brush air, water and paper. Model strings with the library's `core/audio/pluck.py`; avoid generic piano. Cue sounds to actions, never loop a stock phrase. Include a literal whole-bus silence with short edge fades. Voice is optional and never added automatically; any future voice requires a transcript check. Export stereo sound with a target near −14 LUFS and true peak below −1 dBTP.

## 8. Native moves

Loaded stroke becomes a natural form; a leaf detaches from a painting and discovers blank-paper water; open ink rings reveal water without colouring it; a wash retreats into mist. Pick what the new story needs. A leaf is the demo subject, not an invariant prop.

## 9. Pitfalls

Dry brush must not become dotted dashes. Do not layer identical parallel strokes into pipe-like masses. Use one body wash and a few loaded strokes. Avoid uniform hatching, vertical gradient seams and crawling grain. Do not let dark foreground ink touch text. System fonts need a visual check for missing glyphs. A long title may occupy a whole column, so keep the column out of painted masses. Preserve readability across every frame.

## 10. Engine

Own scene source: [demo/scene.ts](demo/scene.ts). The project creator strips TypeScript into a generated per-project `scene.js`, leaving editable TypeScript source beside it. Upstream MIT engines: `styles/ink-wash/demo/ink.js`, `comp.js`, `land.js`, and `core/lib.js`. Original score: `studio/audio/score.py`. The library must be available at runtime. Film pages expose `READY`, `render(t)`, `DUR`, `EV`, and `TEXTS(t)`.

## 11. Variation space

New films may use tea steam, a bridge after rain, a crane returning, a family garden or a cultural product. Direct a new treatment and new staging; changing only `content.json` is a technical template variation. Story, props, camera route, tempo and ending remain free. A fresh project retains its own scene source and content; style upgrades never overwrite existing films.
