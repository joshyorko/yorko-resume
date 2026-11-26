import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const digest=data=>createHash('sha256').update(data).digest('hex');
export async function buildOffline(){
 const entries={};
 for(const file of (await readdir('dist',{recursive:true,withFileTypes:true})).filter(f=>f.isFile())){
  const path=file.parentPath.replace(/^dist\/?/,'');const key=(path?path+'/':'')+file.name;
  if(key==='_headers'||/^sw-[0-9a-f]+\.js$/.test(key))continue;
  entries[key]=digest(await readFile('dist/'+key));
 }
 const worker=await readFile('worker.template.js','utf8');
 const version=digest(worker+JSON.stringify(Object.entries(entries).sort())).slice(0,20);
 const html=(await readFile('dist/index.html','utf8')).replace('OFFLINE_BUILD',version);
 await writeFile('dist/index.html',html);entries['index.html']=digest(html);
 await writeFile('dist/sw-'+version+'.js',worker.replace('__VERSION__',version).replace('__ENTRIES__',JSON.stringify(entries)));
}
