import {decide} from './decision.mjs';
const $=id=>document.getElementById(id),profile=await fetch('profile.json').then(r=>r.json());let scene,selected=null;
function navigate(id){location.hash=id||'directory'}
async function choose(id,move=true){
 const decision=decide({kind:"choice",candidates:[id]},profile.stations);const station=decision.selected && profile.stations.find(s=>s.id===decision.selected.id);selected=station?.id||null;scene?.focus(selected);
 $('inspection').hidden=!station;$('back').hidden=!station;$('plate').textContent=station?station.installation:'Assembly hall';
 document.querySelectorAll('[data-id]').forEach(a=>a.toggleAttribute('aria-current',a.dataset.id===id));
 if(!station)return;
 $('role').textContent=station.name+' / '+station.role;$('station').textContent=station.installation;$('claim').textContent=station.claim;$('record').href='stations/'+id+'.html';$('scenario').textContent=station.scenario;
 const slot=document.createElement('div');$('experiment').replaceChildren(slot);if(move)$('station').focus({preventScroll:true});
 try{const {inspect}=await import('./experiments.mjs');await inspect(id,slot,profile)}catch{slot.textContent='Experiment unavailable in this browser. The project record and evidence are available.'}
}
document.querySelectorAll('[data-id]').forEach(a=>a.onclick=e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();navigate(a.dataset.id)});
$('back').onclick=()=>{document.querySelector('[data-id="'+selected+'"]')?.focus({preventScroll:true});navigate('')};
window.addEventListener('hashchange',()=>choose(location.hash.slice(1)));choose(location.hash.slice(1),false);
const enter=$('enter-scene');enter.hidden=false;enter.onclick=async()=>{enter.hidden=true;try{const {mountScene}=await import('./scene.mjs');scene=mountScene($('scene'),navigate);if(selected)scene.focus(selected,true)}catch{$('plate').textContent='Assembly hall · use the installation index'}
};
