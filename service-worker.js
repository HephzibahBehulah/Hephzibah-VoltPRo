const CACHE="voltpro-v59";
const PREFIX="voltpro-";
const ASSETS=["./","./index.html","./styles.css","./cyber-theme.css","./script.js","./academy-content-expansion.js","./academy-question-bank.js","./simulator.html","./breadboard.html","./device-image-credits.html","./simulator.css","./voltpro-hb-theme.css","./simulator-layout-restore.css","./simulator.js","./src/ui/ai-circuit-planner.js","./src/ui/ai-circuit-designer.js","./src/ui/ai-circuit-designer.css","./src/ui/realistic-devices.js","./src/ui/realistic-devices.css","./src/ui/project-workspace.js","./src/ui/project-workspace.css","./src/ui/project-workspace.css","./engineering.html","./engineering.css","./engineering.js","./academy-workbench.html","./academy-workbench.css","./academy-workbench.js","./data/electrical-tool-index.json","./engine/voltpro-engine.js","./src/core/terminal-graph.js","./src/rendering/symbols.js","./src/rendering/device-face.js","./platform/v5-runtime.js","./platform/project-format.js","./platform/challenge-engine.js","./platform/tutorial-engine.js","./platform/fault-engine.js","./platform/digital-engine.js","./platform/mcu-engine.js","./platform/ladder-engine.js","./platform/engineering.js","./platform/bom.js","./platform/plugin-loader.js","./platform/panel.js","./platform/component-info.js","./platform/documentation.js","./platform/workbench.js","./platform/component-media.js","./platform/component-registry.js","./platform/ui.js","./components/index.json","./components/protection/index.json","./components/switching/index.json","./components/contactors/index.json","./components/relays/index.json","./components/motors/index.json","./components/transformers/index.json","./components/sensors/index.json","./components/lighting/index.json","./components/measurement/index.json","./components/semiconductor/index.json","./components/electronics/index.json","./components/plc/index.json","./components/automation/index.json","./components/renewable/index.json","./components/knx/index.json","./components/industrial/index.json","./components/communication/index.json","./components/wires/index.json","./components/power/index.json","./components/grounding/index.json","./components/panel/index.json","./components/microcontroller/index.json","./components/loads/index.json","./components/logic/index.json","./data/component-models.v4.json","./data/component-schema.v4.json","./data/challenges.json","./data/tutorials.json","./data/faults.json","./SIMULATOR.md","./PWA.md","./icons/voltpro-192.svg","./icons/voltpro-512.svg"];
self.addEventListener("install",event=>event.waitUntil((async()=>{
  // Install only the small application shell. Cache other assets on first use
  // so dozens of background requests cannot stall the simulator startup.
  const cache=await caches.open(CACHE);
  await Promise.allSettled(["./","./index.html","./simulator.html","./breadboard.html","./simulator.css","./cyber-theme.css","./voltpro-hb-theme.css","./simulator-layout-restore.css","./simulator.js","./academy-workbench.html","./academy-workbench.css","./academy-workbench.js","./data/electrical-tool-index.json","./engine/voltpro-engine.js"].map(async asset=>{
    const response=await fetch(asset,{cache:"reload"});
    if(response.ok) await cache.put(asset,response);
  }));
  await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  const freshFirst=request.mode==="navigate"||["style","script"].includes(request.destination);
  if(freshFirst){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{});}
        return response;
      }catch(error){
        return (await caches.match(request,{ignoreSearch:true}))|| (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{});}
      return response;
    }catch(error){return (await caches.match(request,{ignoreSearch:true}))||Response.error();}
  })());
});