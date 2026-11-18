# 99 种风格案例的制片合集

当前有 6 种风格的可播放样片，另收录《太阳在下雨》和用户保留的《空位》第四版。合集只给每种风格登记一支当前影片。原作观摩、297 项内容候选和历次改版仍可回查。是否成为正式案例由观众审看决定，当前以样片计数。

## 本批成片

| 风格 | 候选 | 内容与实现 |
|---|---|---|
| 瑞士动态排版 | 36-B | 用假设的 99/100 与 99,000/100,000 拍两次 99%。每格的含义从一户变为一千户。最后一格展开为 40 × 25 个点。原创脉冲和落格音效。 |
| 示波器数学 | 76-A | 用同一个正弦信号模型生成轨迹和左右声道。选 0° 和 45° 作为对照，因原先的 0° 与 90° 轮廓实际等价。图中慢扫，声轨左右声道分别呈现 220 Hz 与 330 Hz，移动相位期间短暂停止播放计算音。 |
| 一笔画 | 14-A | 从裂口开场，手上一根红线跨过两侧。回过头看，整件旧衣已经进入画面。纸纹、墨线和笔触声完全由本片生成。 |
| 独立短片 | 太阳在下雨 | 32 秒。核对素材哈希，使用 NASA 的原始延时观测与全日面定格画面，原创配乐。此片为系列视觉参照，不占用风格名额。 |

现有卫星简报、像素 RPG、热成像片的声音和表演复审详见[三部案例审看报告](../selected-trio-v1/REVIEW.md)。本轮新增案例完成了导出、镜头对照和本地播放器验证。前者使用假设情景，后者使用计算信号，均为独立原创例子。

## 本地构建与播放

在仓库根目录执行。需要仓库已有的 Node、Chromium、FFmpeg 与工作区系统字体。

```powershell
node studio/research/collection/render.ts power
node studio/research/collection/render.ts phase
node studio/research/collection/render.ts mending
node studio/research/collection/publish.ts
```

可直接打开 `films/style-collection/index.html`，也可在本地工作台启动时访问 [合集](http://127.0.0.1:43821/films/style-collection/index.html)。本地缺少视频时，合集提供相应 GitHub 附件链接。持久文件保存在忽略目录 `films/`，源码与记录存入仓库。

复刻《太阳在下雨》之前，将 [NASA 近景原文件](https://svs.gsfc.nasa.gov/vis/a010000/a014100/a014126/Helios_Second_Shot_MkIII.webm) 和 [NASA 全日面原帧](https://svs.gsfc.nasa.gov/vis/a000000/a004000/a004026/AIA304July2012rain_stand.HD1080i.03000.jpg) 分别保存为 `films/solar-rain/assets/helios.webm` 和 `films/solar-rain/assets/wide.jpg`。

```powershell
node studio/research/collection/render-solar.ts
node studio/research/collection/publish.ts
```

极紫外影像署名 NASA Goddard Space Flight Center Scientific Visualization Studio、SDO Science Team 与 Virtual Solar Observatory。原始视频只取图像。全日面是 2012-07-19 20:00:07 UTC 的定格，缩放为后期编辑。地球示意只比较直径，位置为构图选择。[原始观测](https://svs.gsfc.nasa.gov/4026/) · [可再创作视频工具包](https://svs.gsfc.nasa.gov/14126/) · [NASA 使用说明](https://www.nasa.gov/nasa-brand-center/images-and-media/) · [直径比例依据](https://science.nasa.gov/wp-content/uploads/2023/10/Solar-Viewer-Activity.pdf)

## 继续制片

每支影片先验证最难成立的一个镜头或一次声画变化，成立就渲染完整段落。题材不成立时回看同风格的另外两个候选，再决定是否换题。由已有 `editorialCases()` 提供固定的 99 项与候选记录，合集只登记已实际出片的版本。[全部候选和原作观摩](../style-cases/README.zh-CN.md)
