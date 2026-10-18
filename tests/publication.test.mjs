import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
test('Todos los recursos HTML y módulos existen y usan rutas relativas',async()=>{
  const html=await readFile(new URL('index.html',root),'utf8');
  const resources=[...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(m=>m[1]);
  for(const file of resources)assert.ok((await stat(new URL(file,root))).size>0,file);
  assert.ok(!/(?:src|href)="\//.test(html));
  for(const file of ['src/app.js','src/ui.js','src/images.js','src/domain.js']){
    const url=new URL(file,root),text=await readFile(url,'utf8');
    for(const m of text.matchAll(/from\s*['"](\.\.?\/[^'"]+)['"]/g))await stat(new URL(m[1],url));
  }
});
test('Manifest conserva rutas relativas y los dos iconos existen',async()=>{
  const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
  assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons){const bytes=await readFile(new URL(icon.src,root));assert.equal(bytes.subarray(1,4).toString(),'PNG');}
});
test('Service worker instala los recursos correctos en un repositorio con subruta',async()=>{
  const listeners={};let installed=[];let deleted=[];let claimed=false;
  const origin='https://ejemplo.github.io',scope=origin+'/nombre-personalizado/';
  const context={URL,self:{registration:{scope},location:{origin},addEventListener:(name,handler)=>listeners[name]=handler,clients:{claim:async()=>{claimed=true;}}},caches:{open:async()=>({addAll:async urls=>{installed=urls;}}),keys:async()=>['fc-tracker:/nombre-personalizado/:0.9.0','fc-tracker:/otro/:1.0.0'],delete:async name=>deleted.push(name)}};
  vm.runInNewContext(await readFile(new URL('sw.js',root),'utf8'),context);
  let pending;listeners.install({waitUntil:p=>pending=p});await pending;
  assert.ok(installed.length>=10);assert.ok(installed.every(url=>url.startsWith(scope)));
  for(const url of installed){const path=new URL(url).pathname.slice('/nombre-personalizado/'.length)||'index.html';await stat(new URL(path,root));}
  listeners.activate({waitUntil:p=>pending=p});await pending;
  assert.deepEqual(deleted,['fc-tracker:/nombre-personalizado/:0.9.0']);assert.equal(claimed,true);
});
test('Service worker recupera la página de entrada cuando no hay conexión',async()=>{
  const listeners={};const offlineResponse={ok:true,body:'cached index'};let requested='';
  const context={URL,fetch:async()=>{throw Error('offline');},self:{registration:{scope:'https://ejemplo.github.io/app/'},location:{origin:'https://ejemplo.github.io'},addEventListener:(name,handler)=>listeners[name]=handler},caches:{match:async url=>{requested=url;return offlineResponse;}}};
  vm.runInNewContext(await readFile(new URL('sw.js',root),'utf8'),context);
  let response;listeners.fetch({request:{method:'GET',url:'https://ejemplo.github.io/app/',mode:'navigate'},respondWith:p=>response=p});
  assert.equal(await response,offlineResponse);assert.equal(requested,'https://ejemplo.github.io/app/index.html');
});
test('Service worker prepara los escudos desde el catálogo local y confirma al terminar',async()=>{
  const base='https://ejemplo.github.io/mi-repo/',listeners={},fetched=[],messages=[],store=new Map();
  store.set(base+'escudos/catalogo.json',{json:async()=>[{crest:'escudos/paris-saint-germain.png'},{crest:'escudos/manchester-city.png'}]});
  const cache={match:async key=>store.get(key),put:async(key,value)=>store.set(key,value)};
  let claimed=false;
  const context={URL,fetch:async url=>{fetched.push(url);return {ok:true,kind:'png'};},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},self:{registration:{scope:base},location:{origin:'https://ejemplo.github.io'},addEventListener:(event,fn)=>listeners[event]=fn,clients:{claim:async()=>{claimed=true;},matchAll:async()=>[{postMessage:message=>messages.push(message)}]}}};
  vm.runInNewContext(await readFile(new URL('sw.js',root),'utf8'),context);
  let pending;listeners.activate({waitUntil:p=>pending=p});await pending;
  assert.equal(claimed,true);assert.deepEqual(fetched,[base+'escudos/paris-saint-germain.png',base+'escudos/manchester-city.png']);assert.equal(messages[0].type,'crests-ready');assert.equal(messages[0].total,2);
});
