const utf=new TextEncoder();
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const cache=new Set();let database;
const el=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
export async function inspect(id,host,profile){
 const out=el('pre',''), controls=el('div','');controls.className='controls';out.setAttribute('aria-live','polite');host.replaceChildren(controls,out);
 const show=data=>out.textContent=typeof data==='string'?data:JSON.stringify(data,null,2);
 function button(label,run){const b=el('button',label);controls.append(b);b.onclick=async()=>{b.disabled=true;try{await run()}catch(e){show('Unable to complete this experiment. '+e.message)}finally{b.disabled=false}};return b}
 function field(label,tag,value){const l=el('label',label),i=el(tag,'');l.append(i);controls.append(l);i.value=value;return i}
 function select(label,options){const i=field(label,'select','');for(const v of options)i.append(new Option(v,v));return i}
 if(id==='review'){
  const bytes=await fetch(new URL('policy.wasm',import.meta.url));const {instance}=await WebAssembly.instantiate(await bytes.arrayBuffer());let claimed=false;
  const approval=select('Human approval',['Approved','Withheld']),rev=select('Requested revision',['17','18']),clock=select('Scenario clock',['4','10']);const reasons=['Claim accepted','Human approval required','Revision mismatch','Approval expired','Duplicate claim refused'];
  const run=()=>{const code=instance.exports.decide(+(approval.value==='Approved'),+rev.value,17,+clock.value,10,+claimed);if(!code)claimed=true;show({decision:reasons[code],engine:'WebAssembly',requestedRevision:+rev.value,approvedRevision:17,now:+clock.value,expires:10,claimed})};
  button('Submit claim',run);button('Reset scenario',()=>{claimed=false;show('Ready for a new claim.')});show('Teaching policy · approval binds revision 17 until tick 10. Each admitted claim can execute once.');
 }else if(id==='rcc'){
  const manifest=field('Synthetic dependency manifest','textarea','python=3.12\nyaml=6.0');manifest.rows=3;
  button('Assemble environment',async()=>{const deps=manifest.value.trim().split(/\s+/).sort();if(!deps.every(d=>/^[a-z][a-z0-9-]*=\d+(\.\d+)*$/.test(d))||new Set(deps.map(d=>d.split('=')[0])).size!==deps.length)throw Error('Use one unique name=version per dependency.');
  const digest=await hash(utf.encode(JSON.stringify(deps)));show({manifest:deps,sha256:digest,assembly:cache.has(digest)?'Reused in-session assembly':'Assembled synthetic environment'});cache.add(digest)});show('Teaching model · sorted dependency pins determine the identity. No packages are installed.');
 }else if(id==='memory'){
  const search=field('Search public records','input','revision');const results=el('ul','');host.append(results);
  button('Query SQLite',async()=>{if(!database){if(typeof WebAssembly==='undefined')throw Error('WebAssembly unavailable');await new Promise((ok,fail)=>{if(window.initSqlJs)return ok();const s=document.createElement('script');s.src=new URL('sql-wasm.js',import.meta.url);s.onload=ok;s.onerror=()=>fail(Error('SQLite loader unavailable'));document.head.append(s)});
  const bytes=await fetch(new URL('sql-wasm.wasm',import.meta.url));if(!bytes.ok)throw Error('SQLite unavailable');const SQL=await window.initSqlJs({wasmBinary:await bytes.arrayBuffer()});database=new SQL.Database();database.run('CREATE TABLE evidence(project, claim, source, url)');for(const p of profile.stations)for(const e of p.evidence)database.run('INSERT INTO evidence VALUES (?,?,?,?)',[p.name,p.claim,e.label,e.url])}
  const sql='SELECT project, source, url FROM evidence WHERE instr(lower(project || claim || source), lower(?)) > 0 ORDER BY source';
  const rows=database.exec(sql,[search.value])[0]?.values||[];results.replaceChildren();for(const [name,label,url] of rows){const li=el('li',''),a=el('a',name+' · '+label);a.href=url;li.append(a);results.append(li)}show({engine:'SQLite / WebAssembly',sql,parameters:[search.value],rows:rows.length})});show('Search a curated public dataset. Results link directly to their source.');
 }else if(id==='actions'){
  const key='machine-room:demo-job:v1';let job=JSON.parse(localStorage.getItem(key)||'null');
  const save=(state)=>{job=state;localStorage.setItem(key,JSON.stringify(job));show(job)};
  button('Dispatch sample',()=>save({worker:'synthetic-01',state:'dispatched',input:[7,11,19]}));
  button('Simulate crash',()=>{if(job?.state!=='dispatched')throw Error('Dispatch first.');save({...job,state:'interrupted'})});
  button('Recover artifact',()=>{if(!['interrupted','complete'].includes(job?.state))throw Error('Interrupt a dispatched job first.');save({...job,state:'complete',artifact:{sum:job.input.reduce((a,b)=>a+b,0),count:job.input.length}})});show(job||'Synthetic worker · the receipt survives reload in this browser.');
 }else if(id==='room'){
  const rev=select('Snapshot',['rev-02','rev-01']),files={'src/entry.py':['print("hello")','print("restored")'],'config/runtime.json':['{"python":"3.11"}','{"python":"3.12"}'],'README.md':['Sample workspace','Sample workspace, second capture']};
  const tree=el('div','');tree.className='tree';controls.append(tree);let current='src/entry.py';
  function read(){show({snapshot:rev.value,path:current,content:files[current][+(rev.value==='rev-02')],history:['rev-01 · first capture','rev-02 · runtime update']})}
  for(const [folder,path] of [['src','src/entry.py'],['config','config/runtime.json'],['workspace','README.md']]){const details=el('details',''),label=el('summary',folder+'/'),b=el('button',path.split('/').pop());details.append(label,b);tree.append(details);details.open=true;b.onclick=()=>{current=path;read()}}rev.onchange=read;read();
 }else{
  const layers=['workspace/README.md\nPortable fixture','env/runtime.json\n{"python":"3.12"}'];const config=utf.encode(JSON.stringify({architecture:'none',os:'fixture'}));const manifest={config:{mediaType:'application/vnd.machine-room.config.v1+json',size:config.length,digest:'sha256:'+await hash(config)},schemaVersion:2,mediaType:'application/vnd.oci.image.manifest.v1+json',layers:await Promise.all(layers.map(async s=>({mediaType:'application/vnd.machine-room.fixture.v1',size:utf.encode(s).length,digest:'sha256:'+await hash(utf.encode(s))})))};
  const mode=select('Transfer',['Intact layers','Corrupt final byte']);button('Verify and reconstruct',async()=>{const payload=layers.map(s=>utf.encode(s));if(mode.selectedIndex)payload[1][payload[1].length-1]^=1;
  const received=await Promise.all(payload.map(async b=>'sha256:'+await hash(b)));const valid=received.every((s,i)=>s===manifest.layers[i].digest);show({verified:valid,received,reconstructed:valid?Object.fromEntries(payload.map(b=>new TextDecoder().decode(b).split('\n'))):null})});show(manifest);
 }
}
