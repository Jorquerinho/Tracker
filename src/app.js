import {KEY,uid,today,freshState,normalize,activeSeason,seasonMatches,filterMatches,stats,startSeason,addMatch,removeCompetition,cleanStats,buildBackup,parseBackup,demoState} from './domain.js';
import {e,icon,button,field,select,shell,dateLabel} from './ui.js';
import {readImage,parseFixtureText,cropCanvas,badgeVector,suggestBadge} from './ocr.js';
const root=document.querySelector('#app'),modal=document.querySelector('#modal');
let state=freshState(),realState=null,corrupt=false,restoreData=null,returnFocus=null;
const ui={page:'home',season:'',demo:false,saveFailed:false,conflict:false,calendarTab:'pending',calendarComp:'all',search:'',statsFilter:'official',statsSeason:'selected'};
try{const raw=localStorage.getItem(KEY);if(raw)state=normalize(JSON.parse(raw));}catch{corrupt=true;ui.saveFailed=true;}
let scan={image:null,rect:null,rows:[],busy:false};
const se=()=>state.seasons.find(s=>s.id===ui.season)||activeSeason(state)||state.seasons.at(-1);
const comps=()=>{const ids=se()?.competitionIds||[];return state.competitions.filter(c=>!ids.length||ids.includes(c.id));};
function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;document.querySelector('#toasts').append(el);setTimeout(()=>el.remove(),4500);}
function render(){if(!['home','calendar','stats','profile'].includes(ui.page))ui.page='home';root.innerHTML=shell(state,ui);document.title=`FC Tracker · ${{home:'Inicio',calendar:'Calendario',stats:'Estadísticas',profile:'Mi carrera'}[ui.page]}`;}
function commit(next,message='Cambios guardados'){
  if(ui.conflict&&!ui.demo){toast('Carga primero los cambios de la otra pestaña.');return false;}
  if(corrupt&&!ui.demo){toast('Recupera o descarga los datos dañados antes de guardar.');return false;}
  state=next;
  if(!ui.demo)try{localStorage.setItem(KEY,JSON.stringify(state));ui.saveFailed=false;}catch{ui.saveFailed=true;toast('No hay espacio para guardar. Descarga un respaldo ahora.');}
  render();if(message)toast(ui.demo?`${message} · solo en demo`:message);return true;
}
function close(){if(scan.busy)return;modal.close();modal.innerHTML='';scan={image:null,rect:null,rows:[],busy:false};returnFocus?.focus();}
function open(title,content,wide=false){
  if(!modal.open)returnFocus=document.activeElement;
  modal.className=wide?'wide':'';modal.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">FC TRACKER / TU CARRERA</span><h2 id="modal-title">${title}</h2></div>${button('','close','close','icon-btn','aria-label="Cerrar"')}</div>${content}`;
  if(!modal.open)modal.showModal();modal.scrollTop=0;
}
const formFoot=(text='Guardar cambios')=>`<p class="form-error" role="alert"></p><div class="form-footer">${button('Cancelar','close','','btn secondary')}<button class="btn primary" type="submit">${text}${icon('check')}</button></div>`;
const formData=form=>Object.fromEntries(new FormData(form));
function confirmAction(title,text,action,extra=''){open(title,`<p class="modal-copy">${text}</p><div class="form-footer">${button('Cancelar','close','','btn secondary')}${button('Confirmar',action,'check','btn primary',extra)}</div>`);}
function setup(){const p=state.player;open('Aquí empieza tu legado.',`<p class="modal-copy">Define tu jugador y su primera temporada. Puedes cambiar estos datos cuando quieras.</p><form id="setup-form"><div class="form-grid">${field('Nombre del jugador','name',p.name==='Mi jugador'?'':p.name,'text','required maxlength="80" autocomplete="off"')}${field('Club','club',p.club,'text','required maxlength="100"')}${select('Posición','position',positions,p.position)}${field('Media general','overall',p.overall,'number','min="1" max="99" required')}${field('Dorsal','number',p.number,'number','min="1" max="99" required')}${field('Temporada','season',`Temporada ${new Date().getFullYear()}/${String(new Date().getFullYear()+1).slice(2)}`,'text','required maxlength="100"')}</div><h3 class="form-subtitle">¿Qué competiciones vas a jugar?</h3>${competitionChecks(state.competitions.map(c=>c.id))}${formFoot('Empezar mi carrera')}</form>`);}
const positions=['POR','DFC','LI','LD','MCD','MC','MCO','MI','MD','EI','ED','SD','DC'].map(s=>[s,s]);
function competitionChecks(ids){return `<div class="check-grid">${state.competitions.map(c=>`<label class="check"><input type="checkbox" name="competitionIds" value="${c.id}" ${ids.includes(c.id)?'checked':''}><span>${e(c.name)}<small>${c.official?'Oficial':'No oficial'}</small></span></label>`).join('')}</div><p class="hint">Si no marcas ninguna, se usará todo el catálogo.</p>`;}
function playerForm(){const p=state.player;open('Tu ficha de jugador',`<form id="player-form"><div class="form-grid">${field('Nombre','name',p.name,'text','required maxlength="80"')}${field('Club actual','club',p.club,'text','maxlength="100"')}${select('Posición','position',positions,p.position)}${field('Media general','overall',p.overall,'number','required min="1" max="99"')}${field('Dorsal','number',p.number,'number','required min="1" max="99"')}</div><p class="hint">El club de las temporadas anteriores se conserva en el historial.</p>${formFoot()}</form>`);}
function seasonForm(){open('Un nuevo capítulo',`<p class="modal-copy">${activeSeason(state)?'Al iniciar esta temporada, la actual quedará finalizada. Sus partidos y estadísticas se conservarán.':'Elige tu club y las competiciones de esta temporada.'}</p><form id="season-form"><div class="form-grid">${field('Nombre de la temporada','name','','text','required maxlength="100" placeholder="Temporada 2027/28"')}${field('Club','club',state.player.club,'text','required maxlength="100"')}</div><h3 class="form-subtitle">Competiciones</h3>${competitionChecks(state.competitions.map(c=>c.id))}${formFoot('Iniciar temporada')}</form>`);}
function matchForm(id){
  if(!se()){setup();return;}
  const m=state.matches.find(m=>m.id===id),list=seasonMatches(state,se().id).filter(x=>x.id!==id);
  // Existing matches remain editable even if their competition was later deselected.
  const available=m?state.competitions.filter(c=>comps().some(x=>x.id===c.id)||c.id===m.competitionId):comps();
  if(!available.length){toast('Añade una competición en Mi carrera.');return;}
  const next=m?list.find(x=>x.order>m.order)?.id||'':'';
  open(m?'Editar partido':'El próximo desafío',`<form id="match-form" data-id="${id||''}"><div class="form-grid">${field('Rival','rival',m?.rival||'','text','required maxlength="160" placeholder="Nombre del club" list="rivals"')}${select('Competición','competitionId',available.map(c=>[c.id,c.name]),m?.competitionId||available[0].id,'required')}${select('Dónde juegas','homeAway',[['home','Local · en casa'],['away','Visita · fuera de casa']],m?.homeAway||'home')}${field('Fecha del juego (opcional)','date',m?.date||'','text','maxlength="30" placeholder="2026-10-24 o 24 oct"')}${select('Posición en el calendario','before',[['','Al final'],...list.map(m=>[m.id,`Antes de ${m.rival} · ${dateLabel(m.date)}`])],next)}${field('Jornada manual (opcional)','matchdayOverride',m?.matchdayOverride||'','number','min="1" max="999" placeholder="Automática"')}</div><datalist id="rivals">${[...new Set(state.matches.map(m=>m.rival))].map(r=>`<option value="${e(r)}"></option>`).join('')}</datalist><div class="form-info">${icon('calendar')}<span id="matchday-preview"></span></div>${formFoot(m?'Guardar partido':'Añadir al calendario')}${m?`<div class="danger-zone">${button('Eliminar partido','delete-match','trash','text-btn danger',`data-id="${id}"`)}</div>`:''}</form>`);previewMatchday();
}
function previewMatchday(){const form=document.querySelector('#match-form');if(!form)return;const d=formData(form);const list=seasonMatches(state,se().id).filter(m=>m.id!==form.dataset.id);let before=list.findIndex(m=>m.id===d.before);if(before<0)before=list.length;const prior=list.slice(0,before).filter(m=>m.competitionId===d.competitionId);const day=Number(d.matchdayOverride)||(prior.at(-1)?.matchday||0)+1;document.querySelector('#matchday-preview').textContent=`Jornada ${day} · Los siguientes partidos de esta competición se renumeran al guardar.`;}
function recordForm(id){
  const m=state.matches.find(m=>m.id===id);if(!m)return;const st=m.stats||{goals:0,assists:0,rating:7,starter:true,motm:false,teamGoalsFor:'',teamGoalsAgainst:'',minutesPlayed:90};
  const season=state.seasons.find(s=>s.id===m.seasonId);
  open(m.status==='completed'?'Tu actuación':'Deja tu huella',`<p class="record-opponent">${e(season.club)} <span>vs</span> ${e(m.rival)}<small>${m.homeAway==='home'?'Local':'Visita'} · ${e(state.competitions.find(c=>c.id===m.competitionId)?.name)} · ${dateLabel(m.date)}</small></p><form id="record-form" data-id="${id}"><div class="score-inputs">${field('Goles de tu equipo','teamGoalsFor',st.teamGoalsFor??'','number','min="0" max="99" placeholder="—"')}<span>:</span>${field('Goles del rival','teamGoalsAgainst',st.teamGoalsAgainst??'','number','min="0" max="99" placeholder="—"')}</div><p class="hint">El marcador es opcional. Si lo anotas, completa ambos equipos.</p><div class="form-grid">${field('Tus goles','goals',st.goals,'number','required min="0" max="99"')}${field('Tus asistencias','assists',st.assists,'number','required min="0" max="99"')}${field('Nota del partido','rating',st.rating,'number','required min="0" max="10" step="0.1"')}${field('Minutos jugados','minutesPlayed',st.minutesPlayed,'number','required min="0" max="150"')}</div><div class="check-grid"><label class="check"><input type="checkbox" name="starter" ${st.starter?'checked':''}><span>Fui titular</span></label><label class="check"><input type="checkbox" name="motm" ${st.motm?'checked':''}><span>Jugador del partido ${icon('star')}</span></label></div>${formFoot('Guardar actuación')}${m.status==='completed'?`<div class="danger-zone">${button('Marcar como pendiente','reopen-match','refresh','text-btn',`data-id="${id}"`)}</div>`:''}</form>`);
}
function compForm(id){const c=state.competitions.find(c=>c.id===id);open(c?'Editar competición':'Una nueva competición',`<form id="comp-form" data-id="${id||''}">${field('Nombre','name',c?.name||'','text','required maxlength="100"')}<label class="check standalone"><input name="official" type="checkbox" ${c?.official!==false?'checked':''}><span>Competición oficial<small>Se incluye en las estadísticas por defecto</small></span></label>${formFoot()}</form>`);}
function awards(id){const season=state.seasons.find(s=>s.id===id);open('Cada logro tiene su lugar',`<p class="modal-copy">${e(season.name)} · ${e(season.club)}</p><form id="awards-form" data-id="${id}">${field('Veces jugador del mes','months',season.playerOfTheMonthCount,'number','required min="0" max="120"')}<label class="field"><span>Trofeos · uno por línea</span><textarea name="trophies" rows="5" maxlength="5000" placeholder="Liga\nChampions League">${e(season.trophies.join('\n'))}</textarea></label>${formFoot('Guardar reconocimientos')}</form>`);}
function download(text,name,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
async function backup(){
  const next={...state,settings:{...state.settings,lastBackupAt:new Date().toISOString()}};const text=buildBackup(next);const filename=`fc-tracker${ui.demo?'-demo':''}-${today()}.json`;
  const file=new File([text],filename,{type:'application/json'});
  if(navigator.canShare?.({files:[file]}))try{await navigator.share({files:[file],title:'Respaldo FC Tracker'});}catch(err){if(err.name==='AbortError')return;download(text,filename);}
  else download(text,filename);
  commit(next,'Respaldo preparado. Guarda el archivo en un lugar seguro.');
}
function backupText(){open('Tu respaldo en texto',`<p class="modal-copy">Copia el contenido completo y guárdalo en una nota o un archivo. Para restaurarlo, reemplaza este texto por tu respaldo y pulsa Revisar.</p><textarea id="backup-json" class="backup-text" rows="9" aria-label="Respaldo JSON" spellcheck="false">${e(buildBackup(state))}</textarea><p id="text-error" class="form-error" role="alert"></p><div class="form-footer">${button('Revisar para restaurar','parse-text','','btn secondary')}${button('Copiar respaldo','copy-backup','download','btn primary')}</div>`);}
function reviewRestore(data){restoreData=data;open('Restaurar tu carrera',`<p class="modal-copy">Este archivo reemplazará los datos ${ui.demo?'de la demo':'de este navegador'}.</p><div class="restore-summary"><strong>${e(data.player.name)}</strong><span>${data.seasons.length} temporadas · ${data.matches.length} partidos · ${data.competitions.length} competiciones</span></div><p class="hint">Descarga primero un respaldo de tu carrera actual si deseas conservarla.</p><div class="form-footer">${button('Respaldar actual','backup','download','btn secondary')}${button('Reemplazar y restaurar','apply-restore','check','btn primary')}</div>`);}
function exportCSV(){const list=ui.page==='stats'&&ui.statsSeason==='all'?state.seasons.flatMap(s=>seasonMatches(state,s.id)):seasonMatches(state,se()?.id);const filtered=ui.page==='stats'?filterMatches(list,ui.statsFilter):list;const safe=v=>{let s=String(v??'');if(/^[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const rows=[['Temporada','Rival','Fecha','Competición','Jornada','Local/Visita','Estado','Goles','Asistencias','Nota','Minutos','Titular','Jugador del partido','Goles equipo','Goles rival'],...filtered.map(m=>[state.seasons.find(s=>s.id===m.seasonId)?.name,m.rival,m.date,m.competition,m.matchday,m.homeAway==='home'?'Local':'Visita',m.status==='completed'?'Jugado':'Pendiente',m.stats?.goals,m.stats?.assists,m.stats?.rating,m.stats?.minutesPlayed,m.stats?m.stats.starter?'Sí':'No':'',m.stats?m.stats.motm?'Sí':'No':'',m.stats?.teamGoalsFor,m.stats?.teamGoalsAgainst])];download('\uFEFF'+rows.map(r=>r.map(safe).join(';')).join('\r\n'),`fc-tracker-partidos-${today()}.csv`,'text/csv;charset=utf-8');toast('CSV exportado con el filtro actual.');}

const actions={
  close,setup,'edit-player':playerForm,'new-season':seasonForm,'new-match':()=>matchForm(),'edit-match':b=>matchForm(b.dataset.id),record:b=>recordForm(b.dataset.id),'new-comp':()=>compForm(),'edit-comp':b=>compForm(b.dataset.id),awards:b=>awards(b.dataset.id),
  profile:()=>{location.hash='profile';},
  'calendar-tab':b=>{ui.calendarTab=b.dataset.value;render();},
  'season-comps':b=>{const season=state.seasons.find(s=>s.id===b.dataset.id);open('Las competiciones de tu temporada',`<p class="modal-copy">${e(season.name)}</p><form id="season-comps-form" data-id="${season.id}">${competitionChecks(season.competitionIds)}${formFoot()}</form>`);},
  'end-season':b=>confirmAction('Cerrar este capítulo',`¿Finalizar ${e(state.seasons.find(s=>s.id===b.dataset.id).name)}? Sus partidos, estadísticas y títulos se conservarán. Podrás iniciar una nueva temporada.`, 'confirm-end',`data-id="${b.dataset.id}"`),
  'confirm-end':b=>{if(commit({...state,seasons:state.seasons.map(s=>s.id===b.dataset.id?{...s,status:'finished',endDate:today()}:s)},'Temporada finalizada'))close();},
  'delete-comp':b=>{try{removeCompetition(state,b.dataset.id);confirmAction('Eliminar competición','Se quitará del catálogo y de la selección de temporadas.','confirm-delete-comp',`data-id="${b.dataset.id}"`);}catch(err){toast(err.message);}},
  'confirm-delete-comp':b=>{if(commit(removeCompetition(state,b.dataset.id),'Competición eliminada'))close();},
  'delete-match':b=>confirmAction('Eliminar partido','Se borrará este partido y su actuación, si la tiene. Las jornadas siguientes se ajustarán automáticamente.','confirm-delete-match',`data-id="${b.dataset.id}"`),
  'confirm-delete-match':b=>{if(commit({...state,matches:state.matches.filter(m=>m.id!==b.dataset.id)},'Partido eliminado'))close();},
  'reopen-match':b=>confirmAction('Volver a dejarlo pendiente','Se eliminarán el marcador y tus estadísticas de este partido.','confirm-reopen',`data-id="${b.dataset.id}"`),
  'confirm-reopen':b=>{if(commit({...state,matches:state.matches.map(m=>m.id===b.dataset.id?{...m,status:'pending',stats:null}:m)},'Partido pendiente'))close();},
  backup,'backup-text':backupText,'parse-text':()=>{try{reviewRestore(parseBackup(document.querySelector('#backup-json').value));}catch(err){document.querySelector('#text-error').textContent=err.message;}},
  'copy-backup':async()=>{const area=document.querySelector('#backup-json');const text=area.value;try{await navigator.clipboard.writeText(text);toast('Texto copiado. Guárdalo completo en una nota.');let current=false;try{current=JSON.stringify(parseBackup(text))===JSON.stringify(normalize(state));}catch{}if(current)commit({...state,settings:{...state.settings,lastBackupAt:new Date().toISOString()}},'');}catch{area.select();toast('Texto seleccionado. Usa Copiar en el menú de tu dispositivo.');}},
  restore:()=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const f=input.files[0];if(!f)return;if(f.size>12*1024*1024)throw Error('Máximo 12 MB por respaldo.');reviewRestore(parseBackup(await f.text()));}catch(err){toast(err.message);}};input.click();},
  'apply-restore':()=>{if(restoreData){if(commit(restoreData,'Carrera restaurada')){ui.season='';restoreData=null;close();render();}}},
  demo:()=>{if(ui.demo){toast('Ya estás explorando la demo.');return;}realState=state;state=demoState();ui.demo=true;ui.season='';ui.page='home';location.hash='home';close();render();toast('Demo activada. Tu carrera está a salvo.');},
  'exit-demo':()=>{state=realState||freshState();realState=null;ui.demo=false;ui.season='';close();render();},
  reset:()=>{open('Borrar mi carrera',`<p class="modal-copy">Esto elimina tu jugador, temporadas, partidos y escudos aprendidos ${ui.demo?'de la demo':'de este navegador'}. Descarga un respaldo antes si quieres conservarlos.</p><form id="reset-form">${field('Escribe BORRAR para confirmar','confirm','','text','required pattern="BORRAR" autocomplete="off"')}${formFoot('Borrar datos')}</form>`);},
  reload:()=>location.reload(),csv:exportCSV,
  scan:()=>{if(!se()){setup();return;}scan={image:null,rect:null,rows:[],busy:false};scanView();},
  'scan-help':()=>open('Del juego a tu calendario',`<div class="help-steps"><p><strong>01 · Captura el calendario.</strong> Usa una captura nítida o una foto frontal, sin reflejos. Los textos grandes y los nombres completos se leen mejor.</p><p><strong>02 · Selecciona y lee.</strong> En Calendario → Importar captura, marca con el dedo o el ratón una fila o casilla del juego. Lee el texto y revisa rival, local/visita y competición. Puedes repetir con varias casillas.</p><p><strong>03 · Enséñale los escudos.</strong> Si el juego solo muestra el escudo, recórtalo, escribe el nombre del rival y guarda. La app recordará su aspecto y podrá sugerir ese rival en capturas parecidas.</p><p><strong>04 · Revisa y añade.</strong> No existe un detector universal de escudos. Las sugerencias siempre requieren revisión; los campos desconocidos quedan vacíos. El aprendizaje se conserva en tus respaldos.</p><p class="form-info">Las fotos se procesan en el dispositivo y no se guardan. Solo se conserva una pequeña firma visual de los escudos que asignes.</p></div>${button('Entendido','close','check','btn primary')}`,true),
  'scan-read':()=>scanRead(),'scan-full':()=>{scan.rect=null;drawSelection();},'scan-badge':()=>scanBadge(),
  'scan-add-row':()=>{syncRows();scan.rows.push({id:uid(),rival:'',date:'',competitionId:'',homeAway:'',checked:true});renderRows();},
  'scan-remove-row':b=>{syncRows();scan.rows=scan.rows.filter(r=>r.id!==b.dataset.id);renderRows();},
  'scan-parse':()=>{syncRows();const text=document.querySelector('#ocr-text').value;const rows=parseFixtureText(text,comps(),[...new Set(state.matches.map(m=>m.rival))]);scan.rows.push(...rows.map(r=>({...r,id:uid(),checked:true})));renderRows();toast(`${rows.length} líneas preparadas. Revisa los datos.`);},
  'scan-import':()=>scanImport()
};
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-act]');if(!b||b.disabled)return;try{await actions[b.dataset.act]?.(b);}catch(err){toast(err.message||'No se pudo completar la acción.');}});
document.addEventListener('submit',ev=>{
  const f=ev.target;if(!f.id.endsWith('-form'))return;ev.preventDefault();const d=formData(f);const id=f.dataset.id;let next;
  try{
    if(f.id==='setup-form'){next={...state,player:{name:d.name.trim(),club:d.club.trim(),position:d.position,overall:Number(d.overall),number:Number(d.number)}};next=startSeason(next,{name:d.season,club:d.club,competitionIds:new FormData(f).getAll('competitionIds')});ui.season='';}
    if(f.id==='player-form')next={...state,player:{name:d.name.trim(),club:d.club.trim(),position:d.position,overall:Number(d.overall),number:Number(d.number)},seasons:state.seasons.map(s=>s.status==='active'?{...s,club:d.club.trim()}:s)};
    if(f.id==='season-form'){next=startSeason(state,{...d,competitionIds:new FormData(f).getAll('competitionIds')});ui.season='';}
    if(f.id==='season-comps-form')next={...state,seasons:state.seasons.map(s=>s.id===id?{...s,competitionIds:new FormData(f).getAll('competitionIds')}:s)};
    if(f.id==='match-form'){
      if(!d.rival.trim())throw Error('Escribe el nombre del rival.');
      if(!id)next=addMatch(state,se().id,d,d.before);
      else{
        const m=state.matches.find(m=>m.id===id);const list=state.matches.filter(x=>x.seasonId===m.seasonId&&x.id!==id).sort((a,b)=>a.order-b.order);let at=list.findIndex(m=>m.id===d.before);if(at<0)at=list.length;
        list.splice(at,0,{...m,rival:d.rival.trim(),competitionId:d.competitionId,homeAway:d.homeAway,date:d.date.trim(),matchdayOverride:d.matchdayOverride?Number(d.matchdayOverride):null});next={...state,matches:[...state.matches.filter(x=>x.seasonId!==m.seasonId),...list.map((x,i)=>({...x,order:i}))]};
      }
    }
    if(f.id==='record-form'){
      if((d.teamGoalsFor==='')!==(d.teamGoalsAgainst===''))throw Error('Completa los dos marcadores o deja ambos vacíos.');
      if(d.teamGoalsFor!==''&&Number(d.goals)>Number(d.teamGoalsFor))throw Error('Tus goles no pueden superar los goles de tu equipo.');
      const st=cleanStats({...d,starter:d.starter==='on',motm:d.motm==='on'});
      next={...state,matches:state.matches.map(m=>m.id===id?{...m,status:'completed',stats:st}:m)};
    }
    if(f.id==='comp-form'){
      const name=d.name.trim();if(!name)throw Error('Escribe un nombre.');if(state.competitions.some(c=>c.id!==id&&c.name.toLowerCase()===name.toLowerCase()))throw Error('Ya existe una competición con ese nombre.');
      const c={id:id||uid(),name,official:d.official==='on'};next={...state,competitions:id?state.competitions.map(x=>x.id===id?c:x):[...state.competitions,c]};
    }
    if(f.id==='awards-form')next={...state,seasons:state.seasons.map(s=>s.id===id?{...s,playerOfTheMonthCount:Number(d.months),trophies:[...new Set(d.trophies.split('\n').map(t=>t.trim()).filter(Boolean))]}:s)};
    if(f.id==='reset-form'){if(d.confirm!=='BORRAR')throw Error('Escribe BORRAR para confirmar.');next=freshState();ui.season='';}
    if(next&&commit(next))close();
  }catch(err){f.querySelector('.form-error').textContent=err.message;}
});
document.addEventListener('change',ev=>{
  const t=ev.target;
  if(t.id==='season-picker'){ui.season=t.value;render();}
  if(t.id==='calendar-comp'){ui.calendarComp=t.value;render();}
  if(t.id==='stats-filter'){ui.statsFilter=t.value;render();}
  if(t.id==='stats-season'){ui.statsSeason=t.value;render();}
  if(t.closest('#match-form'))previewMatchday();
  if(t.name==='starter'&&t.closest('#record-form')){const minutes=t.form.elements.minutesPlayed;if(minutes.value==='90'||minutes.value==='20')minutes.value=t.checked?'90':'20';}
});
document.addEventListener('input',ev=>{if(ev.target.id==='search-rival'){const start=ev.target.selectionStart;ui.search=ev.target.value;render();const input=document.querySelector('#search-rival');input.focus();try{input.setSelectionRange(start,start);}catch{}}if(ev.target.closest('#match-form'))previewMatchday();});
modal.addEventListener('cancel',ev=>{ev.preventDefault();close();});
window.addEventListener('hashchange',()=>{ui.page=location.hash.slice(1)||'home';render();window.scrollTo(0,0);});
window.addEventListener('storage',ev=>{if(ev.key===KEY){ui.conflict=true;render();}});
ui.page=location.hash.slice(1)||'home';render();
if(corrupt)open('Tus datos necesitan revisión',`<p class="modal-copy">Hay datos guardados que no se pueden leer. No los hemos sobrescrito. Descarga la copia original para conservarla y después restaura un respaldo válido o empieza una carrera nueva.</p><div class="form-footer">${button('Descargar original','raw-download','download','btn secondary')}${button('Elegir recuperación','recover-options','','btn primary')}</div>`);
actions['raw-download']=()=>{try{download(localStorage.getItem(KEY)||'','fc-tracker-datos-originales.txt','text/plain');}catch{toast('El navegador no permite acceder al almacenamiento.');}};
actions['recover-options']=()=>open('Recuperar o empezar de nuevo',`<p class="modal-copy">Los datos originales se conservarán en otra clave del navegador, si hay espacio. Descarga antes el original.</p><div class="form-footer">${button('Restaurar respaldo','restore','upload','btn secondary')}${button('Crear nueva carrera','recover-reset','plus','btn primary')}</div>`);
actions['recover-reset']=()=>{try{localStorage.setItem('fc-tracker:corrupt-copy',localStorage.getItem(KEY)||'');}catch{toast('No hay espacio. Descarga primero el original.');return;}corrupt=false;ui.saveFailed=false;commit(freshState());close();setup();};
const applyRestore=actions['apply-restore'];actions['apply-restore']=()=>{if(corrupt){try{localStorage.setItem('fc-tracker:corrupt-copy',localStorage.getItem(KEY)||'');}catch{toast('Descarga el original y libera espacio antes de restaurar.');return;}corrupt=false;}applyRestore();};

function scanView(){
  open('Del juego a tu calendario',`<p class="modal-copy">Carga una captura y selecciona una fila o casilla para leerla. Repite con varios partidos y revísalos antes de guardar.</p><div class="scan-layout"><div><label class="drop-zone">${icon('image')}<strong>Elige una captura o foto</strong><span>PNG, JPG o WebP · hasta 15 MB</span><input type="file" id="scan-file" accept="image/png,image/jpeg,image/webp"></label><div id="image-editor" hidden><div class="canvas-wrap"><canvas id="scan-canvas" aria-label="Captura: arrastra para seleccionar una fila o un escudo"></canvas><div id="crop-selection"></div></div><p class="hint">Arrastra para seleccionar una casilla o un escudo. También puedes leer la imagen completa.</p><div class="scan-tools">${button('Leer selección','scan-read','search','btn primary')}${button('Es un escudo','scan-badge','shield','btn secondary')}${button('Imagen completa','scan-full','','text-btn')}</div></div><p id="scan-status" class="scan-status" role="status"></p><details class="ocr-details"><summary>Texto detectado / pegar calendario</summary><p class="hint">Una línea por partido: 2026-10-24 | Sevilla FC | Local | Liga. Si se lee en desorden, selecciona solo una casilla.</p><textarea id="ocr-text" rows="5" aria-label="Texto del calendario" placeholder="2026-10-24 | Sevilla FC | Local | Liga"></textarea>${button('Preparar desde texto','scan-parse','arrow','btn small secondary')}</details></div><div class="scan-instructions"><span class="eyebrow">UN ASISTENTE, TÚ TIENES EL CONTROL</span><h3>Primero lee.<br>Después confirma.</h3><p>El lector busca texto, no conoce todos los escudos del fútbol.</p><p>Si solo aparece un escudo, selecciona su contorno y pulsa <strong>Es un escudo</strong>. Asígnale un rival: la app lo recordará para sugerirlo en capturas parecidas.</p><p>Las fechas, competiciones o localías dudosas quedan para que las completes. La foto nunca sale de tu dispositivo.</p></div></div><div class="scan-review-heading"><h3>Partidos para revisar <span id="scan-count">0</span></h3>${button('Añadir fila manual','scan-add-row','plus','btn small secondary')}</div><div id="scan-rows"></div><p id="scan-error" class="form-error" role="alert"></p><div class="form-footer">${button('Cancelar','close','','btn secondary')}${button('Añadir seleccionados','scan-import','check','btn primary')}</div>`,true);
  document.querySelector('#scan-file').addEventListener('change',async ev=>{
    const file=ev.target.files[0];if(!file)return;
    try{
      if(file.size>15*1024*1024)throw Error('La imagen supera los 15 MB. Usa una captura más pequeña.');
      if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Usa PNG, JPG o WebP.');
      const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}
      const scale=Math.min(1,3200/Math.max(img.width,img.height));const canvas=document.querySelector('#scan-canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      scan.image=canvas;scan.rect=null;document.querySelector('#image-editor').hidden=false;document.querySelector('#scan-status').textContent='Captura lista. Selecciona un partido para leerlo.';drawSelection();
      let origin=null;
      const point=ev=>{const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,(ev.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(ev.clientY-r.top)*canvas.height/r.height))};};
      canvas.onpointerdown=ev=>{if(scan.busy)return;origin=point(ev);canvas.setPointerCapture(ev.pointerId);ev.preventDefault();};
      canvas.onpointermove=ev=>{if(!origin)return;const p=point(ev);scan.rect={x:Math.min(p.x,origin.x),y:Math.min(p.y,origin.y),w:Math.abs(p.x-origin.x),h:Math.abs(p.y-origin.y)};drawSelection();};
      canvas.onpointerup=()=>{origin=null;if(scan.rect&&(scan.rect.w<6||scan.rect.h<6))scan.rect=null;drawSelection();};
      canvas.onpointercancel=()=>{origin=null;};
    }catch(err){toast(err.message);}
  });renderRows();
}
function drawSelection(){const box=document.querySelector('#crop-selection');if(!box)return;box.hidden=!scan.rect;if(scan.rect){const c=scan.image,r=scan.rect;Object.assign(box.style,{left:r.x/c.width*100+'%',top:r.y/c.height*100+'%',width:r.w/c.width*100+'%',height:r.h/c.height*100+'%'});}}
function syncRows(){document.querySelectorAll('.scan-row').forEach(el=>{const r=scan.rows.find(r=>r.id===el.dataset.id);if(!r)return;el.querySelectorAll('[data-key]').forEach(input=>{r[input.dataset.key]=input.type==='checkbox'?input.checked:input.value;});});}
function renderRows(){document.querySelector('#scan-count').textContent=scan.rows.length;document.querySelector('#scan-rows').innerHTML=scan.rows.length?scan.rows.map((r,i)=>`<div class="scan-row" data-id="${r.id}"><div class="scan-row-head"><label class="check"><input type="checkbox" data-key="checked" ${r.checked?'checked':''}> Partido ${i+1}</label>${r.thumb?`<img src="${r.thumb}" alt="Escudo recortado" width="40" height="40">`:''}${button('','scan-remove-row','trash','icon-btn',`data-id="${r.id}" aria-label="Quitar partido ${i+1}"`)}</div>${r.suggestion?`<p class="hint">Sugerencia por parecido: ${e(r.suggestion)}. Confirma o corrige el nombre.</p>`:''}<div class="form-grid">${field('Rival','rival',r.rival,'text',`data-key="rival" maxlength="160" placeholder="Completar rival"`)}${field('Fecha (opcional)','date',r.date,'text',`data-key="date" maxlength="30" placeholder="2026-10-24"`)}${select('Local o visita','homeAway',[['','Seleccionar…'],['home','Local'],['away','Visita']],r.homeAway,'data-key="homeAway"')}${select('Competición','competitionId',[['','Seleccionar…'],...comps().map(c=>[c.id,c.name])],r.competitionId,'data-key="competitionId"')}</div></div>`).join(''):'<div class="scan-empty">Todavía no hay partidos. Lee una selección o añade una fila manual.</div>';}
async function scanRead(){
  if(!scan.image){toast('Elige primero una captura.');return;}if(scan.busy)return;syncRows();scan.busy=true;
  const controls=[...modal.querySelectorAll('button,input[type=file]')];controls.forEach(b=>b.disabled=true);
  const status=document.querySelector('#scan-status');status.textContent='Preparando lector local…';
  try{const text=await readImage(cropCanvas(scan.image,scan.rect),message=>{status.textContent=message;});document.querySelector('#ocr-text').value=text;
    const rows=parseFixtureText(text,comps(),[...new Set(state.matches.map(m=>m.rival))]);
    // A single cell often has its text split over lines. Combine it into one proposal.
    const proposals=scan.rect&&rows.length>1?parseFixtureText(text.replace(/\n+/g,' | '),comps(),[...new Set(state.matches.map(m=>m.rival))]):rows;
    scan.rows.push(...proposals.map(r=>({...r,id:uid(),checked:true})));renderRows();status.textContent=proposals.length?`${proposals.length} propuestas preparadas. Revisa cada campo antes de añadir.`:'No se detectó texto legible. Prueba una selección más cercana o asigna el escudo manualmente.';
  }catch(err){status.textContent='No se pudo leer la captura. Puedes completar los partidos manualmente.';toast(err.message);}finally{scan.busy=false;controls.forEach(b=>b.disabled=false);}
}
function scanBadge(){if(!scan.image||!scan.rect){toast('Selecciona el contorno de un escudo en la imagen.');return;}syncRows();const crop=cropCanvas(scan.image,scan.rect),vector=badgeVector(crop),suggestion=suggestBadge(vector,state.badgeTemplates);const thumb=document.createElement('canvas');thumb.width=64;thumb.height=64;thumb.getContext('2d').drawImage(crop,0,0,64,64);scan.rows.push({id:uid(),rival:suggestion,date:'',homeAway:'',competitionId:'',checked:true,vector,thumb:thumb.toDataURL('image/png'),suggestion});renderRows();toast(suggestion?'Escudo parecido encontrado. Confirma los datos.':'Escribe el rival para aprender este escudo.');}
function scanImport(){
  syncRows();const selected=scan.rows.filter(r=>r.checked),err=document.querySelector('#scan-error');
  if(!selected.length){err.textContent='Selecciona al menos un partido.';return;}
  if(selected.some(r=>!r.rival.trim()||!r.homeAway||!r.competitionId)){err.textContent='Completa rival, local/visita y competición en cada partido seleccionado.';return;}
  let next=state,duplicates=0,added=0;
  for(const r of selected){if(r.date.trim()&&next.matches.some(m=>m.seasonId===se().id&&m.rival.toLowerCase()===r.rival.trim().toLowerCase()&&m.competitionId===r.competitionId&&m.date===r.date.trim()&&m.homeAway===r.homeAway)){duplicates++;continue;}next=addMatch(next,se().id,{...r,date:r.date.trim()});added++;if(r.vector){const templates=[...next.badgeTemplates];if(!templates.some(b=>b.name.toLowerCase()===r.rival.trim().toLowerCase()&&b.vector.every((n,i)=>n===r.vector[i])))templates.push({name:r.rival.trim(),vector:r.vector});next={...next,badgeTemplates:templates.slice(-200)};}}
  if(!added){err.textContent='Estos partidos ya existen con el mismo rival, fecha, competición y localía.';return;}
  if(commit(next,`${added} partidos añadidos${duplicates?` · ${duplicates} duplicados omitidos`:''}`)){close();ui.page='calendar';ui.calendarTab='pending';location.hash='calendar';render();}
}

if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).then(reg=>{
    const update=worker=>worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)toast('Hay una nueva versión. Cierra y vuelve a abrir la app para actualizar.');});
    update(reg.installing);reg.addEventListener('updatefound',()=>update(reg.installing));
  }).catch(()=>toast('El modo sin conexión no está disponible en este navegador.'));
}
if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
