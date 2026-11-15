# Chinese Editorial · 中文编辑部

Based on Swiss Motion Graphics (`swiss-motion`) from [Lemo-Opuscar by Lemomo (LemoLab)](https://github.com/lemomo-ai/lemo-opuscar). Adapted Chinese editorial grammar; original scene and score. Documentation: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), with the additional filmmaking permission in the repository LICENSE.

## 1. Essence
Chinese editorial pages made temporal: one question, visible evidence, a considered conclusion. Not a broadcast-news imitation or decorative dashboard. A strong grid, large scale contrast and controlled exception carry over from the base.
## 2. Materials
Flat warm paper, solid ink, hairline rules. No grain, glow or bevels. Version 1.6.0 allows one flat offset contact layer under a physical sheet. A 1920×1080 spread uses 96px outer margins and a full-width artifact stage below the headline. Remove the permanent left step column when it constrains staging.
## 3. Colour
Paper `#F2EEE5`, ink `#20231F`, secondary `#77776E`, rule `#CFCEC4`. Vermilion `#B6382D` marks the selected evidence or edit, not a whole background. Never add another signal colour.
## 4. Type
Chinese sans-serif is primary: local Microsoft YaHei / Noto Sans CJK SC. System fonts are not distributed. Headings are flush left; artifact and type scale create contrast; the starter contracts a 450px word to a 58px heading. Labels are at least 22px at 1080p; intended reading remains explicit in TEXTS. Independent character trajectories may assemble a word, carry a rejection across a claim, or resolve a poster. Preserve final order and a stable reading interval. Report the complete phrase with the union of transformed glyph bounds; never exempt meaningful text from reading checks. Display lettering uses locally rasterized glyph skeletons, branch tracing, arc-length resampling and path interpolation. The same extractor supports unseen characters available in the font. These segments are not semantic pen strokes; disclose font fallback, missing glyphs and branch fragmentation. Resolve into the native glyph before reading. Count reading time only after strokes resolve; geometric assembly is not readable text. Do not turn dense paragraphs into 6-second cards.
## 5. Motion
Smooth 24fps. Clip/wipe or precise linear/smoothstep movement; no bounce. Decorative arrivals occur on 120 BPM subdivisions. Removal reduces a line's thickness to zero, with a clear edit cue.
## 6. Camera
Version 1.6.0 keeps three identified sheets through a desk fan, verification grid, selected-page expansion and publication wall. One sheet becomes the final page; secondary sheets retreat without teleporting. A finished poster can turn through a quarter circle and return, scaling to a safe stage envelope; large type must leave space for the actual conclusion. Header and footer stay in screen space, with stable reading intervals after movement.
## 7. Sound
Dry page swishes, print impacts, marker friction, cutting and stamping have distinct cues. Bass, mallets and percussion change by chapter; the editing section thins out before the final harmonic resolution. Four editable buses, two literal silences, gentle shared transient control and encoded-media verification replace the original uniform pulse. EV stays on whole frames. No guqin inherited from the ink template.
## 8. Native moves
Unsorted notes become three evidence columns; a knife line removes noise; a selected sheet expands; an editorial conclusion resolves on that same artifact. These are a vocabulary, not a mandatory story.
## 9. Pitfalls
Do not present decorative bar lengths as statistics. Label illustrative content. Avoid tiny footnotes, false sources, low contrast and too many thin modules. New factual films must carry actual verified source references.
## 10. Engine
[demo/scene.ts](demo/scene.ts) draws original Canvas2D layouts. Project creation snapshots source, content, and score; upstream render/readcheck/mux tools remain unchanged. This style needs no external media or new dependency.
## 11. Variation
Use for cultural notes, explainers, research summaries or product reasoning. Direct a new treatment for each subject. Change the evidence and composition, not just the title. The supplied film demonstrates editing, not real news.

## Round 7 reuse constraints

从本机字体栅格自动提取字形骨架，按连通分支生成路径；弧长重采样让不同点数的路径能够插值。开场判断和片尾有据使用同一通用算法，弯曲分段逐渐归位，并过渡回完整字体。开场1.25s、片尾20.75s后才计入阅读。来源、核验、逐字划线和纸张旋转保留。

骨架分支不等于汉字笔顺，交叉点可能碎分；不承诺任意字体/复杂文字系统的语义笔画对应。字体回退会影响路径，缺字可检测；字体文件不分发。
