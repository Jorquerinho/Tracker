import {KEY,uid,today,freshState,normalize,activeSeason,seasonMatches,filterMatches,stats,startSeason,addMatch,removeCompetition,cleanStats,buildBackup,parseBackup,demoState,setClubBadge,clubKey} from './domain.js';
import {e,icon,button,field,teamField,select,shell,dateLabel,initials} from './ui.js';
import {badgeThumbnail} from './images.js';
import {bindTeamPickers} from './team-picker.js';
import {canonicalTeamName} from './teams.js';
const root=document.querySelector('#app'),modal=document.querySelector('#modal');
let state=freshState(),realState=null,corrupt=false,restoreData=null,returnFocus=null;
const ui={page:'home',season:'',demo:false,saveFailed:false,conflict:false,calendarTab:'pending',calendarComp:'all',search:'',statsFilter:'official',statsSeason:'selected'};
try{const raw=localStorage.getItem(KEY);if(raw)state=normalize(JSON.parse(raw));}catch{corrupt=true;ui.saveFailed=true;}
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
function close(){modal.close();modal.innerHTML='';returnFocus?.focus();}
function open(title,content,wide=false){
  if(!modal.open)returnFocus=document.activeElement;
  modal.className=wide?'wide':'';modal.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">FC TRACKER / TU CARRERA</span><h2 id="modal-title">${title}</h2></div>${button('','close','close','icon-btn','aria-label="Cerrar"')}</div>${content}`;
  if(!modal.open)modal.showModal();modal.scrollTop=0;bindTeamPickers(modal,[state.player.club,...state.matches.map(m=>m.rival),...(state.clubBadges||[]).map(b=>b.name)]);
}
const formFoot=(text='Guardar cambios')=>`<p class="form-error" role="alert"></p><div class="form-footer">${button('Cancelar','close','','btn secondary')}<button class="btn primary" type="submit">${text}${icon('check')}</button></div>`;
const formData=form=>Object.fromEntries(new FormData(form));
function confirmAction(title,text,action,extra=''){open(title,`<p class="modal-copy">${text}</p><div class="form-footer">${button('Cancelar','close','','btn secondary')}${button('Confirmar',action,'check','btn primary',extra)}</div>`);}
function setup(){const p=state.player;open('Aquí empieza tu legado.',`<p class="modal-copy">Define tu jugador y su primera temporada. Puedes cambiar estos datos cuando quieras.</p><form id="setup-form"><div class="form-grid">${field('Nombre del jugador','name',p.name==='Mi jugador'?'':p.name,'text','required maxlength="80" autocomplete="off"')}${teamField('Club','club',p.club,true)}${select('Posición','position',positions,p.position)}${field('Media general','overall',p.overall,'number','min="1" max="99" required')}${field('Dorsal','number',p.number,'number','min="1" max="99" required')}${field('Temporada','season',`Temporada ${new Date().getFullYear()}/${String(new Date().getFullYear()+1).slice(2)}`,'text','required maxlength="100"')}</div><h3 class="form-subtitle">¿Qué competiciones vas a jugar?</h3>${competitionChecks(state.competitions.map(c=>c.id))}${formFoot('Empezar mi carrera')}</form>`);}
const positions=['POR','DFC','LI','LD','MCD','MC','MCO','MI','MD','EI','ED','SD','DC'].map(s=>[s,s]);
function competitionChecks(ids){return `<div class="check-grid">${state.competitions.map(c=>`<label class="check"><input type="checkbox" name="competitionIds" value="${c.id}" ${ids.includes(c.id)?'checked':''}><span>${e(c.name)}<small>${c.official?'Oficial':'No oficial'}</small></span></label>`).join('')}</div><p class="hint">Si no marcas ninguna, se usará todo el catálogo.</p>`;}
function playerForm(){const p=state.player;open('Tu ficha de jugador',`<form id="player-form"><div class="form-grid">${field('Nombre','name',p.name,'text','required maxlength="80"')}${teamField('Club actual','club',p.club)}${select('Posición','position',positions,p.position)}${field('Media general','overall',p.overall,'number','required min="1" max="99"')}${field('Dorsal','number',p.number,'number','required min="1" max="99"')}</div><p class="hint">El club de las temporadas anteriores se conserva en el historial.</p>${formFoot()}</form>`);}
function seasonForm(){open('Un nuevo capítulo',`<p class="modal-copy">${activeSeason(state)?'Al iniciar esta temporada, la actual quedará finalizada. Sus partidos y estadísticas se conservarán.':'Elige tu club y las competiciones de esta temporada.'}</p><form id="season-form"><div class="form-grid">${field('Nombre de la temporada','name','','text','required maxlength="100" placeholder="Temporada 2027/28"')}${teamField('Club','club',state.player.club,true)}</div><h3 class="form-subtitle">Competiciones</h3>${competitionChecks(state.competitions.map(c=>c.id))}${formFoot('Iniciar temporada')}</form>`);}
function matchForm(id){
  if(!se()){setup();return;}
  const m=state.matches.find(m=>m.id===id),list=seasonMatches(state,se().id).filter(x=>x.id!==id);
  // Existing matches remain editable even if their competition was later deselected.
  const available=m?state.competitions.filter(c=>comps().some(x=>x.id===c.id)||c.id===m.competitionId):comps();
  if(!available.length){toast('Añade una competición en Mi carrera.');return;}
  const next=m?list.find(x=>x.order>m.order)?.id||'':'';
  open(m?'Editar partido':'El próximo desafío',`<form id="match-form" data-id="${id||''}"><div class="form-grid">${teamField('Rival','rival',m?.rival||'',true)}${select('Competición','competitionId',available.map(c=>[c.id,c.name]),m?.competitionId||available[0].id,'required')}${select('Dónde juegas','homeAway',[['home','Local · en casa'],['away','Visita · fuera de casa']],m?.homeAway||'home')}${field('Fecha del juego (opcional)','date',m?.date||'','text','maxlength="30" placeholder="2026-10-24 o 24 oct"')}${select('Posición en el calendario','before',[['','Al final'],...list.map(m=>[m.id,`Antes de ${m.rival} · ${dateLabel(m.date)}`])],next)}${field('Jornada manual (opcional)','matchdayOverride',m?.matchdayOverride||'','number','min="1" max="999" placeholder="Automática"')}</div><div class="form-info">${icon('calendar')}<span id="matchday-preview"></span></div>${formFoot(m?'Guardar partido':'Añadir al calendario')}${m?`<div class="danger-zone">${button('Eliminar partido','delete-match','trash','text-btn danger',`data-id="${id}"`)}</div>`:''}</form>`);previewMatchday();
}
function previewMatchday(){const form=document.querySelector('#match-form');if(!form)return;const d=formData(form);const list=seasonMatches(state,se().id).filter(m=>m.id!==form.dataset.id);let before=list.findIndex(m=>m.id===d.before);if(before<0)before=list.length;const prior=list.slice(0,before).filter(m=>m.competitionId===d.competitionId);const day=Number(d.matchdayOverride)||(prior.at(-1)?.matchday||0)+1;document.querySelector('#matchday-preview').textContent=`Jornada ${day} · Los siguientes partidos de esta competición se renumeran al guardar.`;}
function recordForm(id){
  const m=state.matches.find(m=>m.id===id);if(!m)return;const st=m.stats||{goals:0,assists:0,rating:7,starter:true,motm:false,teamGoalsFor:'',teamGoalsAgainst:'',minutesPlayed:90};
  const season=state.seasons.find(s=>s.id===m.seasonId);
  open(m.status==='completed'?'Tu actuación':'Deja tu huella',`<p class="record-opponent">${e(season.club)} <span>vs</span> ${e(m.rival)}<small>${m.homeAway==='home'?'Local':'Visita'} · ${e(state.competitions.find(c=>c.id===m.competitionId)?.name)} · ${dateLabel(m.date)}</small></p><form id="record-form" data-id="${id}"><div class="score-inputs">${field('Goles de tu equipo','teamGoalsFor',st.teamGoalsFor??'','number','min="0" max="99" placeholder="—"')}<span>:</span>${field('Goles del rival','teamGoalsAgainst',st.teamGoalsAgainst??'','number','min="0" max="99" placeholder="—"')}</div><p class="hint">El marcador es opcional. Si lo anotas, completa ambos equipos.</p><div class="form-grid">${field('Tus goles','goals',st.goals,'number','required min="0" max="99"')}${field('Tus asistencias','assists',st.assists,'number','required min="0" max="99"')}${field('Nota del partido','rating',st.rating,'number','required min="0" max="10" step="0.1"')}${field('Minutos jugados','minutesPlayed',st.minutesPlayed,'number','required min="0" max="150"')}</div><div class="check-grid"><label class="check"><input type="checkbox" name="starter" ${st.starter?'checked':''}><span>Fui titular</span></label><label class="check"><input type="checkbox" name="motm" ${st.motm?'checked':''}><span>Jugador del partido ${icon('star')}</span></label></div>${formFoot('Guardar actuación')}${m.status==='completed'?`<div class="danger-zone">${button('Marcar como pendiente','reopen-match','refresh','text-btn',`data-id="${id}"`)}</div>`:''}</form>`);
}
function compForm(id){const c=state.competitions.find(c=>c.id===id);open(c?'Editar competición':'Una nueva competición',`<form id="comp-form" data-id="${id||''}">${field('Nombre','name',c?.name||'','text','required maxlength="100"')}<label class="check standalone"><input name="official" type="checkbox" ${c?.official!==false?'checked':''}><span>Competición oficial<small>Se incluye en las estadísticas por defecto</small></span></label>${formFoot()}</form>`);}
function badgeForm(name=''){
  const stored=(state.clubBadges||[]).find(b=>clubKey(b.name)===clubKey(name));
  open(stored?'Cambiar escudo del club':'Un escudo original para tu club',`<p class="modal-copy">Carga un PNG, JPG o WebP. Un PNG transparente se ve mejor. La imagen se reduce a 128 × 128 px y se guarda en este dispositivo.</p><form id="badge-form">${field('Nombre del club','name',stored?.name||name,'text',`required maxlength="160" list="badge-names" ${stored?'readonly':''}`)}<datalist id="badge-names">${[...new Set([state.player.club,...state.seasons.map(s=>s.club),...state.matches.map(m=>m.rival)].filter(Boolean))].map(n=>`<option value="${e(n)}"></option>`).join('')}</datalist><label class="field"><span>Archivo del escudo · hasta 8 MB</span><input type="file" id="badge-file" accept="image/png,image/jpeg,image/webp"></label><div class="badge-file-preview"><img id="badge-preview" ${stored?`src="${e(stored.image)}"`:'hidden'} alt="Vista previa del escudo" width="96" height="96"><span id="badge-file-status">${stored?'Escudo actual. Elige otra imagen para reemplazarlo.':'Elige una imagen para verla aquí.'}</span></div>${formFoot('Guardar escudo')}</form>`);
  document.querySelector('#badge-file').addEventListener('change',async ev=>{
    const file=ev.target.files[0];if(!file)return;const form=ev.target.form;
    try{
      if(file.size>8*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Usa una imagen PNG, JPG o WebP de hasta 8 MB.');
      form.querySelector('button[type=submit]').disabled=true;
      const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}
      if(!form.isConnected)return;
      const preview=form.querySelector('#badge-preview');preview.src=badgeThumbnail(img);preview.hidden=false;form.querySelector('#badge-file-status').textContent='Imagen lista. Guarda para usarla en todos los partidos de este club.';form.querySelector('.form-error').textContent='';
    }catch(err){if(form.isConnected)form.querySelector('.form-error').textContent=err.message;}finally{if(form.isConnected)form.querySelector('button[type=submit]').disabled=false;}
  });
}
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
  reset:()=>{open('Borrar mi carrera',`<p class="modal-copy">Esto elimina tu jugador, temporadas, partidos e imágenes personales ${ui.demo?'de la demo':'de este navegador'}. Descarga un respaldo antes si quieres conservarlos.</p><form id="reset-form">${field('Escribe BORRAR para confirmar','confirm','','text','required pattern="BORRAR" autocomplete="off"')}${formFoot('Borrar datos')}</form>`);},
  reload:()=>location.reload(),csv:exportCSV,
  'new-badge':()=>badgeForm(),
  'edit-badge':b=>badgeForm(b.dataset.name),
  'delete-badge':b=>confirmAction('Quitar escudo',`Se quitará la imagen guardada de ${e(b.dataset.name)}. Sus partidos se conservan.`, 'confirm-delete-badge',`data-name="${e(b.dataset.name)}"`),
  'confirm-delete-badge':b=>{if(commit({...state,clubBadges:(state.clubBadges||[]).filter(c=>clubKey(c.name)!==clubKey(b.dataset.name)),badgeTemplates:state.badgeTemplates.filter(c=>clubKey(c.name)!==clubKey(b.dataset.name))},'Escudo eliminado'))close();}
};
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-act]');if(!b||b.disabled)return;try{await actions[b.dataset.act]?.(b);}catch(err){toast(err.message||'No se pudo completar la acción.');}});
document.addEventListener('error',ev=>{const img=ev.target;if(img.tagName!=='IMG'||!img.matches('.club-badge.original'))return;const fallback=document.createElement('span');fallback.className=img.className.replace('original','');fallback.setAttribute('aria-hidden','true');fallback.textContent=initials(img.dataset.club||'FC');fallback.style.setProperty('--badge-hue','90');img.replaceWith(fallback);},true);
document.addEventListener('submit',ev=>{
  const f=ev.target;if(!f.id.endsWith('-form'))return;ev.preventDefault();const d=formData(f);if(d.club!=null)d.club=canonicalTeamName(d.club);if(d.rival!=null)d.rival=canonicalTeamName(d.rival);const id=f.dataset.id;let next;
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
    if(f.id==='badge-form'){if(!d.name.trim())throw Error('Escribe el nombre del club.');const image=f.querySelector('#badge-preview').getAttribute('src');next=setClubBadge(state,d.name,image);}
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

if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.addEventListener('message',ev=>{if(ev.data?.type==='crests-ready')toast(`${ev.data.total} escudos preparados para usar sin conexión.`);});
  navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).then(reg=>{
    const update=worker=>worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)toast('Hay una nueva versión. Cierra y vuelve a abrir la app para actualizar.');});
    update(reg.installing);reg.addEventListener('updatefound',()=>update(reg.installing));
  }).catch(()=>toast('El modo sin conexión no está disponible en este navegador.'));
}
if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
