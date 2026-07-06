const SHELL_VERSION='v88-self-unregister';
async function cleanup(){try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.toLowerCase().includes('gringotts')).map(k=>caches.delete(k)));}catch(e){}try{await self.registration.unregister();}catch(e){}}
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(cleanup());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{await cleanup();const clientsList=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clientsList){try{client.postMessage({type:'GRINGOTTS_SW_UNREGISTERED',version:SHELL_VERSION});}catch(e){}}})());});
self.addEventListener('fetch',event=>{});
