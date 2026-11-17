export const thermalEvidence={
  slug:'thermal-trace-v3',title:'动作停了，热痕为什么还在',duration:43,
  source:'https://commons.wikimedia.org/wiki/File:Heat_by_friction.webm',
  download:'https://upload.wikimedia.org/wikipedia/commons/e/ea/Heat_by_friction.webm',
  author:'Laserlicht',license:'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceBytes:4511640,sourceSha1:'4b6141fd82e9b1dd5a748daf6a5a38bf7a14244b',
  edits:[{start:0,end:4,sourceStart:20,sourceEnd:24,speed:1},
    {start:4,end:30,sourceStart:0,sourceEnd:26,speed:1},
    {start:30,end:40,sourceStart:26,sourceEnd:81.767,speed:5.5767}],
  captions:[
    {start:0,end:4,lines:['木棒离开了。','热痕为什么还在？']},
    {start:4,end:8,lines:['倒回刚才。','木棒摩擦木板。']},
    {start:8,end:18,lines:['来回摩擦。','亮痕沿接触处出现。']},
    {start:18,end:22,lines:['接触处更亮。']},
    {start:22,end:26,lines:['木棒离开。']},
    {start:26,end:30,lines:['摩擦让木板升温。']},
    {start:30,end:40,lines:['散热需要时间。','热痕随之变淡。']},
    {start:40,end:43,lines:['停止摩擦，','不等于立即冷却。']},
  ],
};
export function thermalSourceTime(t:number){
  const cut=thermalEvidence.edits.find(c=>t>=c.start&&t<c.end);
  return cut?cut.sourceStart+(t-cut.start)*cut.speed:81.767;
}
