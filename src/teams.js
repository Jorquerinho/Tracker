import {TEAMS} from './teams-data.js';
export {TEAMS};
export const teamKey=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const index=new Map(),ambiguous=new Set();
for(const team of TEAMS)index.set(teamKey(team.name),team);
for(const team of TEAMS)for(const name of team.aliases){const k=teamKey(name);if(!k||ambiguous.has(k))continue;const current=index.get(k);if(current&&current.id!==team.id){if(teamKey(current.name)!==k){index.delete(k);ambiguous.add(k);}}else index.set(k,team);}
export const findTeam=name=>index.get(teamKey(name))||null;
export const canonicalTeamName=name=>findTeam(name)?.name||String(name||'').trim();
const popular=['real-madrid','fc-barcelona','paris-saint-germain','manchester-city','liverpool-fc','bayern-munich','manchester-united','ac-milan','inter-milan','colo-colo'];
const searchable=TEAMS.map(t=>({...t,keys:[t.name,...t.aliases].map(teamKey)}));
export function suggestTeams(query,customNames=[],limit=12){
  const q=teamKey(query),custom=[];const seen=new Set();
  for(const name of customNames){const known=findTeam(name),k=known?.id||teamKey(name);if(!k||seen.has(k))continue;seen.add(k);if(known)continue;custom.push({id:'custom-'+k,name:String(name).trim(),country:'Mi historial',crest:null,keys:[teamKey(name)]});}
  const rank=t=>!q?(popular.includes(t.id)?popular.indexOf(t.id):100):(t.keys.some(k=>k===q)?0:t.keys.some(k=>k.startsWith(q))?1:2);
  return [...searchable,...custom].filter(t=>!q||t.keys.some(k=>k.includes(q))).sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,'es')).slice(0,limit).map(({keys,...t})=>t);
}
