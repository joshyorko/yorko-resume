let pending;
function session(){return pending??=import('./demo.mjs').then(m=>m.createDemo()).catch(e=>{pending=null;throw e})}
export function panel(id,host){
 const section=document.createElement('section');section.className='portable';
 const actions=id==='actions';
 section.innerHTML=actions?`<h3>Inspect a manifest</h3><p>Run the bounded 96-byte WASM kernel against the Actions Core tool schema. The native comparison covers 15 inputs.</p><label>Root memories <input type="number" min="0" max="4294967295" value="1"></label><button>Check manifest</button> <button>View native schema</button><p><a href="https://github.com/joshyorko/actions/tree/7efb58eb1d28dc9ad66c46591f6d1710b6c84f0d">Actions Core source ↗</a></p>`:`<h3>Inspect a native MemoryD bundle</h3><p>Inspect one pinned synthetic fixture from native MemoryD 0.1.0. Its digest verifies integrity. Authorship is unverified. The session supports neither general imports nor recall.</p><button>Inspect sample bundle</button> <button disabled>Export session receipt</button><p><a href="https://github.com/joshyorko/codex-memoryd/tree/79a279d5f730162ad34be9b6410e666ba878a05c">MemoryD source ↗</a></p>`;
 const out=document.createElement('output');section.append(out);host.append(section);
 const [go,save,reset]=section.querySelectorAll('button');
 function report(value){out.textContent=JSON.stringify(value,null,2);dispatchEvent(new CustomEvent('machine-receipt',{detail:id+' · '+out.textContent.slice(0,240)}))}
 go.onclick=async()=>{go.disabled=true;try{const s=await session();if(actions){const input=section.querySelector('input');if(!input.value||!input.validity.valid)throw Error('Enter an unsigned integer.');report(s.runManifest({format_version:1,descriptor_count:5,root_memories:input.valueAsNumber,dependency_objects:0}))}else{report(await s.inspectFixture());save.disabled=false}}catch(e){out.textContent=e.message}finally{go.disabled=false}};
 if(actions){save.onclick=async()=>{try{report((await session()).manifestSchema)}catch(e){out.textContent=e.message}}}
 else{save.onclick=async()=>{const {downloadChronology}=await import('./demo.mjs');downloadChronology(await session())}}
}
