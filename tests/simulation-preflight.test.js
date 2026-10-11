const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const T=require("../src/core/terminal-graph.js");

function load(runtimeEnabled=true){
 const window={VoltProTerminalGraph:T,defs:{battery:{pins:2},resistor:{pins:2}}};
 const context={window,structuredClone,Map,Set,String,Number,Array,Boolean,Object,JSON,Date,Error,Math};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync("src/core/net-resolver.js","utf8"),context);
 if(runtimeEnabled)vm.runInContext(fs.readFileSync("platform/v5-runtime.js","utf8"),context);
 vm.runInContext(fs.readFileSync("src/core/simulation-preflight.js","utf8"),context);
 return window.VoltProSimulationPreflight;
}

test("preflight accepts a structurally valid connected circuit",()=>{
 const preflight=load();
 const result=preflight.validate({
  components:[
   {id:"V1",type:"battery",props:{voltage:12}},
   {id:"R1",type:"resistor",props:{resistance:1000}}
  ],
  wires:[{id:"W1",a:"V1:0",b:"R1:0"}]
 });
 assert.equal(result.available,true);
 assert.equal(result.valid,true,JSON.stringify(result.errors));
 assert.equal(result.errors.length,0);
});

test("preflight blocks a wire connected to a missing device",()=>{
 const preflight=load();
 const result=preflight.validate({
  components:[{id:"R1",type:"resistor",props:{resistance:1000}}],
  wires:[{id:"W_BAD",a:"R1:0",b:"MISSING:0"}]
 });
 assert.equal(result.valid,false);
 assert.ok(result.errors.some(error=>["INVALID_TERMINAL_REFERENCE","WIRE_ENDPOINT_UNKNOWN"].includes(error.code)));
});

test("preflight safely falls back when v5 diagnostics are unavailable",()=>{
 const result=load(false).validate({components:[],wires:[]});
 assert.equal(result.available,false);
 assert.equal(result.valid,true);
});


test("meter re-solves cannot bypass structural topology preflight",()=>{
 const source=fs.readFileSync("simulator.js","utf8");
 const start=source.indexOf('$("[data-meter]")');
 const end=source.indexOf('$(".mode")',start);
 assert.ok(start>=0&&end>start,"meter handler should be present");
 const handler=source.slice(start,end);
 const check=handler.indexOf("VoltProSimulationPreflight");
 const block=handler.indexOf("preflight?.valid===false");
 const solve=handler.indexOf("window.VoltProEngine?.dc(project)");
 assert.ok(check>=0,"meter handler should run the shared preflight");
 assert.ok(block>check&&solve>block,"meter preflight must run before any fallback solver call");
});
