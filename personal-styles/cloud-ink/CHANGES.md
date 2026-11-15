# 1.7.0 · 第七轮

四鸟保留各自身份与枝位。24Hz固定步长模拟按落稳时长触发呼唤，回应鸟听到后才加入；迟到鸟请求已占枝位时触发让位，离枝跟随前一角色的事件。关闭呼唤、移除迟到者、延后抵达会改变动作结果。叶落仍是预设的共同环境事件。

行为是有限状态规则，不是开放世界智能。主鸟身体表演与镜头仍由导演安排；反事实接口用于验证规则，成片展示默认方案。

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

## 第四轮 · 1.4.0

在第三轮的观察者基础上，选择关节和接触动作深化；另两种候选为增加镜头数量或延长故事。保留24秒自然片。

关节/排版/密集对象约束见 motion.acceptance.ts，声音快照升级为score-v4.py。旧项目与上游引擎保持不变。

## 第五轮 · 1.5.0

选择让第二只鸟回应已有主角，另两种候选为延长故事或只增加装饰。沿用24秒、暖纸与五色墨。

导演路线见DEMO；新增双鸟/字符/摄影机约束及紧凑浏览器验收，声音快照为score-v5.py。旧项目保持不变。

## 1.6.0 · 第六轮

选择群体因果而非延长片长或添加装饰。24秒内，先行鸟落枝跳跃；望风鸟5.25s进入、6.5s落稳；先行鸟8.5s呼唤，回应鸟10.25s落稳并在10.75s回应。迟到鸟10.75–11.75s加入时，回应鸟向左让位35单位并短暂跳离枝面，避免被叶片遮住。
