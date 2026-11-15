# 1.6.0 · 第七轮

108个薄盒进入WebGL2渲染，深度缓冲逐像素处理遮挡。方向光、弱补光、高光和1024像素阴影图使卡片前后关系可见；3×3采样柔化阴影边界。文字使用GPU透视插值，阅读镜头保持正面、主卡保留发光比例以保护文字对比。选中、拖放、查源、归位的叙事不变。

需要WebGL2。使用近似方向光与固定视向高光，不是物理材质、全局光照、反射或透明折射；阴影存在分辨率和偏差取舍。对象没有物理碰撞求解。

# Changes from Dark Tech Keynote

| Dimension | Base | Personal version | Tradeoff |
|---|---|---|---|
| Accent | Lime with brief problem red | Restrained blue-violet | Distinct personal identity, no red warning sequence |
| Language | English Inter / Mono | Chinese sans-serif with concept disclosure | Chinese reuse without copied commercial font files |
| Story | Tidy cursor conquers 264 items | Notes become one original workspace | Different product and smaller scene complexity |
| Motion | 2.5D camera, character cursor, typed flights | Assigned card destinations and light sweep | Original retains greater depth and character acting |
| Number | Demo latency value | One workspace, explicitly labelled | No unverified performance claim |
| Audio | Sampled phasing ensemble plus voice | Procedural glass/synth cues, no voice | Offline repeatability; fewer timbres |

Comparative evidence and unresolved limits: [review](../../studio/comparison/REVIEW.zh-CN.md).

## 1.1.0 — Second comparison round

Twenty-seven cards occupy three projected depth planes. A dolly/drift leads to an oblique-to-frontal workspace, a dedicated task-card insert and a radial collapse. The pointer performs a readable archive action. Four harmonic regions, distinct arrival/slot/click/confirmation sounds, stereo reflections, music ducking and two silences replace the uniform pulse. This remains an original concept animation, not a full 3D engine or working SaaS.

## 第三轮 · 2026-11-15

候选为更密卡群、更长产品讲解、让同一任务卡经历完整操作；选择第三种。原创概念界面始终披露。

连续动作和空间模型见 demo/scene.ts；动作诊断 PERFORMANCE 与真实绘制使用同一姿态函数，motion.acceptance.ts 验证主体不瞬移、接触关系及行为方向。新项目快照 score-v3.py，旧作品不迁移。

## 第四轮 · 1.3.0

选择增加有身份的连续对象与分批路径，另两种候选为仅增加随机背景卡或另起更长产品片。固定24秒原创概念演示。

关节/排版/密集对象约束见 motion.acceptance.ts，声音快照升级为score-v4.py。旧项目与上游引擎保持不变。

## 第五轮 · 1.4.0

选择把摄影机路线与108个对象的路由分离，另两种候选为继续堆积对象或增加无关镜头。24秒原创概念演示。

导演路线见DEMO；新增双鸟/字符/摄影机约束及紧凑浏览器验收，声音快照为score-v5.py。旧项目保持不变。

## 1.5.0 · 第六轮

选择真实空间薄盒而非增加数量。108个持续身份分别拥有8个世界坐标顶点、6个面和厚度；每个模型有独立转角，摄影机绕行、跟随、升降、回拉。镜头使正面角点具有不同深度，可见侧面与明暗随方向改变。
