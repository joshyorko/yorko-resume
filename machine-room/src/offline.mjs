const $=id=>document.getElementById(id);
const version=document.documentElement.dataset.build,receipts=[];
const workerURL=new URL('sw-'+version+'.js',document.baseURI);
function refresh(){
 const entries=performance.getEntriesByType('resource');
 const last=entries.at(-1);
 $('runtime').textContent=[
 'Browser connectivity hint: '+(navigator.onLine?'online':'offline'),
 'Offline controller: '+(navigator.serviceWorker?.controller?.scriptURL.split('/').pop()||'none on this page'),
 'Resources observed this navigation: '+entries.length,
 'Cross-origin resource entries: '+entries.filter(e=>new URL(e.name).origin!==location.origin).length,
 'Reported transferred bytes: '+entries.reduce((n,e)=>n+e.transferSize,0),
 last?'Last resource: '+new URL(last.name).pathname+' · '+last.duration.toFixed(1)+' ms':'',
 ...receipts
 ].filter(Boolean).join('\n');
}
addEventListener('machine-receipt',e=>{
 receipts.unshift(e.detail);receipts.splice(6);refresh()
});
for(const name of ['online','offline'])addEventListener(name,refresh);
$('inspect-runtime').ontoggle=refresh;$('refresh-runtime').onclick=refresh;
$('prepare').onclick=async()=>{
 const b=$('prepare'),message=$('offline-status');b.disabled=true;
 try{
  if(!navigator.serviceWorker||!globalThis.caches)throw Error('Offline storage is unavailable in this context.');
  message.textContent='Preparing and checking the files on this device…';
  const reg=await navigator.serviceWorker.register(workerURL,{scope:'./',updateViaCache:'none'});
  const target=[reg.installing,reg.waiting,reg.active].find(w=>w?.scriptURL===workerURL.href);
  if(!target)throw Error('A different build is installing. Reload while connected.');
  await new Promise((resolve,reject)=>{function check(){if(['installed','activated'].includes(target.state))resolve();else if(target.state==='redundant')reject(Error('Storage denied, quota exceeded, or the download changed. Reconnect and retry.'))}target.addEventListener('statechange',check);check()});
  const pair=new MessageChannel();
  const receipt=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Storage did not respond.')),30000);pair.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data)};target.postMessage('prepare',[pair.port2])});
  if(receipt.error)throw Error(receipt.error);
  message.textContent=receipt.count+' files ready. '+(reg.waiting?'Close all tabs for this preview, then reopen it.':'You can unplug the internet and reload this page.');
 }catch(e){message.textContent='Offline preparation failed. '+e.message}
 finally{b.disabled=false;refresh()}
};
