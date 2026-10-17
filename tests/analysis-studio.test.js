'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../src/ui/analysis-data.js');
function engine(){const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync('engine/voltpro-engine.js','utf8'),ctx);return ctx.window.VoltProEngine}
function series(type,props,source='battery',sourceProps={voltage:12}){return {components:[{id:'V',type:source,props:sourceProps},{id:'R',type:'resistor',props:{resistance:1000}},{id:'X',type,props}],wires:[{a:'V:0',b:'R:0'},{a:'R:1',b:'X:0'},{a:'X:1',b:'V:1'}]}}
test('RC transient follows the analytical charging curve and retains capacitor history',()=>{
 const p=series('capacitor',{capacitance:1e-5}),r=engine().transient(p,{duration:.05,steps:1000});assert.equal(r.ok,true,r.error);
 const trace=data.trace(r,'X');assert.equal(trace.length,1001);assert.ok(Math.abs(trace[200].y-12*(1-Math.exp(-1)))<.02);assert.ok(trace[0].y<1e-5);assert.ok(trace.at(-1).y>11.9);
 assert.ok(trace.every((p,i)=>!i||p.y>=trace[i-1].y));
});
test('RL transient stores current rather than previous inductor voltage',()=>{
 const r=engine().transient(series('inductor',{inductance:10}),{duration:.05,steps:1000});assert.equal(r.ok,true,r.error);
 const trace=data.trace(r,'X');assert.ok(Math.abs(trace[200].y-12/Math.E)<.03);assert.ok(trace[0].y>11.99);assert.ok(trace.at(-1).y<.1);
});
test('sinusoidal source is sampled in circuit time and supports reverse voltage',()=>{
 const r=engine().transient(series('resistor',{resistance:1000},'acsource',{voltage:10,frequency:50}),{duration:.02,steps:400});assert.equal(r.ok,true,r.error);
 const trace=data.trace(r,'X');assert.ok(Math.abs(trace[100].y-5)<1e-8);assert.ok(Math.abs(trace[300].y+5)<1e-8);
});
test('AC low-pass cutoff is -3.01 dB and -45 degrees at 1/(2πRC)',()=>{
 const p=series('capacitor',{capacitance:1e-6},'acsource',{voltage:1}),frequency=1/(2*Math.PI*1000*1e-6),r=engine().ac(p,{frequency,points:1});assert.equal(r.ok,true,r.error);
 const point=data.bode(r,'X',1)[0];assert.ok(Math.abs(point.y+3.0103)<.001);assert.ok(Math.abs(point.phase+45)<.001);
});
test('terminal voltages expose both ground and measured circuit nodes',()=>{
 const p=series('resistor',{resistance:1000}),r=engine().dc(p);assert.equal(r.ok,true);assert.equal(r.terminalVoltages['V:1'],0);assert.ok(Math.abs(r.terminalVoltages['X:0']-6)<1e-8);
});
test('transient rejects invalid sample counts and durations',()=>{
 const e=engine(),p=series('capacitor',{capacitance:1e-6});for(const options of [{steps:0},{steps:1.5},{steps:10001},{duration:0},{duration:Infinity}])assert.equal(e.transient(p,options).ok,false);
});
test('DFT locates a sine wave peak with amplitude correction',()=>{
 const points=Array.from({length:512},(_,i)=>({x:i/512,y:3*Math.sin(2*Math.PI*20*i/512)})),s=data.spectrum(points),peak=s.reduce((a,b)=>a.y>b.y?a:b);
 assert.equal(peak.x,20);assert.ok(Math.abs(peak.y-3)<.001);assert.ok(Math.abs(data.stats(points).rms-3/Math.sqrt(2))<1e-10);
});
test('CSV exports captured data and retains signed samples',()=>assert.equal(data.csv([{x:0,y:-2},{x:1,y:3}]),'time_s,voltage_V\n0,-2\n1,3\n'));
test('simulator startup binds collections using querySelectorAll',()=>{
 const source=fs.readFileSync('simulator.js','utf8');assert.doesNotMatch(source,/(?<!\$)\$\("[^"]*"\)\.forEach/);assert.doesNotThrow(()=>new vm.Script(source));
 for(const file of ['analysis-data.js','analysis-studio.js'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync('src/ui/'+file,'utf8')));
});
test('running wire rendering resolves live-path activity from solved branches',()=>{
 const source=fs.readFileSync('simulator.js','utf8'),start=source.indexOf('function isLiveWire('),end=source.indexOf('\nfunction renderWires',start);
 const ctx={S:{lastAnalysis:{branches:[{id:'R',current:.01},{id:'OPEN',current:0}]}}};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 assert.equal(ctx.isLiveWire({a:'R:0',b:'V:0'}),true);assert.equal(ctx.isLiveWire({a:'OPEN:0',b:'V:0'}),false);ctx.S.lastAnalysis=null;assert.equal(ctx.isLiveWire({a:'R:0',b:'V:0'}),false);
});
test('repeated save/load with the real terminal graph preserves RC topology and response',()=>{
 const window={VoltProTerminalGraph:require('../src/core/terminal-graph.js'),defs:{battery:{pins:2},resistor:{pins:2},capacitor:{pins:2}}},ctx={window,structuredClone,console};vm.createContext(ctx);
 for(const file of ['src/core/net-resolver.js','platform/v5-runtime.js','platform/project-format.js','engine/voltpro-engine.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 let p=series('capacitor',{capacitance:1e-5});p.components.forEach(c=>{c.x=0;c.y=0});
 for(let cycle=0;cycle<4;cycle++){
  const saved=window.VoltProProject.encode(window.VoltProV5Runtime.adapt(p));p=window.VoltProProject.toLegacy(saved);
  assert.deepEqual(Array.from(p.wires,w=>[w.a,w.b]),[['V:0','R:0'],['R:1','X:0'],['X:1','V:1']]);
  assert.ok(p.wires.every(w=>!Object.hasOwn(w,'from')&&!Object.hasOwn(w,'to')));
  const r=window.VoltProEngine.transient(p,{duration:.01,steps:100});assert.equal(r.ok,true,r.error);assert.ok(Math.abs(data.trace(r,'X').at(-1).y-12*(1-Math.exp(-1)))<.03);
 }
});
