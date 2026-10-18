export const KEY = 'fc-tracker:data';
export const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const num=(v,min,max,fallback=0)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
const str=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';
export const clubKey=name=>String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export const validBadgeImage=image=>typeof image==='string'&&image.length<=96000&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image);
export function setClubBadge(state,name,image){
  if(!name?.trim()||!validBadgeImage(image))throw new Error('Elige un escudo PNG, JPG o WebP válido.');
  const existing=state.clubBadges||[],key=clubKey(name);
  if(!existing.some(b=>clubKey(b.name)===key)&&existing.length>=200)throw new Error('La biblioteca admite hasta 200 clubes. Elimina un escudo antes de añadir otro.');
  const library=[...existing.filter(b=>clubKey(b.name)!==key),{name:name.trim().slice(0,160),image,preferred:true}];
  if(library.reduce((n,b)=>n+b.image.length,0)>4*1024*1024)throw new Error('La biblioteca de escudos llegó a 4 MB. Quita algunas imágenes antes de añadir otra.');
  return {...state,clubBadges:library};
}
export function freshState(){return {schemaVersion:1,player:{name:'Mi jugador',club:'',position:'MC',overall:65,number:10},competitions:[['Liga',true],['Copa',true],['Champions League',true],['Pretemporada',false],['Amistoso',false]].map(([name,official])=>({id:uid(),name,official})),seasons:[],matches:[],badgeTemplates:[],clubBadges:[],settings:{lastBackupAt:null}};}
export function normalize(data){
  const fail=()=>{throw new Error('El respaldo contiene datos incompletos o referencias inválidas.');};
  if(!data||typeof data!=='object'||Array.isArray(data)||!data.player||!Array.isArray(data.seasons)||!Array.isArray(data.matches)||!Array.isArray(data.competitions))fail();
  if(data.schemaVersion!=null&&data.schemaVersion!==1)throw new Error('Este respaldo pertenece a una versión de FC Tracker no compatible.');
  if(data.matches.length>20000||data.seasons.length>500||data.competitions.length>300)fail();
  const ids=new Set();
  const validId=(id)=>{if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(id)||ids.has(id))fail();ids.add(id);return id;};
  const competitions=data.competitions.map(c=>{if(!c||!str(c.name))fail();return {id:validId(c.id),name:str(c.name),official:c.official!==false};});
  const compIds=new Set(competitions.map(c=>c.id));
  let active=false;
  const seasons=data.seasons.map(s=>{
    if(!s||!str(s.name)||!['active','finished'].includes(s.status))fail();
    if(s.status==='active'){if(active)fail();active=true;}
    if(s.competitionIds&&!Array.isArray(s.competitionIds))fail();
    if((s.competitionIds||[]).some(id=>!compIds.has(id)))fail();
    return {id:validId(s.id),name:str(s.name),club:str(s.club),status:s.status,startDate:str(s.startDate),endDate:s.endDate?str(s.endDate):null,competitionIds:[...new Set(s.competitionIds||[])],playerOfTheMonthCount:Math.floor(num(s.playerOfTheMonthCount,0,120)),trophies:Array.isArray(s.trophies)?s.trophies.filter(t=>typeof t==='string'&&t.trim()).slice(0,100).map(t=>str(t)):[]};
  });
  const seasonIds=new Set(seasons.map(s=>s.id));
  const matches=data.matches.map(m=>{
    if(!m||!seasonIds.has(m.seasonId)||!compIds.has(m.competitionId)||!str(m.rival)||!['pending','completed'].includes(m.status)||!['home','away'].includes(m.homeAway))fail();
    if(m.status==='completed'&&(!m.stats||typeof m.stats!=='object'))fail();
    return {id:validId(m.id),seasonId:m.seasonId,competitionId:m.competitionId,rival:str(m.rival),homeAway:m.homeAway,date:str(m.date),order:num(m.order,0,100000),matchdayOverride:m.matchdayOverride?Math.floor(num(m.matchdayOverride,1,999)):null,status:m.status,stats:m.status==='completed'?cleanStats(m.stats):null};
  });
  const badgeTemplates=(Array.isArray(data.badgeTemplates)?data.badgeTemplates:[]).slice(0,200).filter(b=>b&&str(b.name)&&Array.isArray(b.vector)&&b.vector.length===192&&b.vector.every(n=>Number.isFinite(n)&&n>=0&&n<=255)).map(b=>({name:str(b.name),vector:b.vector}));
  if(data.clubBadges!=null&&(!Array.isArray(data.clubBadges)||data.clubBadges.length>200))fail();
  const badgeKeys=new Set();
  const clubBadges=(data.clubBadges||[]).map(b=>{if(!b||!str(b.name)||!validBadgeImage(b.image)||badgeKeys.has(clubKey(b.name)))fail();badgeKeys.add(clubKey(b.name));return {name:str(b.name),image:b.image,preferred:b.preferred===true};});
  if(clubBadges.reduce((n,b)=>n+b.image.length,0)>4*1024*1024)fail();
  return {schemaVersion:1,player:{name:str(data.player.name)||'Mi jugador',club:str(data.player.club),position:str(data.player.position,12)||'MC',overall:Math.floor(num(data.player.overall,1,99,65)),number:Math.floor(num(data.player.number,1,99,10))},competitions,seasons,matches,badgeTemplates,clubBadges,settings:{lastBackupAt:typeof data.settings?.lastBackupAt==='string'&&!isNaN(Date.parse(data.settings.lastBackupAt))?data.settings.lastBackupAt:null}};
}
export function cleanStats(s){return {goals:Math.floor(num(s.goals,0,99)),assists:Math.floor(num(s.assists,0,99)),rating:num(s.rating,0,10),minutesPlayed:Math.floor(num(s.minutesPlayed??(s.starter===false?20:90),0,150)),starter:s.starter!==false,motm:!!s.motm,teamGoalsFor:s.teamGoalsFor==null||s.teamGoalsFor===''?null:Math.floor(num(s.teamGoalsFor,0,99)),teamGoalsAgainst:s.teamGoalsAgainst==null||s.teamGoalsAgainst===''?null:Math.floor(num(s.teamGoalsAgainst,0,99))};}
export const activeSeason=s=>s.seasons.find(se=>se.status==='active');
export function seasonMatches(s,id){
  const counters={};
  return s.matches.filter(m=>m.seasonId===id).sort((a,b)=>a.order-b.order).map(m=>{
    const comp=s.competitions.find(c=>c.id===m.competitionId);
    const matchday=m.matchdayOverride||((counters[m.competitionId]||0)+1);counters[m.competitionId]=matchday;
    return {...m,matchday,competition:comp?.name||'Competición',official:comp?.official!==false};
  });
}
export const filterMatches=(list,filter='official')=>list.filter(m=>filter==='all'||(filter==='official'?m.official:m.competitionId===filter));
export function stats(list){
  const done=list.filter(m=>m.status==='completed');const n=done.length;
  const sum=key=>done.reduce((a,m)=>a+(Number(m.stats[key])||0),0);
  const goals=sum('goals'),assists=sum('assists'),minutes=sum('minutesPlayed'),starts=done.filter(m=>m.stats.starter).length,motm=done.filter(m=>m.stats.motm).length;
  return {played:n,goals,assists,minutes,starts,subs:n-starts,motm,rating:n?sum('rating')/n:0,per90:minutes?(goals+assists)*90/minutes:0,goalAvg:n?goals/n:0,assistAvg:n?assists/n:0,motmRate:n?motm/n*100:0};
}
export function startSeason(state,data){
  if(!data.name?.trim()||!data.club?.trim())throw new Error('Escribe el nombre de la temporada y tu club.');
  return {...state,player:{...state.player,club:data.club.trim()},seasons:[...state.seasons.map(s=>s.status==='active'?{...s,status:'finished',endDate:today()}:s),{id:uid(),name:data.name.trim(),club:data.club.trim(),status:'active',startDate:today(),endDate:null,competitionIds:data.competitionIds||[],playerOfTheMonthCount:0,trophies:[]}]};
}
export function addMatch(state,seasonId,data,before=null){
  if(!state.seasons.some(s=>s.id===seasonId)||!state.competitions.some(c=>c.id===data.competitionId)||!data.rival?.trim())throw new Error('Completa el rival y la competición.');
  const list=state.matches.filter(m=>m.seasonId===seasonId).sort((a,b)=>a.order-b.order);
  let at=list.findIndex(m=>m.id===before);if(at<0)at=list.length;
  list.splice(at,0,{id:uid(),seasonId,competitionId:data.competitionId,rival:data.rival.trim(),homeAway:data.homeAway==='away'?'away':'home',date:data.date||'',matchdayOverride:data.matchdayOverride?Number(data.matchdayOverride):null,status:'pending',stats:null});
  return {...state,matches:[...state.matches.filter(m=>m.seasonId!==seasonId),...list.map((m,i)=>({...m,order:i}))]};
}
export function removeCompetition(state,id){
  if(state.matches.some(m=>m.competitionId===id))throw new Error('Esta competición tiene partidos. Puedes renombrarla o cambiar si es oficial.');
  return {...state,competitions:state.competitions.filter(c=>c.id!==id),seasons:state.seasons.map(s=>({...s,competitionIds:s.competitionIds.filter(c=>c!==id)}))};
}
export function buildBackup(state){return JSON.stringify({app:'fc-tracker',schemaVersion:1,exportedAt:new Date().toISOString(),data:state},null,2);}
export function parseBackup(text){
  if(text.length>12*1024*1024)throw new Error('El archivo es demasiado grande (máximo 12 MB).');
  let p;try{p=JSON.parse(text);}catch{throw new Error('El archivo no contiene JSON válido.');}
  if(p?.app!=='fc-tracker'||!p.data)throw new Error('Este archivo no es un respaldo de FC Tracker.');
  return normalize(p.data);
}
export function demoState(){
  let s=freshState();s.player={name:'Alex Morgan',club:'Real Madrid',position:'MC',overall:84,number:14};
  s=startSeason(s,{name:'Temporada 2026/27',club:'Real Madrid',competitionIds:s.competitions.slice(0,3).map(c=>c.id)});
  const season=activeSeason(s);season.playerOfTheMonthCount=1;
  const rivals=['Real Betis','Villarreal CF','Sevilla FC','FC Barcelona','Valencia CF','AC Milan','Athletic Club','Atlético de Madrid','Borussia Dortmund','Real Sociedad','RC Celta','Liverpool FC'];
  const ratings=[7.2,7.8,7.4,8.6,8.1,9.2,8.4,8.8];
  rivals.forEach((r,i)=>{s=addMatch(s,season.id,{rival:r,competitionId:s.competitions[i===5||i===8||i===11?2:0].id,homeAway:i%3?'home':'away',date:`2026-${i<8?'09':'10'}-${String((i%8)*3+2).padStart(2,'0')}`});if(i<8){const m=s.matches.at(-1);m.status='completed';m.stats=cleanStats({goals:[0,1,0,2,1,2,1,1][i],assists:[1,0,1,1,0,2,0,1][i],rating:ratings[i],minutesPlayed:i===2?28:90,starter:i!==2,motm:[3,5,7].includes(i),teamGoalsFor:i===2?1:3,teamGoalsAgainst:i%3});}});
  return s;
}
