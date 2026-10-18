import {findTeam,suggestTeams} from './teams.js';
import {e,badge,icon} from './ui.js';
export function bindTeamPickers(container,customNames=[]){
  for(const picker of container.querySelectorAll('.team-picker')){
    if(picker.dataset.bound)continue;picker.dataset.bound='true';
    const input=picker.querySelector('input'),toggle=picker.querySelector('.team-picker-toggle'),list=picker.querySelector('[role=listbox]'),preview=picker.querySelector('.team-picker-preview');
    let results=[],active=-1;
    const showPreview=()=>{const team=findTeam(input.value);preview.innerHTML=team?`${badge(team.name)}<span><strong>${e(team.name)}</strong><small>${e(team.country)} · escudo incluido</small></span>`:input.value.trim()?`${icon('shield')}<span>Equipo personalizado · puedes añadir su escudo en Mi carrera.</span>`:'';};
    const hide=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
    const paint=()=>{list.innerHTML=results.length?results.map((team,i)=>`<button type="button" role="option" class="team-option ${i===active?'active':''}" id="${list.id}-${i}" aria-selected="${i===active}" data-index="${i}">${badge(team.name)}<span><strong>${e(team.name)}</strong><small>${e(team.country)}</small></span>${icon('check')}</button>`).join(''):'<div class="team-picker-empty">Sin coincidencias. Puedes usar el nombre escrito y añadir su escudo después.</div>';if(active>=0)input.setAttribute('aria-activedescendant',list.id+'-'+active);else input.removeAttribute('aria-activedescendant');};
    const show=()=>{results=suggestTeams(input.value,customNames);active=results.length?0:-1;list.hidden=false;input.setAttribute('aria-expanded','true');paint();};
    const choose=i=>{const team=results[i];if(!team)return;input.value=team.name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));hide();showPreview();input.focus();};
    input.addEventListener('input',()=>{showPreview();show();});
    toggle.addEventListener('click',()=>{const wasHidden=list.hidden;input.focus();if(wasHidden)show();else hide();});
    input.addEventListener('keydown',ev=>{
      if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ev.preventDefault();if(list.hidden)show();else if(results.length){active=(active+(ev.key==='ArrowDown'?1:-1)+results.length)%results.length;paint();list.querySelector('.active')?.scrollIntoView?.({block:'nearest'});}}
      else if(ev.key==='Enter'&&!list.hidden&&active>=0){ev.preventDefault();choose(active);}
      else if(ev.key==='Escape'&&!list.hidden){ev.preventDefault();ev.stopPropagation();hide();}
      else if(ev.key==='Tab')hide();
    });
    list.addEventListener('mousedown',ev=>ev.preventDefault());
    list.addEventListener('click',ev=>{const option=ev.target.closest('[data-index]');if(option)choose(Number(option.dataset.index));});
    picker.addEventListener('focusout',()=>setTimeout(()=>{if(!picker.contains(document.activeElement))hide();},0));
    showPreview();
  }
}
