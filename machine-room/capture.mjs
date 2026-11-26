import {chromium} from 'playwright-core';import {writeFile} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4175/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:900}});await page.goto(base);await page.getByRole('button',{name:'Explore in 3D'}).click();const canvas=page.locator('canvas');await canvas.waitFor();const mask=await page.addStyleTag({content:'.identity,.legend{visibility:hidden}'});await canvas.screenshot({path:'src/hall-'+width+'.jpg',quality:86});await mask.evaluate(node=>node.remove());if(width===390)continue;
 const result=await page.evaluate(async()=>{
 const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
 const canvasStream=canvas.captureStream(30),rec=new MediaRecorder(canvasStream,{mimeType:'video/webm;codecs=vp8'});const chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const saved=new Promise(ok=>rec.onstop=async()=>ok(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))));rec.start();
 const dt=[],start=performance.now();let last=start;document.querySelector('[data-id=review]').click();
 await new Promise(ok=>{function sample(t){if(t>last)dt.push(t-last);last=t;if(t-start<1000)requestAnimationFrame(sample);else ok()}requestAnimationFrame(sample)});rec.stop();return {dt,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',bytes:await saved}
 });await writeFile('proof/transition.webm',Buffer.from(result.bytes));const intervals=result.dt.slice(1).sort((a,b)=>a-b);await writeFile('proof/frame-sample.json',JSON.stringify({method:'Wall-clock requestAnimationFrame intervals during one desktop camera transition while capturing canvas to VP8. Includes scheduling and recorder overhead.',renderer:result.renderer,intervalsMs:intervals,medianMs:intervals[Math.floor(intervals.length/2)],p95Ms:intervals[Math.floor(intervals.length*.95)]},null,2));
 }
}finally{await browser.close()}
