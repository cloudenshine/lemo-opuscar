# 第四轮 · v1.4 验收

2026-11-15，基线f326eec，分支codex/ink-oriental-studio。工作台1.4.0；云山墨序1.4.0、编辑部1.3.0、科技1.3.0。项目cloud-ink-v5、editorial-v4、product-v4。

| 检查命令 | 结果 |
|---|---|
| `npm --prefix studio run typecheck` | 通过 |
| `npm --prefix studio test` | 5组通过 |
| `npm --prefix studio run guard` | 103项通过 |
| `node studio/tests/browser.acceptance.ts` | 三风格创建/保存/预览/恢复/手机布局通过 |
| `node studio/tests/motion.acceptance.ts` | 577姿态样本；腿链、跳枝、旋转、字号跨度、结论间距、108身份、全对象路径、安全区域、整帧事件、乱序确定性通过 |
| `.venv/Scripts/python.exe studio/tests/audio.acceptance.py` | 四轨重建、静默、声道、章节密度、音画事件通过 |
| 导出内readcheck | 三片0.2秒抽样阅读检查通过 |
| `node studio/tests/comparison.acceptance.ts` | 九片自动播放、定位、选听、分镜、Range、手机布局通过 |
| `node studio/tests/local-render.acceptance.ts` | 真实工作台导出editorial-v4、下载与播放通过 |
| `node studio/src/cli.ts doctor` | Node、FFmpeg/FFprobe、Git Bash、Python音频库、Chromium通过 |
| `node studio/comparison/prepare.ts` | 原作和前版哈希核验，最终媒体测量完成 |
| 本地生命周期与注册 | health返回1.4.0，更新本库技能且保留其他个人风格 |

关键帧发现并修复外翼连接缝隙、片尾大字覆盖结论、主卡缩小时纵横比例失衡。文字间距新增回归检查。未新增依赖；Python沿用现有音频合成与PCM分析。生成物只留本地或作为Release附件，不提交Git源码。

证据：`.studio/comparison/analysis.json`、每片`out/mastering.json`、`out/sound-manifest.json`、四轨及分镜。最终AAC测量达标，数值见[对照报告](comparison/REVIEW.zh-CN.md)。源码快照、旧片哈希、文档链接和发布附件校验单独核验。

边界：无专业人工全片听音、盲听或受众研究；静帧/自动播放不替代人工观影。腿链是几何约束，科技为Canvas投影，背景记录不是108份可阅读正文。固定24秒/16:9、系统字体、无旁白与原创概念界面继续保留。
