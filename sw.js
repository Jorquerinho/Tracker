// Increment VERSION when publishing changes to application files or the crest catalogue.
const VERSION='1.2.0';
const PREFIX='fc-tracker:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+VERSION;
const base=self.registration.scope;
const SHELL=['./','index.html','src/app.js','src/ui.js','src/domain.js','src/style.css','src/images.js','src/teams.js','src/teams-data.js','src/team-picker.js','escudos/catalogo.json','manifest.webmanifest','assets/icon.svg','assets/icon-192.png','assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(path=>new URL(path,base).href)))));
async function prepareCrests(){
  try{
    const cache=await caches.open(CACHE),manifest=await cache.match(new URL('escudos/catalogo.json',base).href);
    if(!manifest)return;
    const teams=await manifest.json(),queue=teams.map(t=>t.crest).filter(path=>/^escudos\/[a-z0-9-]+\.png$/.test(path));
    let saved=0;
    const runner=async()=>{while(queue.length){const url=new URL(queue.shift(),base).href;try{if(!await cache.match(url)){const response=await fetch(url);if(!response.ok)continue;await cache.put(url,response);}saved++;}catch{}}};
    await Promise.all(Array.from({length:6},runner));
    if(saved===teams.length){const clients=await self.clients.matchAll();clients.forEach(client=>client.postMessage({type:'crests-ready',total:saved}));}
  }catch{/* The application remains usable if the crest cache cannot be completed. */}
}
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));await self.clients.claim();await prepareCrests();})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(base))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>await caches.match(new URL('index.html',base).href)));return;}
  event.respondWith((async()=>{
    const cached=await caches.match(request);if(cached)return cached;
    const response=await fetch(request);
    if(response.ok&&(url.pathname.includes('/escudos/')||SHELL.some(path=>new URL(path,base).pathname===url.pathname))){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));}
    return response;
  })());
});
