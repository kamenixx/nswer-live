const CACHE='nswer-live-v1237-ocean-shell';
const SHELL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const urlFor=path=>new URL(path,self.location.href).href;
async function fetchShell(path){
 const url=urlFor(path);const response=await fetch(url,{cache:'reload',credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.url!==url)throw new Error('Invalid shell response: '+path);
 const type=(response.headers.get('content-type')||'').toLowerCase();
 if(path==='./'){if(!type.includes('text/html')||!(await response.clone().text()).includes('<meta name="nswer-shell-build" content="v1237-ocean">'))throw new Error('Unexpected HTML');}
 else if(path.endsWith('.webmanifest')){const manifest=await response.clone().json();if(manifest.name!=='NSWER LIVE'||manifest.start_url!=='./')throw new Error('Invalid manifest');}
 else {const bytes=new Uint8Array(await response.clone().arrayBuffer());if(!type.includes('image/png')||bytes.length<8||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))throw new Error('Invalid PNG');}
 return [url,response];
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try{const assets=await Promise.all(SHELL.map(fetchShell));const cache=await caches.open(CACHE);await Promise.all(assets.map(([url,response])=>cache.put(url,response)));}
 catch(error){await caches.delete(CACHE);throw error;}
})()));
// Do not skip waiting: an active concert session must not be interrupted by an update.
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()){if(/^nswer-live-v[0-9]+(?:-s[0-9]+|-shellfix|-ocean)?-shell$/.test(key)&&key!==CACHE)await caches.delete(key)}await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET')return;
 if(url.origin!==self.location.origin)return;
 const isAppNavigation=req.mode==='navigate'&&(url.pathname===new URL('./',self.location.href).pathname||url.pathname===new URL('./index.html',self.location.href).pathname);
 const asset=SHELL.find(path=>urlFor(path)===url.href);if(!isAppNavigation&&!asset)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(isAppNavigation?urlFor('./'):urlFor(asset));if(hit)return hit;return fetch(req);})());
});
