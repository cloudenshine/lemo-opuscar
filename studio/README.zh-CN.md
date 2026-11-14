# 云山墨序 · 本地私人制片室

[二次开发方案](PLAN.zh-CN.md) · [个人风格规范](../personal-styles/cloud-ink/STYLE.md) · [风格改编记录](../personal-styles/cloud-ink/CHANGES.md)

这是个人 Fork 的独立扩展。保留 Lemo-Opuscar 上游工具，在 Windows 上增加中文工作台、项目管理、确定性预览和视频导出。仅监听本机，不需要 API Key。源码和工作台 UI 使用 TypeScript；服务使用 Node 标准库，无新增运行时依赖。

## 安装与启动

以下命令均从本仓库根目录运行。需要 Node 24+、FFmpeg/FFprobe 7+、Git Bash（sh）、uv 和 Python 3.12。安装脚本仅建立项目依赖，不安装系统软件或修改全局配置。最终封装复用上游两遍响度测量与过采样限幅，不依赖单遍归一化猜测音量。

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
```

同名项目会报错，不覆盖。首个样片已存在时直接运行 render。内容文件可以通过第三个参数提供：

```json
{"title":"一叶渡晨","inscription":"山静听风，叶落知秋","seal":"云山"}
```

`films/<slug>/` 保存独立的 `scene.ts`、`content.json`、`TREATMENT.md`、`CREDITS` 与重建脚本。修改画面请编辑 `scene.ts`；每次导出会重新生成 `scene.js`。不要手改生成文件。输出为 `out/film.mp4`、`out/stills/t_20.jpg`，全部保持本地，不推送 GitHub。

当前模板和声音为 24 秒。更换故事时，先重写 treatment，再改变场景和声音；修改片名仅用于模板技术验证。变更时长必须同步改 `scene.ts`、`studio/audio/score.py`、`studio/src/render.ts` 和预览时间轴，当前没有任意时长编辑器。

风格藏书读取上游实际 `style.json`，包括元数据中的未正式索引条目，所以数量可能略高于上游 README 的 99 种。只有云山墨序内置项目模板；其他风格打开规范，由 Agent 按该风格制作。不会假装下载了所有风格的成片、字体或额外数据。

```powershell
./studio/Register-Style.ps1
```

注册命令在用户的 `lemo-my-styles/README.md` 中追加目录引用，并安装个人 `cloud-ink-studio` 技能。已有其他风格保持不变。后续可以说：“用我的云山墨序风格，制作一支关于雨后茶园的短片。”库路径保存在本机技能配置中，不提交到仓库。新技能通常在下一次会话中发现。

## 检查

```powershell
npm --prefix studio run typecheck
npm --prefix studio test
npm --prefix studio run guard
node studio/tests/browser.acceptance.ts
node studio/src/cli.ts doctor
```

测试覆盖输入、路径及 junction 越界、防覆盖、修改源文件后重编译、HTTP 来源检查、媒体 Range、任务互斥及失败恢复。浏览器验收覆盖创建/保存/拖动、乱序帧确定性、搜索/空状态、失败重试、手机不溢出及页面错误。浏览器测试使用临时目录，不修改用户作品；截图留在 `.studio/`。

## 上游同步与许可

`origin` 指向个人 Fork，`upstream` 指向 `lemomo-ai/lemo-opuscar`。本次使用独立分支，保留 Fork 的 `main`。同步时先 `git fetch upstream`，比较变更、合并及运行检查；不得使用上游 managed clone 的自动 hard reset 更新个人分支。

本地使用 sparse checkout 跳过大型演示媒体与无关演示源；保留所有风格说明、工具和水墨引擎。如以后需某个风格的演示源，可运行 `git sparse-checkout add '/styles/<slug>/demo/'`，再按其规范准备额外资源。不要仅为画廊显示一次性下载所有大素材。

上游分项许可见 [LICENSE](../LICENSE)。代码 MIT；上游及衍生风格文档 CC BY-NC 4.0，另有自制影片授权。保留署名，不把文档包装为任意商业再分发许可。中文字体使用本机字体，未复制分发，跨平台回退可能改变字形。v1 未安装旁白/语音识别模型，未调用付费接口；相关功能不属于本次已验证路径。
