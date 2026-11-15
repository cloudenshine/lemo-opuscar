# Changes from Chinese Ink Wash

| Section | Base | Cloud & Ink | Reason |
|---|---|---|---|
| Colour | Warm aged paper, possible tiny story accent | Lighter ivory; vermilion reserved for one seal | More quiet space for personal Chinese stories |
| Type | Traced calligraphy and English serif inscriptions | Explicitly typeset local Chinese KaiTi / SimSun | Native Chinese readability without distributing fonts |
| Motion | Broad range including combat and explosive gestures | Restrained natural gestures in the starter template | A calm first reusable personal direction |
| Camera | Full action and landscape vocabulary | Slow observational framing as default | Small natural details deserve time |
| Sound | Guqin, xiao, drums, gong, optional voice | Sparse physical guqin, air and water; no default narration | Small local dependency footprint and quiet tone |

Story-specific choices live in DEMO.md, not in the style invariants.

## 1.1.0 — Reference-led revision

Compared the original 48-second official web preview with the first 24-second personal film. The original has stronger shot-scale contrast and much more complex character action. The personal revision adds a motivated leaf close view from 11–17.5s, returns to the wider landscape by 21s, and clears a soft paper field behind the title. The original bamboo/paper engine and calm story remain; no original footage or soundtrack is reused in the personal film. The old `morning-leaf` project is retained separately. See [comparison evidence](../../studio/comparison/REVIEW.zh-CN.md). Complex character acting and traced calligraphy remain outside this starter's vocabulary.

## 1.2.0 — Second comparison round

Six motivated framings now follow landscape, stem detail, branch, falling leaf, water contact and landscape return. Foreground and landscape use separate parallax depths. The leaf is visible before detachment; reflection and concentric rings follow contact. Four audio buses add a synthesized flute answer, wind/water, distinct brush/contact cues, pre-entry transitions and two silences. Old project and audio fallback remain unchanged.

## 第三轮 · 2026-11-15

延续自然短片：从“风景中有一片叶”发展为“一个生命注意到另一处变化”。候选为增加切镜、扩成长故事、保留短片并增加连续表演；选择第三种。

连续动作和空间模型见 demo/scene.ts；动作诊断 PERFORMANCE 与真实绘制使用同一姿态函数，motion.acceptance.ts 验证主体不瞬移、接触关系及行为方向。新项目快照 score-v3.py，旧作品不迁移。
