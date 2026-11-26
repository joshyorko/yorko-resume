import {chromium} from 'playwright-core';import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';import {decide} from './src/decision.mjs';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4198/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const reports=[];
try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
  const requests=[];ctx.on('request',r=>requests.push(r.url()));
  const p=await ctx.newPage();await p.goto(base);const cold=requests.length;
  assert(!requests.some(u=>u.endsWith('.wasm')||u.endsWith('/three.js')));assert.equal(await p.evaluate(()=>caches.keys().then(x=>x.length)),0);
  await p.getByRole('button',{name:'Prepare offline'}).click();await p.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('files ready'));
  await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await ctx.setOffline(true);await p.reload();assert(await p.evaluate(()=>!!navigator.serviceWorker.controller));
  const cached=await p.evaluate(async()=>{const names=await caches.keys();return (await (await caches.open(names[0])).keys()).length});
  await p.locator('[data-id=memory]').click();await p.getByRole('button',{name:'Query SQLite'}).click();await p.waitForSelector('#experiment li a');assert.equal(await p.locator('#experiment li').count(),3);
  await p.getByRole('button',{name:'Inspect sample bundle'}).click();await p.waitForFunction(()=>document.querySelector('.portable output')?.textContent.includes('authenticity'));
  const download=p.waitForEvent('download');await p.getByRole('button',{name:'Export session receipt'}).click();const receipt=JSON.parse(await (await import('node:fs/promises')).readFile(await (await download).path(),'utf8'));assert.equal(receipt.kind,'machine-room-browser-session.v1');assert.equal(receipt.activity[0].receipt.provenance.integrity_status,'verified');
  await p.locator('[data-id=actions]').click();await p.getByRole('button',{name:'Check manifest'}).click();await p.waitForFunction(()=>document.querySelector('.portable output')?.textContent.includes('elapsed_ms'));
  const first=JSON.parse(await p.locator('.portable output').innerText());assert.equal(first.output,true);await p.getByLabel('Root memories').fill('5001');await p.getByRole('button',{name:'Check manifest'}).click();assert.equal(JSON.parse(await p.locator('.portable output').innerText()).output,false);
  await p.getByRole('button',{name:'View native schema'}).click();await p.waitForFunction(()=>document.querySelector('.portable output')?.textContent.includes('descriptor_count'));
  await p.locator('[data-id=review]').click();await p.getByRole('button',{name:'Submit claim'}).click();assert.match(await p.locator('#experiment pre').innerText(),/Claim accepted/);
  await p.locator('#inspect-runtime summary').click();assert.match(await p.locator('#runtime').innerText(),/WebAssembly/);
  await p.getByRole('button',{name:'Explore in 3D'}).click();await p.locator('canvas').waitFor();
  await p.goto(base+'infrastructure/devsy-provider-harvester.html');assert(await p.getByText('Official attribution',{exact:false}).first().isVisible());
  assert(requests.every(u=>new URL(u).origin===new URL(base).origin));reports.push({width,coldRequests:cold,verifiedCacheEntries:cached,offlineSQLiteRows:3,portableActionMs:first.activity.elapsed_ms,sessionExport:receipt.kind,offlinePolicy:'accepted',offlineWebGL:true,externalRequests:0});
  await ctx.setOffline(false);await p.evaluate(async()=>{for(const key of await caches.keys())await caches.delete(key)});await p.goto(base);await p.getByRole('button',{name:'Prepare offline'}).click();await p.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('files ready'));await ctx.close()
 }
 const failed=await browser.newContext();await failed.addInitScript(()=>Object.defineProperty(navigator.serviceWorker,'register',{value:async()=>{throw new DOMException('Storage denied','SecurityError')}}));const page=await failed.newPage();await page.goto(base);await page.locator('#prepare').click();await page.getByText(/Offline preparation failed.*Storage denied/).waitFor();
 for(const [kind,field] of [['predicate','result'],['choice','selected'],['score','score'],['abstain','reason']])assert(field in decide({kind,candidates:['tool']},[{id:'tool',evidence:[{label:'Source',url:'https://example.com'}]}]));
 await writeFile('proof/offline.json',JSON.stringify(reports,null,2));console.log(reports)
}finally{await browser.close()}
