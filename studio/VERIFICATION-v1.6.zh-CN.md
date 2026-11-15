# 第六轮 · v1.6 验收

2026-11-15，基线33ee060，分支codex/ink-oriental-studio。工作台1.6.0；水墨1.6.0、编辑部1.5.0、科技1.5.0。项目cloud-ink-v7、editorial-v6、product-v6。

| 检查命令 | 结果 |
|---|---|
| `npm --prefix studio run typecheck` | 通过 |
| `npm --prefix studio test` | 5组通过 |
| `npm --prefix studio run guard` | 103项通过 |
| `node studio/tests/browser.acceptance.ts` | 三风格创建、保存、预览、恢复、手机布局通过 |
| `node studio/tests/motion.acceptance.ts` | 577个时间点；四鸟间距、让位、接力；35条笔画、成词停留；108薄盒、厚度、角点、接触、正面阅读和纹理无拼缝通过；旧约束保留 |
| 导出内readcheck | 三片0.2秒抽样通过，未成词笔画不计入阅读时长 |
| `.venv/Scripts/python.exe studio/tests/audio.acceptance.py` | 四轨重建、静默零值、声道、章节密度、事件一致通过 |
| `node studio/tests/comparison.acceptance.ts` | 九片播放、定位、选听、分镜、Range、手机布局通过 |
| `node studio/tests/local-render.acceptance.ts` | 本地真实导出editorial-v6、下载与H.264播放通过 |
| `node studio/src/cli.ts doctor` | Node、FFmpeg/FFprobe、Git Bash、Python音频、Chromium通过 |
| `node studio/comparison/prepare.ts` | 固定原作/上一轮哈希、全片解码测量与分镜通过 |
| 本地生命周期与技能 | health为1.6.0；技能与源一致，其他用户风格保留 |

修复：让位鸟被叶片遮住；立体纹理三角拼接出现细缝；未成词笔画被过早计入阅读。最后一项通过按成词时刻过滤阅读声明解决，仍检查笔画进度和形变，未降低完整词的阅读要求。

三维验收取多个镜头时刻检验真实深度差，避免把偶然接近正面的一个姿态误判为始终面向相机。阅读段反而要求正面化。卡片前面为真实平面，纹理用局部仿射近似；不是逐像素透视校正或深度缓冲。报告保留该边界。

证据：`.studio/comparison/analysis.json`、各片`out/mastering.json`、`out/sound-manifest.json`、四轨、分镜与关键帧。16部历史影片哈希、三套源码/声音/treatment快照、已注册技能、文档链接和发布附件单独核验。生成媒体仅留本地或作为Release附件。

边界：角色共享简化骨架并使用预设编舞，笔画只有四个原创标题字，三维没有物理光照或相交几何遮挡求解。未做专业人工全片听音、完整人工观影或受众研究。具体数值及原作差距见[对照报告](comparison/REVIEW.zh-CN.md)。
