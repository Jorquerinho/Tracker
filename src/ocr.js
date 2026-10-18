const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function parseFixtureText(text,competitions,knownRivals=[]){
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const parse=line=>{
    let rest=line, date='';
    const iso=rest.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
    const local=rest.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](20\d{2}))?\b/);
    const hit=iso||local;
    if(hit){date=iso?`${hit[1]}-${hit[2].padStart(2,'0')}-${hit[3].padStart(2,'0')}`:hit[3]?`${hit[3]}-${hit[2].padStart(2,'0')}-${hit[1].padStart(2,'0')}`:hit[0];rest=rest.replace(hit[0],' ');}
    const comp=[...competitions].sort((a,b)=>b.name.length-a.name.length).find(c=>fold(rest).includes(fold(c.name)));
    if(comp){const start=fold(rest).indexOf(fold(comp.name));rest=rest.slice(0,start)+' '+rest.slice(start+comp.name.length);}
    let homeAway='';
    const venue=rest.match(/\b(local|home|casa|visita(?:nte)?|away|fuera)\b|\(([HLAV])\)/i);
    if(venue){homeAway=/^(local|home|casa|h|l)$/i.test(venue[1]||venue[2])?'home':'away';rest=rest.replace(venue[0],' ');}
    rest=rest.replace(/\b(vs\.?|contra|jornada\s*\d+|matchday\s*\d+)\b/gi,' ').replace(/[|;·•]/g,' ').replace(/\s+/g,' ').trim();
    const rival=knownRivals.find(r=>fold(rest).includes(fold(r)))||rest;
    return {rival:rival.slice(0,160),date,competitionId:comp?.id||'',homeAway,source:line};
  };
  return lines.map(parse).filter(row=>row.rival||row.competitionId||row.date);
}
export function badgeDistance(a,b){return a.reduce((sum,n,i)=>sum+Math.abs(n-b[i]),0)/(a.length*255);}
export function suggestBadge(vector,templates){
  const scores=templates.map(t=>({...t,distance:badgeDistance(vector,t.vector)})).sort((a,b)=>a.distance-b.distance);
  // Only close and sufficiently distinct matches become suggestions; confirmation is always required.
  return scores[0]&&scores[0].distance<0.13&&(!scores[1]||scores[1].distance-scores[0].distance>0.025)?scores[0].name:'';
}
export function badgeVector(canvas){
  const tiny=document.createElement('canvas');tiny.width=8;tiny.height=8;
  const ctx=tiny.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0,8,8);
  return [...ctx.getImageData(0,0,8,8).data].filter((_,i)=>i%4!==3);
}
export function cropCanvas(image,rect){
  const canvas=document.createElement('canvas');
  const r=rect||{x:0,y:0,w:image.width,h:image.height};
  canvas.width=Math.max(1,Math.round(r.w));canvas.height=Math.max(1,Math.round(r.h));
  canvas.getContext('2d').drawImage(image,r.x,r.y,r.w,r.h,0,0,canvas.width,canvas.height);return canvas;
}
let loadPromise;
function loadEngine(){
  if(globalThis.Tesseract)return Promise.resolve();
  if(!loadPromise)loadPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=new URL('../vendor/tesseract.min.js',import.meta.url).href;
    s.onload=resolve;s.onerror=()=>{loadPromise=null;s.remove();reject(new Error('No se pudo cargar el lector. Abre la app con conexión una vez para descargar sus archivos.'));};document.head.append(s);
  });return loadPromise;
}
export async function readImage(canvas,onProgress){
  await loadEngine();
  const base=new URL('../vendor/',import.meta.url).href;
  let worker;
  try{
    worker=await Tesseract.createWorker(['spa','eng'],1,{workerPath:base+'worker.min.js',corePath:base,langPath:base.slice(0,-1),workerBlobURL:false,logger:m=>onProgress?.(m.status==='recognizing text'?`Leyendo imagen · ${Math.round(m.progress*100)} %`:'Preparando lector local…')});
    await worker.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1'});
    const scale=Math.min(2,2400/canvas.width);
    const prepared=document.createElement('canvas');prepared.width=canvas.width*scale;prepared.height=canvas.height*scale;
    const ctx=prepared.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0,prepared.width,prepared.height);
    const pixels=ctx.getImageData(0,0,prepared.width,prepared.height);
    let mean=0;for(let i=0;i<pixels.data.length;i+=4)mean+=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;
    mean/=pixels.data.length/4;
    for(let i=0;i<pixels.data.length;i+=4){let g=(pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114);if(mean<120)g=255-g;g=Math.max(0,Math.min(255,(g-128)*1.3+128));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=g;}
    ctx.putImageData(pixels,0,0);
    const result=await worker.recognize(prepared);return result.data.text;
  }finally{if(worker)await worker.terminate();}
}
