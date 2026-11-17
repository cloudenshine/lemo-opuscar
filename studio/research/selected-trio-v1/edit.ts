// Picture clocks are independent of narration: no speech is sped up or truncated.
export const pictureEdits:Record<string,number[][]>={
  canal:[[0,0],[10,12],[18,24],[42,50],[53,66],[64,78],[74,90]],
  hero:[[0,0],[3.5,5],[9,15],[9.6,16],[11.1,18],[12.2,21],[13,22.5],[15,26],[20,36],[24,44],[29,53],[34.5,60],[37.5,64],[41,70]],
  thermal:[[0,0],[10,12],[17,24],[27,38],[39,54],[46,64],[52,72]],
};
function mapClock(points:number[][],t:number,from:number,to:number){
  const i=points.findIndex((p,n)=>n>0&&t<=p[from]);
  if(i<0)return points.at(-1)![to];
  const a=points[i-1],b=points[i];
  return a[to]+Math.max(0,(t-a[from])/(b[from]-a[from]))*(b[to]-a[to]);
}
export const pictureTime=(id:string,t:number)=>mapClock(pictureEdits[id],t,0,1);
export const editTime=(id:string,t:number)=>mapClock(pictureEdits[id],t,1,0);
export function gloveMotion(t:number){
  const smooth=(x:number)=>{const q=Math.max(0,Math.min(1,x));return q*q*(3-2*q);};
  const fall=Math.max(0,Math.min(1,(t-49)/.8));
  return{x:115+smooth((t-45.2)/3)*69,y:80+30*fall*fall,withdraw:smooth((t-49)/2.4)*160};
}
export function sealMotion(t:number){
  const smooth=(a:number,b:number)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
  const peeled=92*smooth(54,58.2),put=smooth(58.7,59.6);
  const anchor={x:172-put*115,y:137-peeled+put*16};
  const points=[anchor];
  for(const dx of [-.1,-.5,-.85]){const last=points.at(-1)!;points.push({x:last.x+dx*peeled/3,y:last.y+Math.sqrt(1-dx*dx)*peeled/3});}
  const tip=points.at(-1)!;
  return {peeled,remaining:92-peeled,anchor,points,tip,opening:smooth(60.6,62.5)};

}
export const revisedCueTimes:Record<string,number[][]>={
  canal:[[.4,4.8],[5,9.8],[10.4,14],[14.4,17.9],[18.7,23.6],[25.6,30.5],[31,35.5],[36.5,41.8],[42.4,47],[47.5,52.8],[53.4,58],[58.6,63.9],[64.5,68.8],[69,73.8]],
  thermal:[[.5,4.6],[5,9.7],[10.6,16.6],[17.3,22],[22.3,26.8],[27.5,32.8],[33.2,38.6],[39.5,45],[46.3,51.6]],
};
