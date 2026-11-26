import {chromium} from 'playwright-core';import assert from 'node:assert/strict';import {writeFile,mkdir} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4175/';await mkdir('proof',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const report=[];
try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:width===390?'reduce':'no-preference'});
 page.setDefaultTimeout(6500);const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Shader'))errors.push(m.text())});
 await page.goto(base);await page.getByRole('button',{name:'Explore in 3D'}).click();await page.waitForSelector('canvas');await page.screenshot({path:'proof/hall-'+width+'.png'});const cold=requests.length;
 assert(!requests.some(u=>u.endsWith('.wasm')));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.reload();await page.getByRole('button',{name:'Explore in 3D'}).click();await page.waitForSelector('canvas');const warm=requests.length-cold;
 await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await page.evaluate(async()=> (await window.axe.run()).violations.map(v=>v.id));assert.deepEqual(axe,[]);
 // Hit the rendered geometry with real input. Probe the lower machines before distant bays.
 const rect=await page.locator('canvas').boundingBox();let hit;
 for(const [x,y] of [[.23,.53],[.62,.55],[.48,.61],[.34,.52],[.72,.46],[.55,.52],[.24,.66],[.33,.62],[.39,.48],[.17,.6]]){
  if(width===390)await page.touchscreen.tap(rect.x+x*rect.width,rect.y+y*rect.height);else await page.mouse.click(rect.x+x*rect.width,rect.y+y*rect.height);
  if(await page.locator('#inspection').isVisible()){hit=await page.locator('#station').innerText();break}
 }assert(hit,'No geometry selected');
 const visit=async id=>{await page.locator('[data-id="'+id+'"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(id=>document.activeElement?.id==='station'&&location.hash==='#'+id,id)};
 const click=label=>page.getByRole('button',{name:label,exact:true}).click(),output=()=>page.locator('#experiment pre').innerText();
 await click('← Return to hall');await visit('review');await click('Submit claim');assert.match(await output(),/Claim accepted/);await click('Submit claim');assert.match(await output(),/Duplicate claim refused/);await page.screenshot({path:'proof/review-'+width+'.png'});
 await click('Reset scenario');await page.getByLabel('Requested revision').selectOption('18');await click('Submit claim');assert.match(await output(),/Revision mismatch/);
 await page.getByLabel('Requested revision').selectOption('17');await page.getByLabel('Scenario clock').selectOption('10');await click('Submit claim');assert.match(await output(),/expired/);await page.getByLabel('Human approval').selectOption('Withheld');await click('Submit claim');assert.match(await output(),/Human approval required/);
 await visit('memory');await click('Query SQLite');await page.waitForSelector('#experiment li a');assert.equal(await page.locator('#experiment li').count(),3);await page.screenshot({path:'proof/memory-'+width+'.png'});
 await visit('rcc');await click('Assemble environment');assert.match(await output(),/Assembled synthetic/);await click('Assemble environment');assert.match(await output(),/Reused/);await page.screenshot({path:'proof/rcc-'+width+'.png'});
 await page.getByLabel('Synthetic dependency manifest').fill('bad');await click('Assemble environment');assert.match(await output(),/unique/);
 await visit('actions');await click('Dispatch sample');await click('Simulate crash');await page.reload();await click('Recover artifact');assert.match(await output(),/"sum": 37/);
 await visit('room');await click('runtime.json');await page.getByLabel('Snapshot').selectOption('rev-01');assert.match(await output(),/3.11/);
 await visit('transport');await click('Verify and reconstruct');assert.match(await output(),/"verified": true/);await page.getByLabel('Transfer').selectOption('Corrupt final byte');await click('Verify and reconstruct');assert.match(await output(),/"verified": false/);
 assert.deepEqual(errors,[]);report.push({width,coldRequests:cold,warmReloadRequests:warm,geometryHit:hit,axe,errors});await page.close()
}
const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto(base);for(const a of await plain.locator('a[href^="stations/"]').evaluateAll(links=>[...new Set(links.map(a=>a.href))])){await plain.goto(a);assert(await plain.locator('h1').isVisible());assert(await plain.getByText('Public evidence',{exact:true}).isVisible())}
await plain.goto(base+'infrastructure/');
const catalog=await plain.locator('article h2 a').evaluateAll(links=>links.map(a=>a.href));
assert.equal(catalog.length,8);
await plain.setViewportSize({width:390,height:844});
for(const url of catalog){
 const response=await plain.goto(url);assert.equal(response.status(),200);
 assert(await plain.getByRole('heading',{name:'Project status'}).isVisible());
 assert(await plain.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
}
await plain.goto(base+'infrastructure/devsy-provider-harvester.html');
assert(await plain.getByRole('link',{name:'Official attribution'}).isVisible());
await plain.goto(base+'resume.html');assert.equal(await plain.locator('article').count(),5);
const fail=await browser.newPage();await fail.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null});await fail.route('**/*.wasm',r=>r.abort());await fail.goto(base+'#review');await fail.getByText(/Experiment unavailable/).waitFor();await fail.locator('[data-id=memory]').click();await fail.getByRole('button',{name:'Query SQLite'}).click();await fail.getByText(/Unable to complete/).waitFor();
await writeFile('proof/checks.json',JSON.stringify(report,null,2));console.log(report)
}finally{await browser.close()}
