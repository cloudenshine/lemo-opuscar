# 第七轮 · v1.7 验收

2026-11-15，基线abdcfbb，分支codex/ink-oriental-studio。工作台1.7.0；水墨1.7.0、编辑部1.6.0、科技1.6.0。项目cloud-ink-v8、editorial-v7、product-v7。

| 检查命令 | 结果 |
|---|---|
| `npm --prefix studio run typecheck` | 通过 |
| `npm --prefix studio test` | 5组通过；沙箱首次遇符号链接/回环限制，正常本机重跑通过 |
| `npm --prefix studio run guard` | 103项通过 |
| `node studio/tests/browser.acceptance.ts` | 三风格创建、保存、预览、错误恢复、手机布局通过 |
| `node studio/tests/motion.acceptance.ts` | 每片577时间点；反事实互动、枝位独占、群体间距；未见字形、输入边界、插值端点与成词；108薄盒、接触、角点、GPU深度/光照/阴影和上下文丢失恢复通过 |
| 导出内readcheck | 三片0.2秒抽样通过，保留完整词阅读时长 |
| `.venv/Scripts/python.exe studio/tests/audio.acceptance.py` | 四轨重建、静默零值、声道、章节密度、事件一致通过 |
| `node studio/tests/local-render.acceptance.ts` | 本地UI实际导出editorial-v7，下载与H.264播放通过 |
| `node studio/src/cli.ts doctor` | Node、FFmpeg/FFprobe、Git Bash、Python音频、Chromium通过 |
| `node studio/comparison/prepare.ts` | 固定原作/上一轮哈希，全片解码、测量与分镜通过 |
| `node studio/tests/comparison.acceptance.ts` | 九片自动短时播放、定位、选听、分镜、Range与手机布局通过 |

修正了末段两鸟过近的飞行路线，未降低既有阈值；科技版调整阴影深度偏差，减少斜面条纹。泛化能力用样片之外11个字形检查，缺字和非法路径明确处理。像素测试使用交叉平面及倒序提交，避免把简单不相交卡片误当作完整遮挡证明。

证据在`.studio/comparison/analysis.json`、三片`out/mastering.json`、`out/sound-manifest.json`、分轨、关键帧和分镜。生成媒体不进入源码提交。已核对19部历史影片、源/项目快照、安装技能、文档链接与附件SHA-256。

边界：自主互动是有限规则，字形骨架不是笔顺，光照是近似方向光和阴影图。未做人工完整观影、专业全片听音、盲测或受众评价。对照结论和媒体数值见[报告](comparison/REVIEW.zh-CN.md)。

本地health已确认1.7.0。19部历史影片哈希与三套项目/模板快照一致；科技版修正后重新导出的完整MP4哈希与分析时一致。
