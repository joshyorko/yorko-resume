import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
const [url,label]=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{await mkdir('proof/'+label,{recursive:true});for(const [width,height] of [[390,844],[360,800],[411,914],[1440,900],[844,390]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<1000});
 await p.goto(url);await p.screenshot({path:'proof/'+label+'/'+width+'.png'});
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow at '+width);
 await p.close()
}}finally{await b.close()}
