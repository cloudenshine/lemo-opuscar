# Cloud & Ink · 云山墨序

Based on Chinese Ink Wash (`ink-wash`) from [Lemo-Opuscar by Lemomo (LemoLab)](https://github.com/lemomo-ai/lemo-opuscar). Adapted for a personal Chinese-language studio. Documentation: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), with the additional filmmaking permission in the library's LICENSE.

Default size: 1920×1080. Version 1.4.0. Selected direction: ink wash and Eastern aesthetics. The starter uses landscape, bamboo detail, branch, leaf-follow, water-insert and landscape-return framings. This is an editable implementation, not a claim of a separate visual approval.

## 1. Essence

A quiet Chinese ink painting on warm xuan paper, brought into motion by loaded strokes and the space between them. Nature and daily life carry the story. It is not a decorative title card, a flat vector drawing with a texture, or a red-and-gold festival graphic.

## 2. Materials & rendering

Generate paper procedurally. Keep wet ink and dry bristles in separate layers. Multiply ink density into paper using bleed, pigment rims and stable grain. Loaded strokes carry their own dark edge. Landscape masses fade downward into mist; water remains unpainted paper. A bamboo joint needs a pressure change and a break, not a uniform outlined tube. Cache seeded materials; no fresh random noise per frame.

## 3. Colour logic

Paper is warm ivory, approximately `#F3EFE4`; ink ranges through five densities: .16, .34, .60, .82, .96. Use depth through value, not coloured washes. Vermilion `#A63B32` belongs to one small seal only. No red titles, large red fields or gold gradients. Aim for at least 60% visually quiet space.

## 4. Type & inscriptions

Chinese is the default language. Use locally available KaiTi for a compact vertical title and SimSun for an inscription; never redistribute proprietary font files. A system font is typeset text, not a claim of stroke-traced calligraphy. This version deliberately uses quiet printed inscriptions. Titles are at most eight characters, inscription at most twenty-four, seal at most two. Keep text in paper space. Readability is checked at full resolution; platform fallback fonts may differ.

## 5. Motion quality

Render at 24 fps. Strokes grow along pressure-bearing paths; bristle gaps stay fixed along arc length. An articulated bird can land, settle, observe and depart: keep planted feet in the same world coordinates as the branch while body, head, wings and tail respond separately. A hop releases contact only after a crouch; fixed-length two-segment legs connect hips and feet, with the torso absorbing landing. Wings have separate shoulder and wrist motion, and tails counterbalance gusts. This is a reusable performance principle, not a mandatory bird. A falling leaf anticipates, turns and settles before it drifts; water rings follow contact. Let a held picture breathe before a single decisive movement. Never make the camera stutter with a stepped character.

## 6. Camera grammar

Use a slow push to notice something, lateral motion to give it room, a pull back to place it in its surroundings, or a locked frame for quiet attention. Not a mandatory sequence. Keep foreground ink away from the inscription. Transitions grow through paint or empty space; no generic slide transitions.

## 7. Sound palette

Original sparse guqin writing, a synthesized breath-led flute answer, soft brush air and water. Bird calls and wing air are explicitly synthesized. Model strings with `core/audio/pluck.py`; the flute is a synthesis voice, not a recorded xiao. Music, ambience, material actions and transitions are separate buses. Use two literal whole-bus silences after reverb, with short edge fades; duck music under important contact sounds. Voice is optional. Encoded stereo deliveries must measure −14 ±1 LUFS with true peak at or below −1 dBTP.

## 8. Native moves

Loaded stroke becomes a natural form; a leaf detaches from a painting and discovers blank-paper water; open ink rings reveal water without colouring it; a wash retreats into mist. Pick what the new story needs. A leaf is the demo subject, not an invariant prop.

## 9. Pitfalls

Dry brush must not become dotted dashes. Do not layer identical parallel strokes into pipe-like masses. Use one body wash and a few loaded strokes. Avoid uniform hatching, vertical gradient seams and crawling grain. Do not let dark foreground ink touch text. System fonts need a visual check for missing glyphs. A long title may occupy a whole column, so keep the column out of painted masses. Preserve readability across every frame.

## 10. Engine

Own scene source: [demo/scene.ts](demo/scene.ts). The project creator strips TypeScript into generated `scene.js`, preserving editable TypeScript. Upstream MIT engines: `ink.js`, `comp.js`, `land.js` and `core/lib.js`. New score source: `studio/audio/score-v4.py`; `score.py` stays as the historical fallback. The library is needed at runtime. Films expose `READY`, deterministic `render(t)`, `DUR`, `EV`, `TEXTS(t)` and the `SHOTS` timeline.

## 11. Variation space

New films may use tea steam, a bridge after rain, a crane returning, a family garden or a cultural product. Direct a new treatment and new staging; changing only `content.json` is a technical template variation. Story, props, camera route, tempo and ending remain free. A fresh project retains its own scene source and content; style upgrades never overwrite existing films.
