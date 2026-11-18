export const release = 'study-collection-20261118';
const repository = 'https://github.com/cloudenshine/lemo-opuscar';
const trio = repository+'/releases/download/study-trio-hands-thermal-20261117/';
const current = repository+'/releases/download/'+release+'/';

export type Film = {
  style: string | null;
  candidate: string | null;
  folder: string;
  title: string;
  duration: number;
  summary: string;
  releaseFile?: string;
  poster?: string;
};

export const films: Film[] = [
  {style:null,candidate:null,folder:'solar-rain',title:'太阳在下雨',duration:32,
    summary:'从极紫外影像中的日冕雨丝拉远，让地球成为片尾的尺度参照。',releaseFile:current+'solar-rain.mp4',poster:'7.6'},
  {style:'swiss-motion',candidate:'36-B',folder:'power-ninety-nine',title:'99% 恢复供电，还有多少户摸黑',duration:26,
    summary:'两个同样的百分比，各打开一个红格，露出一户与一千户的差别。',releaseFile:current+'power-ninety-nine.mp4',poster:'11'},
  {style:'oscilloscope-math',candidate:'76-A',folder:'phase-flowers',title:'同一组频率，为什么能画出不同的花',duration:30,
    summary:'两条计算信号画成轨迹，频率设置保持不动，只改变相位。',releaseFile:current+'phase-flowers.mp4',poster:'24'},
  {style:'one-line',candidate:'14-A',folder:'mending-one-line',title:'这件旧衣，明天还穿',duration:29,
    summary:'从纸上一道裂口出发。跟着一根线走，最后看见它留下了什么。',releaseFile:current+'mending-one-line.mp4',poster:'27'},
  {style:'satellite-briefing',candidate:'86-A',folder:'canal-water-v3-vo',title:'两边都是海，船为什么会因为缺水排队',duration:74,
    summary:'从锚地影像进入船闸剖面，追溯航道缺水的原因。',releaseFile:trio+'canal-water-v3-vo.mp4',poster:'2.5'},
  {style:'pixel-rpg',candidate:'58-C',folder:'hero-sticker-v7',title:'满级勇者，撕不开一张贴纸',duration:41,
    summary:'把一场力量足够、手指却不够灵活的小挫折拍成无对白喜剧。',releaseFile:trio+'hero-sticker-v7.mp4',poster:'4.6'},
  {style:'thermal-camera',candidate:'93-A 改题',folder:'thermal-trace-v3',title:'动作停了，热痕为什么还在',duration:43,
    summary:'从有许可的真实摩擦实验出发，观察热痕如何留下又消退。',releaseFile:trio+'thermal-trace-v3.mp4',poster:'16'},
  {style:null,candidate:null,folder:'space-for-two-v4',title:'空位',duration:32,
    summary:'保留的第四版。乘客让出的空位，最后成为两个人共同分担的空间。'},
];
