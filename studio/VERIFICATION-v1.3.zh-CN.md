# 连续表演第三轮 · v1.3 验收

2026-11-15（Asia/Shanghai）。基线4e2d4fa，分支codex/ink-oriental-studio。云山墨序1.3.0、中文编辑部1.2.0、深色科技1.2.0；工作台1.3.0。项目为cloud-ink-v4、editorial-v3、product-v3，旧作品保留。

## 执行结果

| 检查 | 结果与覆盖 |
|---|---|
| `npm --prefix studio run typecheck` | 通过，三场景、服务与测试 |
| `npm --prefix studio test` | 5组通过，输入/路径/多模板/HTTP/音频准入 |
| `npm --prefix studio run guard` | 103项风格通过 |
| `node studio/tests/browser.acceptance.ts` | 三风格创建/保存/预览/搜索/错误恢复/手机布局通过 |
| `node studio/tests/motion.acceptance.ts` | 时间轴、音画整帧、两次静默、文字边界、乱序确定性、主体连续、鸟足接触与追视、指针拖放、纸页展开、科技开场卡片不遮挡标题通过 |
| `.venv/Scripts/python.exe studio/tests/audio.acceptance.py` | 四轨重建、静默零值、声道差异、章节密度、事件一致通过 |
| 导出中的readcheck | 默认三片0.2秒抽样阅读检查通过 |
| `node studio/tests/comparison.acceptance.ts` | 原作/前版/本轮九片播放、定位、选听、分镜、Range和手机布局通过 |
| `node studio/tests/local-render.acceptance.ts` | 工作台真实导出editorial-v3、下载与H.264播放通过 |
| `node studio/src/cli.ts doctor` | Node、FFmpeg、FFprobe、Git Bash、Python音频库、Chromium通过 |
| `node studio/comparison/prepare.ts` | 官方原作和上一轮哈希核验、当前样片测量通过 |
| 启停和技能注册 | health返回1.3.0；安全升级本库技能，未覆盖其他个人风格 |

没有新增依赖。保留现有Python音频合成和PCM分析，避免为了同一工作新增TypeScript音频依赖。源码与样片快照一致；视频、音轨、截图和运行状态不提交Git，个人成片通过Release附件同步。

## 修正记录

关键帧检查发现墨鸟颈部连接不够清晰、起飞时镜头靠近画幅顶端，已补连笔并将回切提前到19.5秒。科技小卡片的横条改为相对高度，透视卡群纵向范围收束到标题与页脚之间；对后者增加逐帧空间占用回归。编辑部结论改为回应两条示例访谈，并显式保留适用范围。

## 证据与边界

`.studio/comparison/analysis.json`保存最终媒体参数和哈希；每片`out/mastering.json`记录编码后的准入尝试，`out/sound-manifest.json`和`out/stems/`保存音画事件、静默和分轨。本轮没有改动编码准入算法；实际成片响度/真峰值达标，详见[对照报告](comparison/REVIEW.zh-CN.md)。

没有专业人工全片听音、盲听或观众评估。24秒/16:9、系统字体、无旁白、概念界面和Canvas投影的边界不变。对原作优势的结论来自制作评审，不是测试分数。所有历史源码和影片保留，不把第三轮模板用于重建旧片。
