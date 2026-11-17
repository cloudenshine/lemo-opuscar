# 本轮采用：摩擦后的真实热痕

2026-11-17更新：用户明确允许按素材改写。已取得许可明确的真实记录，完成原片完整动态核实并制作43秒实拍改编，`films/thermal-trace-v3/out/film.mp4`。旧窗户预演保留为档案，不作为本轮实拍成片。

| 材料 | 来源与许可 | 实际检查与决定 |
|---|---|---|
| Heat by friction | [文件页](https://commons.wikimedia.org/wiki/File:Heat_by_friction.webm)，Laserlicht，2024-03-29，作者自作，CC BY-SA 4.0 | 81.767秒原生完整动态读取；3–17秒接触摩擦，约18–22秒撤离，随后热痕保留并渐淡。选用 |
| Heating pad thermal video | [文件页](https://commons.wikimedia.org/wiki/File:Heating_pad_thermal_video.webm)，Laserlicht，2024-03-27，作者自作，CC BY-SA 4.0 | 完整34.484秒动态读取；热区扩展/减弱可见，但启动动作不可辨。未选用 |

许可原文允许改编，要求署名、链接许可、说明改动并同许可发布：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。视频内持续署名并注明改编；网页提供作者、原片、许可链接；CREDITS记录剪辑、变速、定格、字幕与原创音乐。此改编影片按CC BY-SA 4.0发布，不代表作者背书。

已采用原文件：4,511,640字节，SHA-1 `4b6141fd82e9b1dd5a748daf6a5a38bf7a14244b`（与Commons文件修订的公开校验值相符）。`build-thermal-evidence.ts`先核对字节数和SHA-1，不符则停止构建；同时记录SHA-256。原始视频放在忽略目录，不纳入源码提交。

重要边界：原片只有视频流，无音轨；“完整声画核实”在此包括确认声音不存在，不能声称听到原现场声音。模型原速读取约1帧/秒，另外检查实际素材帧及剪辑时序；完整新样片另以原速画面、连续音轨和慢放复审。原片Max/Min数值全程固定，色标范围固定，但亮斑变化明显且读数与色标不一致，故不量化温度。材质引用作者描述。没有可见光对照、原始辐射测温矩阵或独立校准资料。

## 可复现构建

在仓库根目录，先从[原文件](https://upload.wikimedia.org/wikipedia/commons/e/ea/Heat_by_friction.webm)下载到 `films/selected-trio-assets/friction-original.webm`，然后运行：

```powershell
node studio/research/selected-trio-v1/build-thermal-evidence.ts
```

需要已部署的Node、FFmpeg及本机Microsoft YaHei，不新增依赖，不上传新旁白。接触到撤离的原片0–26秒完整保留，模型所谓“26秒靠硬切抹掉木棒”与剪辑证据不符，没有采用此项建议。加速只出现在成片30–40秒，片尾3秒标注定格。

以下是此前围绕窗户题材的核实历史，不代表当前仍缺实拍。

---

# 热成像实拍核实 · 2026-11-17

结论：找到并实际检查了一支完整厂商演示，确认其中存在连续玻璃遮挡实验；没有找到同时满足本片同窗开关、反射辨认、连续机位和明确再剪辑许可的素材。热成像仍不作为成片交付。

## 已取得并检查的真实视频

- 发布者：Infiniti Electro-Optics。
- [官方来源页](https://www.infinitioptics.com/video/thermal-camera-vs-glass)。原片直接来自该页所链接的厂商CDN，不是第三方搬运。
- 文件：1920×1080、30fps、156.948333秒、52,212,473字节。原片留在本地 `films/selected-trio-assets/infiniti-glass-original.mp4`，没有混入成片或上传GitHub。
- 原文件SHA-256：`62871bdbb337550be094364588db318ee72da301bdd27339deab4ae3b6739fb8`。
- 方法：完整157秒原速原生视频读取；42–66秒四倍慢放细看；另从原始文件检查连续动作的图像。此处是模型辅助视觉核实，音轨未完成独立听审，不宣称完成该厂商片的完整声画审看。

| 原片位置 | 实际可见内容 | 可证明的范围 |
|---|---|---|
| 11–31秒 | 不透明反光圆片多次挡到热像仪前；监视屏暖目标仍可见 | 与普通玻璃不同的定性透射表现；锗材质依据厂商标注，未独立化验 |
| 49–62秒 | 透明圆玻璃片进入、移过热像仪视场并退出；监视屏出现圆形遮挡区，退出后暖目标恢复 | 这一段可见光与热像显示对照具有连续动作，能作为玻璃阻挡长波红外的候选镜头 |
| 79–106秒 | 透明塑料件的遮挡实验 | 材料响应差异；具体塑料类型、厚度和透过率未核实 |
| 123–142秒 | 反光圆片再次靠近镜头和前景 | 对前面材料差异的重复演示 |

不能据此声称：现场做过建筑窗户的连续开关；玻璃上出现可辨认的室内人影反射；画外暖目标就是特定人物；仪器已给出准确温度或“100%阻挡”数据。原片字幕对透明圆片同时使用“Quartz Window Glass”和“normal glass”，不能将该用语差异当作已核实的材质规格。

许可：官方页公开提供播放文件，但未见明确的CC/公共领域/可再剪辑声明。当前只作素材审查，不改编发布，不去除水印，不擅自向厂商发消息。若获得使用许可，它适合改编为“透明的玻璃与不透明的锗片，谁能让热像通过”的材料对照片；仍不能硬套成原方案的开关窗实证。

## 已实际排除或保留的其他来源

| 来源 | 核实结果 | 决定 |
|---|---|---|
| [MIT OCW课程下载](https://ocw.mit.edu/courses/mas-531-computational-camera-and-photography-fall-2009/download/)中的 Lecture 1 Part 2 | 字幕讨论眼镜和窗玻璃；下载的MP4前120秒实际是录音封面，不是实验画面。该课程入口也明确归为Audio Lectures | 排除为视频证据，不能用字幕描述冒充看到了实验 |
| [MIT+K12《Heat Transfer》](https://www.youtube.com/watch?v=oahoaGC8Jfc)及[官方许可说明](https://www.k12videos.mit.edu/faqs) | 官方允许按CC非商业相同方式共享条款使用；获取时YouTube要求登录验证，未绕过、未使用Cookie；没有实际取得镜头 | 保留为有许可依据但内容未核实的候选，不宣称可立即用于本片 |
| [TU Delft/NVON演示](https://interactivetextbooks.tudelft.nl/showthephysics/demos/demo22/demo22.html) | 有玻璃、人物和热像对照照片与实验步骤；页面CC BY-NC 4.0，未取得连续开关窗视频 | 支持实验设计，不代替动态证据 |
| [Cornell演示](https://atkinson.cornell.edu/media/climate-infrared-radiation-blowtorch-action/) | 官方描述包含红外相机、金属球、喷灯和玻璃；未核实再剪辑许可及适用镜头 | 不进入成片 |
| [Harvard LWIR演示](https://sciencedemonstrations.fas.harvard.edu/presentations/lwir-camera) | 有7–14µm设备说明与演示视频链接；页面强调定性结果与自动亮度伪影 | 用作波段/显示限制参考，不冒充本片原始素材 |

## 素材门槛

真实成片须有一个观众可以复核的连续变化：可见光和热像的明确对应、遮挡物进入和退出或窗户开合、目标变化与动作同步。保留原始素材、发布者、设备/波段信息、来源和明确使用条件；声音是现场声还是后配声须可区分。当前52秒动画只保留为内部预演，并在审看页折叠展示。
