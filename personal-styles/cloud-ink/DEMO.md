# A Leaf Carries the Morning · 一叶渡晨

One example among many. Don't reuse its story, arc, shots, props or timings.

The film begins with already-present pale mountains. Bamboo is painted into the foreground, a leaf falls into blank-paper water, then drifts beyond its ripples. It differs from the base demo's swordsman, river crossing, threat, sword strike and mounted-scroll ending.

| Seconds | Picture | Sound |
|---|---|---|
| 0–4 | Mist and slow push | Low guqin, quiet air |
| 4–8 | Loaded bamboo stems | Answering plucks and brush |
| 8–12 | Leaves, lateral camera | Short pentatonic phrase |
| 12–14 | Close framing settles, anticipating the leaf | Literal silence |
| 14–17 | A leaf falls and settles | Low pluck, air, water contact |
| 17–24 | Open rings, drift and pull back | High harmonics and long tail |

`demo/scene.ts` draws the original staging using upstream ink engines. `studio/audio/score.py` composes and synthesizes the original stereo score. `demo/index.html` hosts the frame contract. `demo/treatment.txt` becomes each new project's `TREATMENT.md`. Small JSON content holds title, inscription and seal.

From the repository root, run `node studio/src/cli.ts create morning-leaf`, then `node studio/src/cli.ts render morning-leaf`. Output: `films/morning-leaf/out/film.mp4`; still: `films/morning-leaf/out/stills/t_20.jpg`. Each created project's `build.ps1` or `build.sh` rebuilds it. Renders are intentionally ignored by Git. See [CREDITS](demo/CREDITS) for reused engines and fonts.

For the 1.1 comparison, create `cloud-ink-v2` instead: the existing `morning-leaf` film is the historical 1.0 snapshot and must not be replaced. New templates push into the leaf between 11–17.5s and return to the wide frame by 21s; title paper is cleared softly. A new project also receives its own score source.
