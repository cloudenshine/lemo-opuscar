# 云山墨序 · 本地私人制片室

**最新制作进展**：勇者更新为41秒无字手部修订版，热成像按许可明确的真实素材改编成43秒《动作停了，热痕为什么还在》，运河保留74秒已审看版本。[本地播放](http://127.0.0.1:43821/films/selected-trio-v2-review/index.html) · [本轮审看与局限](research/selected-trio-v1/REVIEW.md) · [素材、许可与证据](research/selected-trio-v1/THERMAL-SOURCES.md) · [执行方案](research/selected-trio-v1/TREATMENT.md)。勇者的摘套、揭条、开箱已能在无字静音模型复述中辨认，手指精细接触和自然程度仍不足；不等于观众认可。热像为CC BY-SA 4.0实拍改编，旧窗户实验预演只作档案。

**创作状态更新**：目标是建立个人作品系列，内容先于技术和风格。用户已否定前七轮质量，并明确取消“三种风格”的创作边界。用户比较后选择保留第四版，并要求停止本轮打磨：[观看保留的第四版](http://127.0.0.1:43821/films/space-for-two-v4-review/index.html) · [99种风格内容适配表](http://127.0.0.1:43821/films/content-style-atlas/index.html) · [导演方案](research/creative-reset/first-film-v4/TREATMENT.zh-CN.md) · [自审与复现](research/creative-reset/first-film-v4/REVIEW.zh-CN.md)。这是未定稿的内容试制，技术通过不代表创作达标。

**最新内容反馈**：目标是99种风格各一个案例、每种三个候选，每个候选分别推导内容价值与相关观众，禁止预设统一受众。[第三稿297项内容复审](http://127.0.0.1:43821/films/style-case-candidates-v3/index.html)已落地：88条保留、167条修改、42条重写，逐条包含声音安排和理由；99支原片完成完整时间轴模型辅助声画分析及编辑复核，0支待补。另有62条来源边界和6处有限评论语境，不冒称全平台口碑或真人逐帧观摩。[声画验证及对照报告](research/style-cases/EVIDENCE-v3.zh-CN.md) · [第二稿存档](http://127.0.0.1:43821/films/style-case-candidates-v2/index.html) · [旧稿档案](http://127.0.0.1:43821/films/style-case-candidates/index.html) · [计划与复现](research/style-cases/README.zh-CN.md)。讨论稿不代表制作确认，此前六项自由选题也不作为当前执行方案。

[二次开发方案](PLAN.zh-CN.md) · [三套个人风格](../personal-styles/README.md) · [第七轮优化方案](comparison/ROUND7-PLAN.zh-CN.md) · [原作对照报告](comparison/REVIEW.zh-CN.md) · [v1.7 验收](VERIFICATION-v1.7.zh-CN.md)

这是个人 Fork 的独立扩展。保留 Lemo-Opuscar 上游工具，在 Windows 上增加中文工作台、项目管理、确定性预览和视频导出。仅监听本机，不需要 API Key。源码和工作台 UI 使用 TypeScript；服务使用 Node 标准库，无新增运行时依赖。

## 安装与启动

以下命令均从本仓库根目录运行。需要 Node 24+、FFmpeg/FFprobe 7+、Git Bash（sh）、uv 和 Python 3.12。安装脚本仅建立项目依赖，不安装系统软件或修改全局配置。旧项目保留上游封装；新项目使用动态归一化后测量实际 AAC 成片的闭环流程，最多三次修正，响度或峰值不合格则拒绝替换成片。目标为 −14 ±1 LUFS、真峰值不高于 −1 dBTP。

```powershell
./studio/Install.ps1
./studio/Start.ps1
```

网络无法访问官方源时，可显式使用镜像，不修改系统 npm/pip 配置：

```powershell
./studio/Install.ps1 -Registry https://registry.npmmirror.com -PythonIndex https://pypi.tuna.tsinghua.edu.cn/simple
```

打开 [本地创作台](http://127.0.0.1:43821)。启动脚本后台运行并写入 `.studio/`；不会自动开机启动。端口冲突时指定 `-Port 43822`，不会停止占用端口的进程。

```powershell
node studio/src/cli.ts doctor
Invoke-RestMethod http://127.0.0.1:43821/api/health
./studio/Stop.ps1
```

停止脚本核验 PID、启动时间、命令行与服务身份；有工作台渲染任务时拒绝停止。CLI 渲染是独立进程，不受工作台启停影响。日志在 `.studio/stdout.log`、`.studio/stderr.log`；单部影片的日志在 `films/<slug>/out/render.log`。

## 制作与复用

工作台可创建项目、保存片名/题跋/印文、拖动时间轴预览画面、导出含音轨的 MP4。保存前输入有限长校验，不接受 HTML。预览不播放配乐，成片包含音轨。原生尺寸固定为 1920×1080；手机页面自适应显示，暂不提供竖屏重排。

```powershell
node studio/src/cli.ts styles
node studio/src/cli.ts create morning-leaf
node studio/src/cli.ts render morning-leaf
node studio/src/cli.ts create editorial-film --style chinese-editorial
node studio/src/cli.ts create product-film --style dark-product
```

同名项目会报错，不覆盖。首个样片已存在时直接运行 render。内容文件可以通过第三个参数提供：

```json
{"title":"一叶渡晨","inscription":"山静听风，叶落知秋","seal":"云山"}
```

`films/<slug>/` 保存独立的 `scene.ts`、`score.py`、`content.json`、`project.json`、`TREATMENT.md`、`CREDITS` 与重建脚本。元数据记录风格和版本，模板升级不改已有作品。修改画面请编辑 `scene.ts`；每次导出会重新生成 `scene.js`。不要手改生成文件。输出为 `out/film.mp4`、`out/stills/t_20.jpg`，生成媒体不纳入 Git 源码；本轮三支样片另通过 [GitHub Release](https://github.com/cloudenshine/lemo-opuscar/releases/tag/studio-v1.7.0) 分发。

当前模板和声音为 24 秒。更换故事时，先重写 treatment，再改变场景和声音；修改片名仅用于模板技术验证。变更时长必须同步改项目的 `scene.ts`、`score.py`、`studio/src/render.ts` 和预览时间轴，当前没有任意时长编辑器。旧版作品缺少 `score.py` 时才使用共享声音脚本。

v1.7 起，新项目的声音快照来自 `studio/audio/score-v7.py`（score-v6.py、score-v5.py、score-v2.py、score-v3.py、score-v4.py 保留），生成 `out/stems/` 下音乐、环境、动作和转场四轨，以及 `sound-manifest.json`。四轨可重建封装前混音；成片的归一化与 AAC 编码另有 `mastering.json` 记录。旧 `studio/audio/score.py` 保留兼容。新项目元数据带 `mastering: verified-v2`，不会修改历史项目的设置。画面保留 `SHOTS` 时间轴，第三轮增加 `PERFORMANCE(t)` 主体姿态和接触诊断，第四轮纳入腿部关节、排版尺度和全部背景对象路径，第五轮补充双角色间距、逐字顺序和摄影机投影约束，第六轮纳入四鸟让位与接力、35条原创笔画、立体几何与无拼缝透视文字；两处静默、音画整帧与变换后的文字边界纳入检查。

风格藏书读取上游实际 `style.json`，包括元数据中的未正式索引条目，所以数量可能略高于上游 README 的 99 种。云山墨序、中文编辑部、深色科技三种个人风格可直接创建项目，也可从风格卡片进入。其他上游风格打开规范，由 Agent 按该风格制作。没有下载所有风格的成片、字体或额外数据。

```powershell
./studio/Register-Style.ps1
```

注册命令在用户的 `lemo-my-styles/README.md` 中追加三种风格的目录引用，并安装个人 `cloud-ink-studio` 技能。重复运行不会重复注册；同库已安装且未被用户修改的技能可升级，其他库或本地修改过的技能会被保护。已有其他风格保持不变。后续可以说：“用我的中文编辑部风格制作研究解读短片”，或“用我的深色科技风格演示产品流程”。库路径保存在本机技能配置中，不提交到仓库。新技能通常在下一次会话中发现。

## 与原作对照

打开 [本地对照室](http://127.0.0.1:43821/compare)，切换三个风格，左侧可选原作或上一轮个人版，右侧是本轮优化。支持独立播放、选听音轨或按全片百分比定位。页面列出实测指标、分镜和原作仍占优势的部分。首次在另一台机器部署时：

```powershell
node studio/comparison/prepare.ts
```

命令从官方 release 下载三个固定校验和的 web 预览，在预留名称不存在时创建并导出三部个人样片，然后测量。已有样片不覆盖；已有项目缺少成片时会停止，先明确渲染该项目再重试。若上游替换了原作文件，会报校验和不符，需先核查来源。原作、个人成片、测量 JSON 与截图保留在本地，不纳入源码提交；个人样片可通过独立 Release 附件分发。重新测量使用 `node studio/comparison/analyze.ts`。原版水墨 `morning-leaf` 为可选历史资料，不在新机器上伪造。

本轮项目为 `cloud-ink-v8`、`editorial-v7`、`product-v7`；上一轮为 `cloud-ink-v7`、`editorial-v6`、`product-v6`，存在时核对保留的 SHA-256。新机器没有旧片时禁用上一轮选项，不以新模板伪造历史版本。

## 检查

```powershell
npm --prefix studio run typecheck
npm --prefix studio test
npm --prefix studio run guard
node studio/tests/browser.acceptance.ts
node studio/tests/comparison.acceptance.ts
node studio/tests/motion.acceptance.ts
.venv/Scripts/python.exe studio/tests/audio.acceptance.py
node studio/src/cli.ts doctor
```

测试覆盖输入、路径及 junction 越界、防覆盖、修改源文件后重编译、HTTP 来源检查、媒体 Range、任务互斥及失败恢复。浏览器验收覆盖创建/保存/拖动、乱序帧确定性、搜索/空状态、失败重试、手机不溢出及页面错误。浏览器测试使用临时目录，不修改用户作品；截图留在 `.studio/`。

## 上游同步与许可

`origin` 指向个人 Fork，`upstream` 指向 `lemomo-ai/lemo-opuscar`。本次使用独立分支，保留 Fork 的 `main`。同步时先 `git fetch upstream`，比较变更、合并及运行检查；不得使用上游 managed clone 的自动 hard reset 更新个人分支。

本地使用 sparse checkout 跳过大型演示媒体与无关演示源；保留所有风格说明、工具和水墨引擎。如以后需某个风格的演示源，可运行 `git sparse-checkout add '/styles/<slug>/demo/'`，再按其规范准备额外资源。不要仅为画廊显示一次性下载所有大素材。

上游分项许可见 [LICENSE](../LICENSE)。代码 MIT；上游及衍生风格文档 CC BY-NC 4.0，另有自制影片授权。保留署名，不把文档包装为任意商业再分发许可。中文字体使用本机字体，未复制分发，跨平台回退可能改变字形。v1 未安装旁白/语音识别模型，未调用付费接口；相关功能不属于本次已验证路径。

第七轮新增固定步长行为规则及反事实验证、本机字形骨架与通用路径插值、WebGL2深度缓冲和方向光阴影。科技版需要WebGL2；字形结果取决于本机字体。完整边界见对照报告。
