# 镜头与声音第二轮 · v1.2 验收

日期：2026-11-15（Asia/Shanghai）。个人基线 `0da6b69`，继续使用 `codex/ink-oriental-studio` 分支。原作文件、上游引擎、旧声音 fallback 和旧项目均保留。

## 交付范围

- 云山墨序 1.2.0：环境建立、竹节上移、枝叶横移、落叶跟拍、入水插入、山水回拉六段；前后景视差、倒影、触水点校正。
- 中文编辑部 1.1.0：散页旋转、错峰归栏、校订推近、成稿扇形收束；正文在噪声线条清理后出现。
- 深色科技 1.1.0：27 张记录的三层透视、斜视归位、任务卡特写、径向收束；保留明确点击/归档反馈。
- 四轨声音、章节配器变化、音乐自动让位于重要音效、反射尾音、每片两处总线静默；生成分轨和声音清单。
- 新项目采用编码后实测准入，旧项目继续原流程。响度 −14 ±1 LUFS、真峰值 ≤−1 dBTP，不合格时不替换上一版交付。
- 对照页左侧可切换原作/上一轮，右侧为本轮。旧文件 SHA-256 固定核验；无旧片的新部署禁用该选项。

## 验证路径

| 验证 | 本轮覆盖 |
|---|---|
| `npm --prefix studio run typecheck` | 场景变换、声音封装、服务、比较页面与测试 |
| `npm --prefix studio test` | 5 组：新增不合格音频准入回归，保留输入/路径/多模板/HTTP/任务互斥验证 |
| `npm --prefix studio run guard` | 103 项风格与三套模板源文件 |
| `node studio/tests/browser.acceptance.ts` | 三风格创建、保存、预览、确定性、错误恢复、手机布局 |
| `node studio/tests/motion.acceptance.ts` | 镜头覆盖 0–24s、连续边界、整帧事件、两次静默、变换后文字边界、关键帧乱序一致 |
| `.venv/Scripts/python.exe studio/tests/audio.acceptance.py` | 四轨非空/有限采样、混音重建、两段精确静默、声道差异、章节音乐 RMS 变化、音画事件一致 |
| 导出中的 `readcheck.mjs --step 0.2` | 三片默认文案通过；校订结论清理后仍保留约 4.8 秒阅读窗口 |
| `node studio/tests/comparison.acceptance.ts` | 原作、上一轮、本轮九片播放；定位、选听、分镜、Range、手机布局 |
| `node studio/tests/local-render.acceptance.ts` | 本机工作台选择 `editorial-v2`，实际导出、验证下载与 H.264 播放 |
| `node studio/comparison/prepare.ts` | 原作散列、旧片散列、最终交付的同口径测量与分镜生成 |

Python 验收直接使用项目已有 NumPy/SoundFile 读取 PCM；没有为 TypeScript 新增音频解析依赖。画面/声音测试和生成资料均留本地临时目录或忽略目录。

## 发现并修复

编辑部动作初版中，待删除线条与新正文存在短时重叠，已将正文入场移到 13.25s。新混音通过原有封装时出现响度偏低或编码峰值偏高，且原流程只警告；本轮没有改动上游，而在扩展区加入 `master.ts`，测量已编码文件并有限次修正，保留前一部合格成片。四轨应用共同的短时增益，使分轨仍可重建混音。

## 证据与边界

`.studio/comparison/analysis.json` 记录原作/前版/本轮的哈希、媒体与音频参数；每部 `out/mastering.json` 记录编码验收尝试，`out/sound-manifest.json` 记录音画事件、静默与分轨数据。正式结论与实测数值见 [对照报告](comparison/REVIEW.zh-CN.md)。

本轮完成技术与画面检查，没有人工盲听或受众研究。Canvas 透视不是完整 3D；原作角色演出、复杂空间组织和真实采样配器仍更丰富。固定 24 秒/16:9、系统字体、无旁白与无真实 SaaS 功能的边界不变。工作台是本机服务，没有新增云部署或开机自启。
