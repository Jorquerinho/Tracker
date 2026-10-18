import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {TEAMS,findTeam,suggestTeams,canonicalTeamName} from '../src/teams.js';
import {freshState,startSeason,activeSeason,addMatch,normalize,buildBackup,parseBackup,setClubBadge} from '../src/domain.js';
import {shell} from '../src/ui.js';
const root=new URL('../',import.meta.url);
test('El catálogo contiene los 769 clubes y un PNG local único por equipo',async()=>{
  assert.equal(TEAMS.length,769);assert.equal(new Set(TEAMS.map(t=>t.id)).size,TEAMS.length);
  for(const team of TEAMS){assert.match(team.crest,/^escudos\/[a-z0-9-]+\.png$/);const bytes=await readFile(new URL(team.crest,root));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',team.name);assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0,team.name);}
  const manifest=JSON.parse(await readFile(new URL('escudos/catalogo.json',root),'utf8'));assert.deepEqual(manifest,TEAMS);
  const files=(await readdir(new URL('escudos/',root))).filter(f=>f.endsWith('.png'));assert.equal(files.length,TEAMS.length);
});
test('Alias PSG y Man City siempre resuelven al club canónico',()=>{
  for(const name of ['PSG','Paris SG','paris saint germain','PARIS SAINT-GERMAIN'])assert.equal(findTeam(name)?.name,'Paris Saint-Germain');
  for(const name of ['Man City','Man. City','Manchester City','MCI'])assert.equal(findTeam(name)?.name,'Manchester City');
});
test('Reconoce nombres habituales y acentos, sin repetir variantes históricas',()=>{
  const expected={'Barça':'FC Barcelona','Barcelona':'FC Barcelona','Bayern':'Bayern Munich','Bayern München':'Bayern Munich','Inter':'Inter Milan','Juve':'Juventus FC','Real Betis':'Real Betis Balompié','La U':'Universidad de Chile','Colo Colo':'Colo-Colo','Monterrey':'CF Monterrey','Chivas':'CD Guadalajara','America':'Club América'};
  for(const [alias,name] of Object.entries(expected))assert.equal(findTeam(alias)?.name,name,alias);
  assert.equal(suggestTeams('PSG').length,1);assert.equal(suggestTeams('Bayern').length,1);
});
test('Las sugerencias buscan por nombre y alias y limitan el desplegable',()=>{
  assert.equal(suggestTeams('psg')[0].name,'Paris Saint-Germain');assert.equal(suggestTeams('man city')[0].name,'Manchester City');assert.equal(suggestTeams('manch').length,2);assert.ok(suggestTeams('').length<=12);
  assert.equal(suggestTeams('Villanueva', ['Mi Club Villanueva'])[0].country,'Mi historial');
  assert.equal(suggestTeams('un equipo que no existe en el catálogo').length,0);
});
test('Los equipos personalizados se conservan y las búsquedas no inyectan HTML',()=>{
  assert.equal(canonicalTeamName(' Club inventado '),'Club inventado');assert.equal(findTeam('No existe FC'),null);
  const [item]=suggestTeams('<img src=x>', ['<img src=x>']);assert.equal(item.name,'<img src=x>');
});
test('Los partidos guardados con alias reciben los escudos sin migrar los datos',()=>{
  let state=freshState();state=startSeason(state,{name:'2026/27',club:'Real Madrid',competitionIds:[]});
  state=addMatch(state,activeSeason(state).id,{rival:'PSG',competitionId:state.competitions[0].id});
  const ui={page:'home',season:''};assert.ok(shell(state,ui).includes('escudos/paris-saint-germain.png'));
  assert.ok(shell(state,{...ui,page:'calendar',calendarTab:'all',calendarComp:'all',search:''}).includes('escudos/paris-saint-germain.png'));
  assert.equal(state.matches[0].rival,'PSG');assert.equal(parseBackup(buildBackup(state)).matches[0].rival,'PSG');
});
test('El catálogo prevalece sobre recortes antiguos; un escudo personal nuevo puede reemplazarlo',()=>{
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZQAAAABJRU5ErkJggg==';
  let state=freshState();state=startSeason(state,{name:'2026',club:'PSG',competitionIds:[]});state.clubBadges=[{name:'PSG',image}];
  assert.ok(shell(normalize(state),{page:'home',season:''}).includes('escudos/paris-saint-germain.png'));
  state=setClubBadge(state,'PSG',image);assert.ok(shell(state,{page:'home',season:''}).includes(image));assert.equal(parseBackup(buildBackup(state)).clubBadges[0].preferred,true);
});
test('La app ya no carga ni muestra el importador de calendario por fotos',async()=>{
  const app=await readFile(new URL('src/app.js',root),'utf8');assert.ok(!/scanView|readImage|gridFixtures|Tesseract/.test(app));
  const html=shell(freshState(),{page:'calendar',season:'',calendarTab:'pending',calendarComp:'all',search:''});assert.ok(!html.includes('Importar captura'));
  await assert.rejects(access(new URL('src/ocr.js',root)));await assert.rejects(access(new URL('src/grid.js',root)));await assert.rejects(access(new URL('vendor/',root)));
});
