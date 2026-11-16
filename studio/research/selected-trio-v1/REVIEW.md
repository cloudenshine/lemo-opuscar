# 第一轮样片：范围与待验证处

本轮在用户确认三个内容方案并回复“继续”后推进。它们是首轮动态试制，不是最终成片，不代表三项内容已通过观众检验。

| 项目 | 内容落地 | 仍需验证 |
|---|---|---|
| 86-A 运河缺水，90秒 | NASA历史影像；海面与湖面高差；完整单闸室升水顺序；降雨、湖泊与通航关系；回到同一影像 | 视觉完成度尚为图解样片；观众能否独立复述；真实卫星影像分辨率限制 |
| 58-C 勇者拆包，70秒 | 原创像素场景；提箱、拔剑收手、观察小角、摘手套、揭封条；胜利动机首尾呼应 | 手部细节、表情和喜剧节奏仍需观众判断；不声称已达到原作人物表演水准 |
| 93-A 透明窗，72秒 | 同窗对照、举手、开窗、解释、关窗的动态分镜 | 缺少许可清楚的真实连续实验视频；所有画面持续标为“实验分镜·非实测”，没有测温数据 |

## 事实与素材

- NASA影像：2023-08-18观测，2023-09-01文章。不是当前航运事件。原图已保留，影像色调仅为呈现调整；未据此测算排队数量。
- 船闸采用传统单闸室原理简图，非尺寸/施工图，未声称覆盖新旧船闸全部设施。
- 玻璃论述限定普通窗玻璃、常见长波红外，参考FLIR官方说明；未转载其媒体，亦未得到可供再剪辑的连续开关窗实验。
- 声音为原创合成；不冒充现场声。两部科普片的旁白外发审批最初拒绝；用户随后明确回复“同意，仅发送这两部的解说文本”。据此仅向Microsoft发送两部解说，生成14句和9句中文旁白。服务限流时进行最多三次退避重试，没有更换账号或端点。所有旁白长度小于对应字幕时段，未通过截断加速强行塞入。
- 所有字体来自本机，未复制或分发字体文件。每片CREDITS记录素材来源；运河原图另记录SHA-256。

## 本轮已经修正的问题

第一批关键帧中，勇者抬箱造成全身上移，已固定足部并分离手臂与箱子位移；小字量化产生杂色，已改为单色像素字形。封条揭开前后保持状态，避免切回中景后封条复原。闸门高度和升水/开门顺序已复查。

卫星图删除了未经独立定位的船只定位框，避免标注错位。勇者补绘摘手套特写，并缩短手臂的过度伸展。本地服务采用文件白名单，预览源码打包到允许的scene.js，影像嵌入脚本，未放宽服务访问边界。署名和字幕使用内嵌下载，避免产生无法访问的文件链接。

## 与原片的具体差别

| 风格原片 | 本片的独立内容与结构 | 仍落后的部分 |
|---|---|---|
| Satellite Briefing《The Map Still Says Sea》：地图主张、跨年代岸线、距离和北咸海恢复 | 单次历史影像引出缺水问题，切到一艘船与单闸室原理，再回原图；开头、结构、招牌镜头、镜头路径、声音组织、结尾均另写 | 尚无原片从轨道到局部的连续地理镜头，本轮重在验证升水解释 |
| Pixel RPG《The Last Save Point》：存档、同伴回忆、色深变化与向前走 | 同一间屋子内的拆包喜剧；装备、手与封条推动动作；短胜利动机被打断后完成 | 角色造型与表演仍较简化，复杂表情、动作过渡和喜剧停顿需继续看反馈 |
| Thermal Camera《A Building on a Winter Night》：虚构建筑热调查与改造对照 | 同一扇窗的反射辨认与开关窗验证；实验分镜不生成测量数字 | 原片有完整建筑、材质、摄像与声场，本片仍是实验分镜，不能进行成片品质同级比较 |

以上比较依据已读的官方DEMO说明及当前源实现，不是宣称本轮又完成了三支原片的完整声画复看，也不以独立结构自动证明优于原片。

## 验证边界

执行记录来自本机脚本：分镜关键帧检查、文字显示时长与画面边界、船闸状态与字幕时间测试、渲染顺序确定性、编码后响度和峰值、成片时长及轨道、审看页面播放与手机布局。实际结果见交付消息及本地out下的probe.json/mastering.json。

已通过43个单元测试、studio typecheck与103风格guard。审看页检查了3个实际视频的播放、跳转、静音和390px布局。画面逐0.5秒检查180/140/144个时点的边界与非空画面，并随机跳回验证确定性；这仍不是正常速度的主观观看。

最终带旁白版本为canal-water-v1-vo、window-spectrum-previs-v1-vo；hero-sticker-v1保持无对白。原字幕版目录保留，避免替换正在读取的Windows媒体文件。三个文件均为1920×1080、30fps、H.264/AAC；画面分别2700、2100、2160帧。编码后综合响度依次为−14.64、−14.17、−14.44 LUFS，真峰值依次−1.98、−1.95、−1.99 dBTP。旁白逐句时长检查14/14与9/9完成，独立发音/转写核验未完成。

没有收集观众理解反馈；没有把自动检查或抽帧写成完整声画主观观摩。缺少独立语音转写与完整听审时，不标记旁白验收通过。热成像的实测有效性明确未通过，因为实测素材尚未取得。

## 复现

从仓库根目录执行。画面使用现有Node、Playwright和FFmpeg，无新增npm依赖。

```powershell
node studio/research/selected-trio-v1/build.ts prepare
node studio/research/selected-trio-v1/build.ts render hero
node studio/research/selected-trio-v1/build.ts render canal --no-narration
node studio/research/selected-trio-v1/build.ts render thermal --no-narration
node studio/research/selected-trio-v1/publish.ts
node --test studio/tests/selected-trio.test.ts
npm --prefix studio run typecheck
npm --prefix studio test
npm --prefix studio run guard
node studio/tests/selected-trio.acceptance.ts
```

需要预先将NASA原图保存在films/selected-trio-assets/panama-20230818.jpg。旁白是独立可选步骤，必须先有用户对外部发送的授权，才运行build.ts voice；完成后可用build.ts master重新混音，保留画面渲染。语音工具仅在本片独立voice-env里安装，未更改共享Python环境。字幕版复现不需要网络或语音工具。

本轮已取得上述两部文本发送授权。新故事或新外部服务不可由此推定授权。恢复有旁白的输出：

```powershell
node studio/research/selected-trio-v1/build.ts voice canal
node studio/research/selected-trio-v1/build.ts master canal
node studio/research/selected-trio-v1/build.ts voice thermal
node studio/research/selected-trio-v1/build.ts master thermal
node studio/research/selected-trio-v1/publish.ts
```

独立语音工具为edge-tts 7.2.3及其传输依赖（本机安装13个包）。必要性是现有共享Python未安装中文语音工具，系统语音仅有英文；未新增npm或根依赖，工具文件不提交Git，后续仅旁白重建需要维护。
