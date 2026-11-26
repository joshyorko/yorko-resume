const version='__VERSION__', files=__ENTRIES__;
const scope=self.registration.scope;
const prefix='machine-room:'+scope+':', key=prefix+version;
const absolute=name=>new URL(name,scope).href;
async function prepare(){
 const cache=await caches.open(key);
 for(const [name,expected] of Object.entries(files)){
  const url=absolute(name);
  if(await cache.match(url))continue;
  const response=await fetch(url,{cache:'reload',redirect:'follow'});
  if(!response.ok||new URL(response.url).origin!==self.location.origin)throw Error('Unavailable: '+name);
  const bytes=await response.clone().arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==expected)throw Error('Build changed: '+name);
  const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.delete('Content-Length');
  await cache.put(url,new Response(bytes,{headers}));
 }
 return Object.keys(files).length;
}
self.addEventListener('install',event=>event.waitUntil(prepare()));
// Normal activation waits until clients using an older worker have closed.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const old of await caches.keys())if(old.startsWith(prefix)&&old!==key)await caches.delete(old);
})()));
self.addEventListener('message',event=>{
 if(event.data!=='prepare')return;
 event.waitUntil(prepare().then(count=>event.ports[0].postMessage({version,count})).catch(e=>event.ports[0].postMessage({error:e.message})));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(scope))return;
 let name=url.pathname.slice(new URL(scope).pathname.length);
 if(name.endsWith('/')||!name)name+='index.html';
 if(!files[name]&&files[name+'.html'])name+='.html';
 if(!files[name])return;
 event.respondWith(caches.open(key).then(cache=>cache.match(absolute(name))).then(hit=>hit||recover(event.request,name)));
});

async function recover(request,name){
 try{
  const res=await fetch(request);
  const bytes=await res.clone().arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(res.ok && hash===files[name])return res;
 }catch{}
 return new Response('Offline copy missing or changed. Reconnect, clear site data and revisit to prepare the latest build.',{status:503});
}
