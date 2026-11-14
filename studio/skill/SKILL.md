---
name: cloud-ink-studio
description: Use the user's Cloud & Ink (云山墨序) personal ink-wash style and local Lemo-Opuscar studio to create, preview and render Chinese short films, or reuse and evolve the saved style.
---

# Cloud & Ink · 云山墨序

Read `library-root.txt` beside this installed skill for the user's library path. In a repository checkout without that local file, use the repository containing `studio/src/cli.ts`. Never use the upstream managed-library setup script to update this personal Fork: it may reset managed clones.

1. Read `<library>/personal-styles/README.md`, the chosen `STYLE.md`, and `<library>/studio/README.zh-CN.md`.
2. For a new film, establish topic and intended use from the request. The default is Chinese, 1920×1080, 24 fps, quiet Eastern ink wash. Do not ask again for an already supplied preference.
3. Run `node <library>/studio/src/cli.ts doctor`. Create a unique project with `node <library>/studio/src/cli.ts create <slug> [content.json]`. Never overwrite an existing film.
4. Write a new treatment and direct the user's story in `films/<slug>/scene.ts`. The starter leaf film proves the machinery; replacing its title alone does not make a new original film. Keep `READY`, deterministic `render(t)`, `DUR`, `EV`, and `TEXTS(t)`.
5. Preview in the local studio. For source edits, render compiles the project's `scene.ts` automatically. The studio uses the latest generated `scene.js`; call the project's render command or `compileProject` before previewing source edits. Do not edit generated JavaScript.
6. The v1 render pipeline assumes a 24-second film and uses the default original guqin score. For a different duration or score, explicitly adapt the film and render/audio pipeline together; do not silently truncate it.
7. Run `node <library>/studio/src/cli.ts render <slug>`; inspect stills, reading time, MP4 streams and audio. Output is `films/<slug>/out/film.mp4`, with a poster under `out/stills/`.
8. Deliver the film and editable project path. Mention any feature that was not verified. Keep third-party notices in CREDITS, with no unwanted sign-off in the film.

The Windows service starts with `studio/Start.ps1` and stops with `studio/Stop.ps1`. Default URL: `http://127.0.0.1:43821`. Never stop unrelated processes or expose the service to the LAN. Existing projects are independent snapshots; a style update must not overwrite them.

When updating the user's style, change its invariants and version deliberately, preserve the base attribution, prove the change with a frame, and keep the user's existing `oil-news-package` style intact.
