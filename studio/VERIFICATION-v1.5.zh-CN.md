# 第五轮 · v1.5 验收

2026-11-15，基线72a93fa，分支codex/ink-oriental-studio。工作台1.5.0；云山墨序1.5.0、编辑部1.4.0、科技1.4.0。项目cloud-ink-v6、editorial-v5、product-v5。

| 检查命令 | 结果 |
|---|---|
| `npm --prefix studio run typecheck` | 通过 |
| `npm --prefix studio test` | 5组通过；本机重跑解决沙箱junction/回环权限限制 |
| `npm --prefix studio run guard` | 103项通过 |
| `node studio/tests/browser.acceptance.ts` | 三风格创建/保存/预览/恢复/手机布局通过 |
| `node studio/tests/motion.acceptance.ts` | 577个时间点；双鸟间距与回应、字级变换、108身份、世界与屏幕轨迹、主卡取景、投影接触、阅读镜头锁定、旧动作约束与乱序确定性通过 |
| `.venv/Scripts/python.exe studio/tests/audio.acceptance.py` | 四轨重建、静默、声道、章节密度、音画事件通过 |
| 导出内readcheck | 三片0.2秒抽样阅读检查通过 |
| `node studio/tests/comparison.acceptance.ts` | 原作/第四轮/第五轮九片自动播放、定位、选听、分镜、Range与手机布局通过 |
| `node studio/tests/local-render.acceptance.ts` | 真实工作台导出editorial-v5、下载与H.264播放通过 |
| `node studio/src/cli.ts doctor` | Node、FFmpeg/FFprobe、Git Bash、Python音频库、Chromium通过 |
| `node studio/comparison/prepare.ts` | 原作及第四轮哈希核验、全片解码测量、分镜更新完成 |
| 本地生命周期与注册 | health返回1.5.0，个人技能同步，其他风格保留 |

修复并新增回归检查：伴鸟入场经过题字区、伴鸟换朝向时体型压扁、两鸟离枝路线过近、侧向镜头裁掉主卡。逐字后的整词文本框继续参加阅读检查。轨迹验收改为浏览器内计算，只传输摘要，检查样本数未减少。

未新增依赖；Python沿用现有音频合成实现，score-v5作为新项目独立快照。原作引擎、官方风格、旧片及旧声音脚本未改。13部历史影片哈希、三套源码/声音快照、已安装技能与文档链接核验通过。生成媒体只保留本地或发布为Release附件，不提交Git源码。

证据：`.studio/comparison/analysis.json`、每片`out/mastering.json`、`out/sound-manifest.json`、四轨、关键帧及分镜。数值与差距见[对照报告](comparison/REVIEW.zh-CN.md)。发布附件与提交在上传后核对。

边界：没有专业人工全片听音、完整人工观影、盲听或受众研究。双鸟为预设互动、共享简化结构；排版没有笔画变形；摄影机作用于平面卡片投影，非完整三维物理系统。固定24秒、16:9、系统字体、无旁白和原创概念界面的范围保持。
