const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
test('ladder editor stores structured rungs and nodes',()=>{const ctx={window:{},structuredClone:global.structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/plc/ladder-editor.js','utf8'),ctx);const l=ctx.window.VoltProLadder,p=l.create();l.addRung(p,[l.node('contact-no','START'),l.node('coil','KM1')]);assert.equal(p.rungs[0].nodes[1].tag,'KM1')})
test('PLC editor and scan runtime coexist and implement start/stop behavior',()=>{
 const ctx={window:{},structuredClone:global.structuredClone};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('src/plc/ladder-editor.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync('src/plc/runtime.js','utf8'),ctx);
 const L=ctx.window.VoltProLadderEditor,R=ctx.window.VoltProPLCRuntime;
 assert.ok(L&&R,'both editor and runtime APIs must be available');
 const p=L.create({rungs:[{id:'R001',nodes:[L.node('contact-no','START'),L.node('contact-nc','STOP'),L.node('contact-nc','ESTOP'),L.node('coil','KM1')]}]});
 let state=R.scan(p,{io:{START:true,STOP:false,ESTOP:false}});
 assert.equal(state.io.KM1,true,'START should energize the output when STOP and ESTOP are healthy');
 state=R.scan(p,{...state,io:{...state.io,START:true,STOP:true,ESTOP:false}});
 assert.equal(state.io.KM1,false,'STOP should de-energize the output');
 state=R.scan(p,{...state,io:{...state.io,START:true,STOP:false,ESTOP:true}});
 assert.equal(state.io.KM1,false,'ESTOP should de-energize the output');
});
test('PLC workbench uses the separate editor namespace and BB400 continuity is passed to the solver',()=>{
 const workbench=fs.readFileSync('src/ui/engineering-workspaces.js','utf8');
 const simulator=fs.readFileSync('simulator.js','utf8');
 assert.ok(workbench.includes('const L=window.VoltProLadderEditor,R=window.VoltProPLCRuntime;'));
 assert.ok(simulator.includes('function electricalWires(){'));
 assert.ok(simulator.includes('route:"breadboard-strip"'));
 assert.ok(simulator.includes('wires.innerHTML=S.wires.filter(w=>!w.internal)'));
});
