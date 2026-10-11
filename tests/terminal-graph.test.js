const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function load(){const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/core/terminal-graph.js','utf8'),ctx);return ctx.window.VoltProTerminalGraph}
test('indexes multi-terminal devices as stable endpoints',()=>{const g=load().build({devices:[{id:'KM1',terminals:[{id:'A1',label:'A1',type:'control',domain:'dc'},{id:'A2',label:'A2',type:'control',domain:'dc'},{id:'L1',label:'L1',type:'power',domain:'three-phase'},{id:'T1',label:'T1',type:'power',domain:'three-phase'}]}]});assert.equal(g.valid,true);assert.equal(g.resolve('KM1:A1').label,'A1');assert.equal(g.endpointIds().length,4)});
test('detects duplicate device and terminal identities',()=>{const g=load().build({devices:[{id:'QF1',terminals:[{id:'1'},{id:'1'}]},{id:'QF1',terminals:[{id:'2'}]}]});assert.equal(g.valid,false);assert.ok(g.errors.some(x=>x.code==='DUPLICATE_DEVICE'));assert.ok(g.errors.some(x=>x.code==='DUPLICATE_TERMINAL'))});
test('Arduino Uno R3 exposes board headers and shared pins',()=>{const d=load().definitionFor('arduino-uno-r3');assert.equal(d.terminals.length,38);for(const id of ['D0','D13','IOREF','RESET_PWR','3V3','5V','GND_D','A0','A5','SDA','SCL','ICSP_MISO','ICSP_VCC','ICSP_SCK','ICSP_MOSI','RESET_ICSP','GND_ICSP'])assert.ok(d.terminals.some(t=>t.id===id),'missing '+id);assert.ok(d.paths.some(p=>p.from==='SDA'&&p.to==='A4'));assert.ok(d.paths.some(p=>p.from==='SCL'&&p.to==='A5'))});
test('ABB AUX-CB-11 resolves to the explicit 1NO+3NC terminal map',()=>{const d=load().definitionFor('abb-aux-cb-11');assert.equal(d.terminals.length,8);assert.equal(d.paths.length,4);assert.equal(d.paths[0].from,'13');assert.equal(d.paths[0].to,'14');assert.equal(d.paths[3].from,'41');assert.equal(d.paths[3].to,'42')});
test('BB400 defines 400 connection holes and internal strips/rails',()=>{const d=load().definitionFor('breadboard-bb400');assert.equal(d.terminals.length,400);assert.equal(d.paths.length,30*8+4*24);for(const id of ['A1','E30','F1','J30','PPLUS1','PMINUS25','NPLUS1','NMINUS25'])assert.ok(d.terminals.some(t=>t.id===id),'missing '+id);assert.ok(d.paths.some(p=>p.from==='A1'&&p.to==='B1'));assert.ok(d.paths.some(p=>p.from==='PPLUS1'&&p.to==='PPLUS2'))});

test('defines 1P, 2P and 4P breakers as independent switching paths',()=>{const api=load();for(const [type,poles] of [['circuit-breaker-1p',1],['circuit-breaker-2p',2],['circuit-breaker-3p',3],['circuit-breaker-4p',4]]){const d=api.definitionFor(type);assert.ok(d,type);assert.equal(d.terminals.length,poles*2,type+' terminal count');assert.equal(d.paths.length,poles,type+' pole path count');if(poles===2)assert.equal(JSON.stringify(Array.from(d.terminals,t=>t.id)),JSON.stringify(['L1','N','T1','TN']));for(let i=0;i<poles;i++){assert.equal(d.paths[i].kind,'switchable');assert.equal(d.paths[i].stateKey,'closed')}}});

test('models an auxiliary contact block with one NO and three NC pairs',()=>{const d=load().definitionFor('auxiliary-contact-block');assert.equal(d.terminals.length,8);assert.equal(d.paths.length,4);assert.equal(JSON.stringify(Array.from(d.paths,p=>p.from+'-'+p.to)),JSON.stringify(['13-14','21-22','31-32','41-42']));assert.equal(d.paths[0].closedWhen,true);assert.ok(d.paths.slice(1).every(p=>p.closedWhen===false))});
test("three-phase source exposes L1/L2/L3 and neutral terminals",()=>{const d=load().definitionFor("threephase");assert.equal(d.terminals.length,4);assert.deepEqual(Array.from(d.terminals,t=>t.id),["L1","L2","L3","N"])});

test("overload relay exposes three thermal elements and 95/96 plus 97/98 contacts",()=>{const d=load().definitionFor("overload-relay");assert.equal(d.terminals.length,10);assert.equal(d.paths.filter(p=>p.kind==="thermal-element").length,3);assert.ok(d.paths.some(p=>p.id==="aux-nc-95-96"));assert.ok(d.paths.some(p=>p.id==="aux-no-97-98"))});

test("automatic transfer switch exposes two four-pole source paths with no overlap",()=>{const d=load().definitionFor("automatic-transfer-switch");assert.equal(d.terminals.length,12);assert.equal(d.paths.length,8);assert.equal(d.paths.filter(p=>p.id.startsWith("normal-")).length,4);assert.equal(d.paths.filter(p=>p.id.startsWith("emergency-")).length,4)});

test("PLC controller exposes power, digital inputs and four isolated relay outputs",()=>{const d=load().definitionFor("plc-controller");assert.equal(d.terminals.length,13);assert.equal(d.paths.filter(p=>p.kind==="input-resistor").length,3);assert.equal(d.paths.filter(p=>p.kind==="switchable").length,4);assert.ok(d.paths.some(p=>p.kind==="supply-load"))});


test('catalog contactor variants expose correct terminal counts and paths',()=>{const T=load();const v=T.definitionFor('contactors-contactor-24vac'),p2=T.definitionFor('contactors-contactor-2p'),p4=T.definitionFor('contactors-contactor-4p');assert.equal(v.terminals.length,12);assert.equal(v.paths.length,6);assert.equal(p2.terminals.length,10);assert.equal(p2.paths.length,5);assert.equal(p4.terminals.length,14);assert.equal(p4.paths.length,7);assert.ok(p4.terminals.some(t=>t.id==='TN'));});


test('catalog relay variants expose coil and two changeover contact sets',()=>{const T=load();const d=T.definitionFor('relays-relay-24vdc');assert.equal(d.terminals.length,8);assert.equal(d.paths.length,5);assert.ok(d.paths.some(p=>p.id==='changeover-1-no'));assert.ok(d.paths.some(p=>p.id==='changeover-2-nc'));});


test('catalog transformer variants expose isolated primary and secondary terminals',()=>{const T=load();const d=T.definitionFor('transformers-transformer-230-24v-25va');assert.equal(d.terminals.length,4);assert.equal(d.terminals.map(t=>t.id).join(','),'P1,P2,S1,S2');assert.equal(d.paths.length,2);assert.ok(d.paths.every(p=>p.kind==='transformer-winding'));});


test('auxiliary contactor catalog variants expose matching terminal/path counts',()=>{const T=load();for(const [id,terminals,paths] of [['contactors-contactor-1no',4,2],['contactors-contactor-2no',6,3],['contactors-contactor-1nc',4,2],['contactors-contactor-2nc',6,3],['contactors-contactor-1no1nc',6,3],['contactors-contactor-2no2nc',10,5]]){const d=T.definitionFor(id);assert.equal(d.terminals.length,terminals,id);assert.equal(d.paths.length,paths,id)}});


test("catalog three-phase transformer variants expose 8 or 10 winding terminals",()=>{const T=load();assert.equal(T.definitionFor("transformers-transformer-3p-400-230").terminals.length,8);assert.equal(T.definitionFor("transformers-transformer-3p-400-230").paths.length,6);assert.equal(T.definitionFor("transformers-transformer-3p-400-230-24").terminals.length,10);});

test("catalog three-phase power sources expose L1/L2/L3/N and power buses pass through",()=>{
 const T=load();
 for(const id of ["power-power-3p-400v","power-power-3p-415v"]){
  const d=T.definitionFor(id);assert.equal(d.terminals.map(t=>t.id).join(","),"L1,L2,L3,N",id);
 }
 for(const id of ["power-power-dc-bus","power-power-ac-bus","power-power-neutral-bus","power-power-earth-bus"]){
  const d=T.definitionFor(id);assert.equal(d.terminals.length,2,id);assert.equal(d.paths.length,1,id);assert.equal(d.paths[0].kind,"passive",id);
 }
});

test("catalog transistor variants expose their true three-terminal pin names",()=>{
 const T=load();
 assert.equal(T.definitionFor("semiconductor-device-bjt-npn").terminals.map(t=>t.id).join(","),"B,C,E");
 assert.equal(T.definitionFor("semiconductor-device-bjt-pnp").terminals.map(t=>t.id).join(","),"B,C,E");
 assert.equal(T.definitionFor("semiconductor-device-mosfet-n").terminals.map(t=>t.id).join(","),"G,D,S");
 assert.equal(T.definitionFor("semiconductor-device-mosfet-p").terminals.map(t=>t.id).join(","),"G,D,S");
 assert.equal(T.definitionFor("semiconductor-device-igbt").terminals.map(t=>t.id).join(","),"G,C,E");
});

test("catalog combinational logic gates expose A/B/Y and NOT exposes A/Y",()=>{
 const T=load();
 for(const id of ["logic-logic-and","logic-logic-or","logic-logic-nand","logic-logic-nor","logic-logic-xor","logic-logic-xnor"])assert.equal(T.definitionFor(id).terminals.map(t=>t.id).join(","),"A,B,Y",id);
 assert.equal(T.definitionFor("logic-logic-not").terminals.map(t=>t.id).join(","),"A,Y");
});

test("catalog comparator and Schmitt trigger expose A/B/Y terminals",()=>{
 const T=load();
 for(const id of ["logic-logic-comparator","logic-logic-schmitt"])assert.equal(T.definitionFor(id).terminals.map(t=>t.id).join(","),"A,B,Y",id);
});

test("catalog sequential logic components expose real input, clock and Q/QB terminals",()=>{
 const T=load();
 assert.equal(T.definitionFor("logic-logic-rs-latch").terminals.map(t=>t.id).join(","),"S,R,Q,QB");
 assert.equal(T.definitionFor("logic-logic-d-latch").terminals.map(t=>t.id).join(","),"D,EN,Q,QB");
 assert.equal(T.definitionFor("logic-logic-d-flipflop").terminals.map(t=>t.id).join(","),"D,CLK,Q,QB");
 assert.equal(T.definitionFor("logic-logic-t-flipflop").terminals.map(t=>t.id).join(","),"T,CLK,Q,QB");
 assert.equal(T.definitionFor("logic-logic-jk-flipflop").terminals.map(t=>t.id).join(","),"J,K,CLK,Q,QB");
});

test("catalog timed logic exposes clock, timer, edge and counter terminals",()=>{
 const T=load();
 assert.equal(T.definitionFor("logic-logic-clock").terminals.map(t=>t.id).join(","),"OUT,GND");
 for(const id of ["logic-logic-timer-delay","logic-logic-pulse","logic-logic-oneshot","logic-logic-edge-rising","logic-logic-edge-falling"])assert.equal(T.definitionFor(id).terminals.map(t=>t.id).join(","),"IN,OUT",id);
 for(const id of ["logic-logic-counter-up","logic-logic-counter-down"])assert.equal(T.definitionFor(id).terminals.map(t=>t.id).join(","),"CLK,EN,Q0,Q1,Q2,Q3",id);
});
