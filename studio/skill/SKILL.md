---
name: cloud-ink-studio
description: Create, preview and render Chinese films in the user's local Lemo-Opuscar studio using saved Cloud & Ink, Chinese Editorial, or Dark Product styles; compare against upstream references and evolve reusable style versions.
---

# Personal Film Studio · 云山墨序 / 中文编辑部 / 深色科技

Read `library-root.txt` beside this installed skill for the user's library path. In a repository checkout without that local file, use the repository containing `studio/src/cli.ts`. Never use the upstream managed-library setup script to update this personal Fork: it may reset managed clones.

1. Read `<library>/personal-styles/README.md`, the chosen `STYLE.md`, and `<library>/studio/README.zh-CN.md`.
2. For a new film, establish topic and intended use from the request. Choose `cloud-ink` for Eastern nature/cultural stories, `chinese-editorial` for evidence and explainers, or `dark-product` for software/product concepts. The default remains ink wash. All starters are Chinese, 1920×1080, 24 fps. Do not ask again for an already supplied preference.
3. Run `node <library>/studio/src/cli.ts doctor`. Create a unique project with `node <library>/studio/src/cli.ts create <slug> [content.json] --style <style>`. Never overwrite an existing film.
4. Write a new treatment and direct the user's story in `films/<slug>/scene.ts`. Replacing a template title alone does not make a new original film. Keep `READY`, deterministic `render(t)`, `DUR`, frame-aligned `EV`, transformed screen bounds in `TEXTS(t)`, and a continuous `SHOTS` timeline. Use changes of scale and perspective for story reasons; preserve stable reading intervals.
5. Preview in the local studio. For source edits, render compiles the project's `scene.ts` automatically. The studio uses the latest generated `scene.js`; call the project's render command or `compileProject` before previewing source edits. Do not edit generated JavaScript.
6. The pipeline assumes 24 seconds. Each project contains its own `score.py`, copied from `studio/audio/score-v2.py`. Direct four buses (music, ambience, foley, transitions), vary musical density by chapter, use distinct material cues, and place two whole-bus silences after reflections. Preserve `out/stems/*.wav` and `out/sound-manifest.json`. New metadata selects `verified-v2` mastering: the encoded MP4 must measure −14 ±1 LUFS and true peak ≤−1 dBTP before publication; evidence is in `out/mastering.json`. Old projects keep the original mastering path; missing old score snapshots use the unchanged legacy fallback. Different durations require adapting film, sound, render and preview together.
7. Run `node <library>/studio/src/cli.ts render <slug>`; inspect stills, reading time, MP4 streams and audio. Output is `films/<slug>/out/film.mp4`, with a poster under `out/stills/`.
8. Compare visual hierarchy, reading time, materials, composition, camera, transitions, cue alignment, sound and reuse against the matching upstream reference and the previous personal version. Read `studio/comparison/REVIEW.zh-CN.md`. Run motion and audio acceptance checks for relevant revisions. The `/compare` page switches its left side between original and previous personal film. Do not call motion density, loudness, or export resolution a quality score. Never claim human listening or audience validation from waveform checks.
9. Deliver the film and editable project path. Mention any feature that was not verified. Keep third-party notices in CREDITS, with no unwanted sign-off in the film.

The Windows service starts with `studio/Start.ps1` and stops with `studio/Stop.ps1`. Default URL: `http://127.0.0.1:43821`. Never stop unrelated processes or expose the service to the LAN. Existing projects are independent snapshots; a style update must not overwrite them.

When updating the user's style, change its invariants and version deliberately, preserve the base attribution, prove the change with a frame, and keep the user's existing `oil-news-package` style intact.
