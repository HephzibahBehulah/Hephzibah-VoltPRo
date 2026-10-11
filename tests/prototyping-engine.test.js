const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const T=require("../src/core/terminal-graph.js");
const Ladder=require("../platform/ladder-engine.js");
const MCU=require("../platform/mcu-engine.js");
function loadEngine(registry){const window={VoltProTerminalGraph:T,VoltProLadder:Ladder,VoltProMCU:MCU};if(registry)window.VoltProRegistry=registry;vm.runInNewContext(fs.readFileSync("engine/voltpro-engine.js","utf8"),{window,Map,Set,Array,String,Number,Math,Boolean,Object,JSON,Error});return window.VoltProEngine}
const E=loadEngine();
function comp(id,type,pins,props={}){return {id,type,pins:Array.from({length:pins},(_,i)=>id+":"+i),props}}
function wire(a,b){return {a,b}}

test("catalog motor IDs resolve to a working two-terminal electrical equivalent",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:12}),
  comp("M1","motors-motor-dc-12v",2,{ratedVoltage:12,resistance:6})
 ],wires:[wire("V1:0","M1:0"),wire("M1:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 const motor=result.branches.find(b=>b.id==="M1");
 assert.ok(motor,"catalog motor must appear in the solved branch list");
 assert.ok(Math.abs(motor.current-2)<1e-6,"12 V / 6 Ω motor equivalent should draw approximately 2 A");
});
test("registry electricalModel metadata can activate a motor model for a custom catalog ID",()=>{
 const registry={get:id=>id==="custom-motor-test"?{electricalModel:{type:"motor"}}:null};
 const Engine=loadEngine(registry);
 const p={components:[
  comp("V1","battery",2,{voltage:24}),
  comp("M1","custom-motor-test",2,{resistance:12})
 ],wires:[wire("V1:0","M1:0"),wire("M1:1","V1:1")]};
 const result=Engine.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.branches.find(b=>b.id==="M1").current-2)<1e-6);
});


test("catalog MCB IDs resolve to a protection path and encoded rated current",()=>{
 const make=(resistance)=>({components:[
  comp("V1","battery",2,{voltage:12}),
  comp("Q1","protection-mcb-b6",2,{rating:16,tripMultiplier:1}),
  comp("R1","resistor",2,{resistance})
 ],wires:[wire("V1:0","Q1:0"),wire("Q1:1","R1:0"),wire("R1:1","V1:1")]});
 const overload=E.dc(make(1));
 assert.equal(overload.ok,true,JSON.stringify(overload));
 assert.equal(overload.deviceStates.Q1.tripped,true,"B6 catalog model must use its encoded 6 A rating, not the generic 16 A default");
 const normal=E.dc(make(10));
 assert.equal(normal.ok,true,JSON.stringify(normal));
 assert.equal(normal.deviceStates.Q1.tripped,false);
});
test("catalog fuse ID uses its encoded current rating for overcurrent pickup",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:12}),
  comp("F1","protection-mcb-fuse-2a",2,{rating:16,tripMultiplier:1.5}),
  comp("R1","resistor",2,{resistance:3})
 ],wires:[wire("V1:0","F1:0"),wire("F1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.F1.tripped,true,"2 A catalog fuse should open above its simplified pickup");
});


test("catalog normally-open pushbutton switches its two-terminal path",()=>{
 const make=(pressed)=>({components:[
  comp("V1","battery",2,{voltage:12}),
  comp("S1","switching-switch-pushbutton-no",2,{pressed}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]});
 const released=E.dc(make(false));
 assert.equal(released.ok,true,JSON.stringify(released));
 assert.ok(Math.abs(released.branches.find(b=>b.id==="R1").current)<1e-8);
 const pressed=E.dc(make(true));
 assert.equal(pressed.ok,true,JSON.stringify(pressed));
 assert.ok(Math.abs(pressed.branches.find(b=>b.id==="R1").current-.12)<1e-6);
});
test("catalog normally-closed pushbutton and emergency stop open when pressed",()=>{
 for(const type of ["switching-switch-pushbutton-nc","switching-switch-emergency-stop"]){
  const make=(pressed)=>({components:[
   comp("V1","battery",2,{voltage:12}),
   comp("S1",type,2,{pressed}),
   comp("R1","resistor",2,{resistance:100})
  ],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]});
  const released=E.dc(make(false));
  assert.equal(released.ok,true,JSON.stringify(released));
  assert.ok(Math.abs(released.branches.find(b=>b.id==="R1").current-.12)<1e-6,type+" should be closed when released");
  const pressed=E.dc(make(true));
  assert.equal(pressed.ok,true,JSON.stringify(pressed));
  assert.ok(Math.abs(pressed.branches.find(b=>b.id==="R1").current)<1e-8,type+" should open when pressed");
 }
});


test("catalog 230-to-24 V transformer performs isolated AC voltage conversion",()=>{
 const p={components:[
  comp("V1","ac_source",2,{voltage:230,frequency:50}),
  comp("T1","transformers-transformer-230-24v-25va",4,{primaryVoltage:230,secondaryVoltage:24,turnsRatio:230/24}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","T1:0"),wire("V1:1","T1:1"),
  wire("T1:2","R1:0"),wire("R1:1","T1:3")
 ]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const load=result.sweep[0].branches.find(b=>b.id==="R1");
 assert.ok(Math.abs(load.voltage-24)<1e-6,"catalog transformer should produce 24 V secondary: "+JSON.stringify(load));
 assert.ok(Math.abs(load.current-.24)<1e-6,"100 Ω load should draw 240 mA: "+JSON.stringify(load));
});


test("rated catalog lamp uses its nameplate voltage and power in the AC solve",()=>{
 const p={components:[
  comp("V1","ac_source",2,{voltage:230,frequency:50}),
  comp("L1","loads-load-lamp-60w",2,{ratedVoltage:230,ratedPower:60})
 ],wires:[wire("V1:0","L1:0"),wire("L1:1","V1:1")]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const lamp=result.sweep[0].branches.find(b=>b.id==="L1");
 assert.ok(Math.abs(lamp.voltage-230)<1e-6);
 assert.ok(Math.abs(lamp.current-(60/230))<1e-5,"60 W at 230 V should draw about 261 mA: "+JSON.stringify(lamp));
 assert.ok(Math.abs(lamp.power-60)<1e-3,"lamp should dissipate its rated 60 W: "+JSON.stringify(lamp));
});
test("catalog load equivalent respects disabled state",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:230}),
  comp("H1","loads-load-heater-500w",2,{ratedVoltage:230,ratedPower:500,enabled:false})
 ],wires:[wire("V1:0","H1:0"),wire("H1:1","V1:1")]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.branches.find(b=>b.id==="H1").current)<1e-8);
});


test("catalog PT100 sensor uses its configured resistive operating point",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:12}),
  comp("S1","sensors-sensor-pt100",2,{resistance:100})
 ],wires:[wire("V1:0","S1:0"),wire("S1:1","V1:1")]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.branches.find(b=>b.id==="S1").current-.12)<1e-6);
});
test("catalog proximity sensor opens and closes as its active state changes",()=>{
 const make=(active)=>({components:[
  comp("V1","battery",2,{voltage:12}),
  comp("S1","sensors-sensor-proximity",2,{active}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]});
 const inactive=E.dc(make(false));
 assert.equal(inactive.ok,true,JSON.stringify(inactive));
 assert.ok(Math.abs(inactive.branches.find(b=>b.id==="R1").current)<1e-8);
 const active=E.dc(make(true));
 assert.equal(active.ok,true,JSON.stringify(active));
 assert.ok(Math.abs(active.branches.find(b=>b.id==="R1").current-.12)<1e-6);
});


test("rated fluorescent catalog lamps use their nameplate power",()=>{
 const p={components:[
  comp("V1","ac_source",2,{voltage:230,frequency:50}),
  comp("L1","lighting-lamp-fluorescent-18w",2,{ratedVoltage:230,ratedPower:18})
 ],wires:[wire("V1:0","L1:0"),wire("L1:1","V1:1")]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const lamp=result.sweep[0].branches.find(b=>b.id==="L1");
 assert.ok(Math.abs(lamp.current-18/230)<1e-5);
 assert.ok(Math.abs(lamp.power-18)<1e-3);
});


test("catalog red LED uses the diode model and conducts through a series resistor",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:5}),
  comp("R1","resistor",2,{resistance:150}),
  comp("D1","lighting-lamp-led-red",2,{forward:2,resistance:10})
 ],wires:[wire("V1:0","R1:0"),wire("R1:1","D1:0"),wire("D1:1","V1:1")]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 const led=result.branches.find(b=>b.id==="D1");
 assert.ok(led.current>0.015&&led.current<0.025,"LED should conduct around 20 mA with a 150 Ω series resistor: "+JSON.stringify(led));
});


test("PT100 and PT1000 catalog sensors use temperature-dependent IEC-style resistance",()=>{
 const make=(type,temperatureC)=>({components:[comp("V1","battery",2,{voltage:1}),comp("S1",type,2,{temperatureC}),comp("R1","resistor",2,{resistance:1000})],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]});
 for(const [type,temperatureC,expected] of [["sensors-sensor-pt100",100,138.5],["sensors-sensor-pt1000",100,1385]]){
  const result=E.dc(make(type,temperatureC));
  assert.equal(result.ok,true,JSON.stringify(result));
  const sensor=result.branches.find(b=>b.id==="S1"&&b.contactId==="sensor-resistance");
  assert.ok(sensor,"resistive sensor must expose a solved branch");
  const expectedCurrent=1/(expected+1000);
  assert.ok(Math.abs(sensor.current-expectedCurrent)<1e-7,type+" should be approximately "+expected+" ohms at 100C, got "+sensor.current);
 }
});
test("NTC catalog sensors follow a beta equation when temperature is supplied",()=>{
 const p={components:[comp("V1","battery",2,{voltage:1}),comp("S1","sensors-sensor-ntc-10k",2,{temperatureC:50,beta:3950}),comp("R1","resistor",2,{resistance:1000})],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 const sensor=result.branches.find(b=>b.id==="S1"&&b.contactId==="sensor-resistance");
 const expected=10000*Math.exp(3950*(1/(50+273.15)-1/298.15));
 assert.ok(Math.abs(sensor.current-1/(expected+1000))<1e-7,"NTC resistance should fall as temperature rises");
});
test("LDR catalog sensor resistance falls as configured illuminance rises",()=>{
 const make=lightLux=>({components:[comp("V1","battery",2,{voltage:1}),comp("S1","sensors-sensor-ldr",2,{lightLux}),comp("R1","resistor",2,{resistance:1000})],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]});
 const dim=E.dc(make(10)),bright=E.dc(make(1000));
 assert.equal(dim.ok,true,JSON.stringify(dim));assert.equal(bright.ok,true,JSON.stringify(bright));
 const dimCurrent=dim.branches.find(b=>b.id==="S1"&&b.contactId==="sensor-resistance").current;
 const brightCurrent=bright.branches.find(b=>b.id==="S1"&&b.contactId==="sensor-resistance").current;
 assert.ok(brightCurrent>dimCurrent,"increased lux should reduce LDR resistance and increase series current");
});
test("sensor fixed resistance remains supported when no physical stimulus is configured",()=>{
 const p={components:[comp("V1","battery",2,{voltage:10}),comp("S1","sensors-sensor-pt100",2,{resistance:200}),comp("R1","resistor",2,{resistance:300})],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.branches.find(b=>b.id==="S1"&&b.contactId==="sensor-resistance").current-10/500)<1e-7);
});


test("catalog contactor coil rating is inferred from a 24 VAC model ID",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:24}),
  comp("KM1","contactors-contactor-24vac",12,{coilResistance:82}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","KM1:0"),wire("KM1:1","V1:1"),
  wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1")
 ]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.KM1,true,"a 24 V catalog contactor should pick up at 24 V without an explicit coilVoltage property");
 assert.ok(result.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&b.current>0.23));
});
test("catalog relay coil rating is inferred from a 24 VDC model ID",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:24}),
  comp("K1","relays-relay-24vdc",8,{coilResistance:240}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","K1:0"),wire("K1:1","V1:1"),
  wire("V1:0","K1:2"),wire("K1:4","R1:0"),wire("R1:1","V1:1")
 ]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.K1,true,"a 24 V relay should pick up at its catalog rated voltage");
 assert.ok(result.branches.some(b=>b.id==="K1"&&b.contactId==="changeover-1-no"&&b.current>0));
});
test("explicit coil voltage overrides the catalog's inferred rating",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:24}),
  comp("KM1","contactors-contactor-230vac",12,{coilVoltage:230,coilResistance:82})
 ],wires:[wire("V1:0","KM1:0"),wire("KM1:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.KM1,false,"a 24 V supply must not pick up a 230 V coil");
});

test("catalog three-phase transformer provides the expected phase-neutral secondary voltage",()=>{
 const p={components:[
  comp("V1","threephase",4,{lineVoltage:400,sequence:"ABC"}),
  comp("T1","transformers-transformer-3p-400-230",8,{primaryVoltage:400,secondaryVoltage:230,turnsRatio:400/230}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","T1:0"),wire("V1:1","T1:1"),wire("V1:2","T1:2"),wire("V1:3","T1:3"),
  wire("T1:4","R1:0"),wire("R1:1","T1:7")
 ]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const mainLoad=result.sweep[0].branches.find(b=>b.id==="R1");
 assert.ok(Math.abs(mainLoad.voltage-230/Math.sqrt(3))<1e-4,"secondary phase-neutral voltage should follow 400:230 line-voltage ratio: "+JSON.stringify(mainLoad));
});


test("catalog three-phase transformer auxiliary winding supplies 24 V",()=>{
 const p={components:[
  comp("V1","threephase",4,{lineVoltage:400,sequence:"ABC"}),
  comp("T1","transformers-transformer-3p-400-230-24",10,{primaryVoltage:400,secondaryVoltage:230,turnsRatio:400/230,primaryPhaseVoltage:400/Math.sqrt(3),auxiliaryVoltage:24,auxiliaryTurnsRatio:(400/Math.sqrt(3))/24}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","T1:0"),wire("V1:1","T1:1"),wire("V1:2","T1:2"),wire("V1:3","T1:3"),
  wire("T1:8","R1:0"),wire("R1:1","T1:9")
 ]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const load=result.sweep[0].branches.find(b=>b.id==="R1");
 assert.ok(Math.abs(load.voltage-24)<1e-4,"auxiliary winding should provide 24 V: "+JSON.stringify(load));
});

test("BB400 joins each five-hole strip and power rail in the MNA topology",()=>{const p={components:[comp("V1","battery",2,{voltage:5}),comp("R1","resistor",2,{resistance:100}),comp("BB1","breadboard-bb400",400)],wires:[wire("V1:0","BB1:0"),wire("R1:0","BB1:30"),wire("R1:1","BB1:150"),wire("V1:1","BB1:150")]};const result=E.analyze(p).dc;assert.equal(result.ok,true,JSON.stringify(result));assert.ok(result.totalCurrent>0.04&&result.totalCurrent<0.06,"expected about 50 mA through 100 Ω at 5 V")});
test("one-pole breaker opens and closes its actual line/load path",()=>{const base={components:[comp("V1","battery",2,{voltage:12}),comp("Q1","circuit-breaker-1p",2,{rating:16,closed:1}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","Q1:0"),wire("Q1:1","R1:0"),wire("R1:1","V1:1")]};const closed=E.analyze(base).dc;assert.equal(closed.ok,true,JSON.stringify(closed));assert.ok(closed.totalCurrent>0.1);const opened=E.analyze({...base,components:base.components.map(c=>c.id==="Q1"?{...c,props:{...c.props,closed:0}}:c)}).dc;assert.equal(opened.ok,true,JSON.stringify(opened));assert.ok(Math.abs(opened.totalCurrent)<1e-9)});

test("overcurrent trips a single-pole breaker and opens its load path",()=>{
 const make=(resistance)=>({components:[
  comp("V1","battery",2,{voltage:12}),
  comp("Q1","circuit-breaker-1p",2,{rating:2,tripMultiplier:5,closed:1}),
  comp("R1","resistor",2,{resistance})
 ],wires:[wire("V1:0","Q1:0"),wire("Q1:1","R1:0"),wire("R1:1","V1:1")]});
 const overload=E.analyze(make(1)).dc;
 assert.equal(overload.ok,true,JSON.stringify(overload));
 assert.equal(overload.deviceStates.Q1.tripped,true,"12 A exceeds the 10 A instantaneous pickup");
 assert.ok(Math.abs(overload.branches.find(b=>b.id==="R1").current)<1e-8,"tripped breaker must interrupt the load");
 const normal=E.analyze(make(10)).dc;
 assert.equal(normal.ok,true,JSON.stringify(normal));
 assert.equal(normal.deviceStates.Q1.tripped,false,"1.2 A should remain below pickup");
 assert.ok(Math.abs(normal.branches.find(b=>b.id==="R1").current-1.2)<1e-6,"closed breaker contact resistance should cause only a negligible drop");
});
test("fuse opens when current exceeds its simplified pickup threshold",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:12}),
  comp("F1","fuse",2,{rating:1,tripMultiplier:1.5}),
  comp("R1","resistor",2,{resistance:4})
 ],wires:[wire("V1:0","F1:0"),wire("F1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.F1.tripped,true);
 assert.ok(Math.abs(result.branches.find(b=>b.id==="R1").current)<1e-8);
});
test("AC overcurrent pickup opens a breaker and re-solves the phasor network",()=>{
 const p={components:[
  comp("V1","ac_source",2,{voltage:230,frequency:50}),
  comp("Q1","circuit-breaker-1p",2,{rating:2,tripMultiplier:5,closed:1}),
  comp("R1","resistor",2,{resistance:10})
 ],wires:[wire("V1:0","Q1:0"),wire("Q1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.sweep[0].deviceStates.Q1.tripped,true,"23 A exceeds the 10 A pickup");
 assert.ok(Math.abs(result.sweep[0].branches.find(b=>b.id==="R1").current)<1e-8,"AC breaker trip must interrupt the load");
});

test("four-pole breaker exposes independent phase and neutral paths without shorting different poles",()=>{const def=T.definitionFor("circuit-breaker-4p");assert.equal(def.paths.length,4);assert.deepEqual(Array.from(def.paths,p=>[p.from,p.to]),[["L1","T1"],["L2","T2"],["L3","T3"],["N","TN"]]);});

test("Arduino Uno R3 aliases shared power, ground, reset and I2C terminals in the MNA topology",()=>{const p={components:[comp("V1","battery",2,{voltage:5}),comp("R1","resistor",2,{resistance:100}),comp("U1","arduino-uno-r3",38)],wires:[wire("V1:0","U1:21"),wire("R1:0","U1:33"),wire("R1:1","V1:1")]};const result=E.analyze(p).dc;assert.equal(result.ok,true,JSON.stringify(result));assert.ok(result.totalCurrent>0.04&&result.totalCurrent<0.06,"5V and ICSP VCC should share a net")});

test("ABB AUX-CB-11 NC path is closed when released and opens when actuated",()=>{const base={components:[comp("V1","battery",2,{voltage:12}),comp("AUX1","abb-aux-cb-11",8,{actuated:0}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","AUX1:1"),wire("AUX1:5","R1:0"),wire("R1:1","V1:1")]};const released=E.analyze(base).dc;assert.equal(released.ok,true,JSON.stringify(released));assert.ok(released.totalCurrent>0.1);const actuated=E.analyze({...base,components:base.components.map(c=>c.id==="AUX1"?{...c,props:{...c.props,actuated:1}}:c)}).dc;assert.equal(actuated.ok,true,JSON.stringify(actuated));assert.ok(Math.abs(actuated.totalCurrent)<1e-9)});


test("catalog contactor 24 VAC variant has a real coil and switched main pole",()=>{
 const p={components:[
  comp("V1","battery",2,{voltage:24}),
  comp("KM1","contactors-contactor-24vac",12,{coilVoltage:24,coilResistance:82}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","KM1:0"),wire("KM1:1","V1:1"),
  wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1")
 ]};
 const result=E.dc(p);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.KM1,true,"24 V coil should energize from 24 V");
 assert.ok(Math.abs(result.branches.find(b=>b.id==="R1").current-.24)<1e-5);
 assert.ok(result.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&b.current>0.23));
});


test("catalog 24 V relay variant switches its NO and NC contacts with coil state",()=>{
 const make=(voltage)=>({components:[
  comp("V1","battery",2,{voltage}),
  comp("K1","relays-relay-24vdc",8,{coilVoltage:24,coilResistance:240}),
  comp("R1","resistor",2,{resistance:100}),
  comp("R2","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","K1:0"),wire("K1:1","V1:1"),
  wire("V1:0","K1:2"),wire("K1:4","R1:0"),wire("R1:1","V1:1"),
  wire("V1:0","K1:2"),wire("K1:3","R2:0"),wire("R2:1","V1:1")
 ]});
 const energized=E.dc(make(24));
 assert.equal(energized.ok,true,JSON.stringify(energized));
 assert.equal(energized.deviceStates.K1,true);
 assert.ok(Math.abs(energized.branches.find(b=>b.id==="R1").current-.24)<1e-5);
 assert.ok(Math.abs(energized.branches.find(b=>b.id==="R2").current)<1e-8);
 const released=E.dc(make(5));
 assert.equal(released.ok,true,JSON.stringify(released));
 assert.equal(released.deviceStates.K1,false);
 assert.ok(Math.abs(released.branches.find(b=>b.id==="R1").current)<1e-8);
 assert.ok(Math.abs(released.branches.find(b=>b.id==="R2").current-.05)<1e-5);
});


test("catalog auxiliary contactor 1NO+1NC switches both contacts with its coil",()=>{
 const make=(voltage)=>({components:[
  comp("V1","battery",2,{voltage}),
  comp("KM1","contactors-contactor-1no1nc",6,{coilVoltage:24,coilResistance:82}),
  comp("R1","resistor",2,{resistance:100}),
  comp("R2","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","KM1:0"),wire("KM1:1","V1:1"),
  wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1"),
  wire("V1:0","KM1:4"),wire("KM1:5","R2:0"),wire("R2:1","V1:1")
 ]});
 const energized=E.dc(make(24));
 assert.equal(energized.ok,true,JSON.stringify(energized));
 assert.equal(energized.deviceStates.KM1,true);
 assert.ok(Math.abs(energized.branches.find(b=>b.id==="R1").current-.24)<1e-5);
 assert.ok(Math.abs(energized.branches.find(b=>b.id==="R2").current)<1e-8);
 const released=E.dc(make(5));
 assert.equal(released.ok,true,JSON.stringify(released));
 assert.equal(released.deviceStates.KM1,false);
 assert.ok(Math.abs(released.branches.find(b=>b.id==="R1").current)<1e-8);
 assert.ok(Math.abs(released.branches.find(b=>b.id==="R2").current-.05)<1e-5);
});

test("contactor coil voltage drives three independent main poles and auxiliary contacts",()=>{
 const make=(voltage)=>({components:[comp("V1","battery",2,{voltage}),comp("KM1","contactor",12,{coilVoltage:230,coilResistance:82}),comp("R1","resistor",2,{resistance:100}),comp("R2","resistor",2,{resistance:100})],wires:[wire("V1:0","KM1:0"),wire("KM1:1","V1:1"),wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1"),wire("V1:0","KM1:8"),wire("KM1:9","R1:0"),wire("V1:0","KM1:10"),wire("KM1:11","R2:0"),wire("R2:1","V1:1")]});
 const energized=E.analyze(make(230)).dc;
 assert.equal(energized.ok,true,JSON.stringify(energized));
 assert.equal(energized.deviceStates.KM1,true,"230 V coil should pull in");
 assert.ok(energized.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&b.current>1),"main contact should conduct after coil energizes: "+JSON.stringify(energized.branches));
 assert.ok(energized.branches.some(b=>b.id==="KM1"&&b.contactId==="aux-no-13-14"&&b.current>0),"NO auxiliary contact should close with coil");
 assert.ok(Math.abs(energized.branches.find(b=>b.id==="R2").current)<1e-8,"NC auxiliary contact should open when energized");
 const released=E.analyze(make(24)).dc;
 assert.equal(released.ok,true,JSON.stringify(released));
 assert.equal(released.deviceStates.KM1,false,"24 V should not pull in a 230 V coil");
 assert.ok(released.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&Math.abs(b.current)<1e-9),"main contact should remain open");
 assert.ok(Math.abs(released.branches.find(b=>b.id==="R2").current-.24)<1e-5,"NC auxiliary contact should remain closed when deenergized");
});
test("relay uses explicit eight-terminal coil and changeover contacts",()=>{
 const p={components:[comp("V1","battery",2,{voltage:24}),comp("K1","relay",8,{coilVoltage:24,coilResistance:240}),comp("R1","resistor",2,{resistance:100}),comp("R2","resistor",2,{resistance:100})],wires:[wire("V1:0","K1:0"),wire("K1:1","V1:1"),wire("V1:0","K1:2"),wire("K1:3","R1:0"),wire("R1:1","V1:1"),wire("K1:4","R2:0"),wire("R2:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.K1,true,"24 V relay coil should energize");
 assert.ok(result.branches.some(b=>b.id==="K1"&&b.contactId==="changeover-1-no"&&b.current>0),"relay NO contact should conduct");
 assert.ok(result.branches.some(b=>b.id==="K1"&&b.contactId==="changeover-1-nc"&&Math.abs(b.current)<1e-9),"relay NC contact should open");
});
test("numeric zero opens a legacy generic switch rather than being treated as closed",()=>{
 const p={components:[comp("V1","battery",2,{voltage:12}),comp("S1","switch",2,{closed:0}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.totalCurrent)<1e-9);
});

test("balanced three-phase MNA source drives all three motor windings at phase voltage",()=>{
 const p={components:[comp("PS1","threephase",4,{voltage:400,frequency:50,sequence:"ABC"}),comp("Q1","circuit-breaker-3p",6,{closed:1}),comp("M1","motor",7,{resistance:24})],wires:[
 wire("PS1:0","Q1:0"),wire("PS1:1","Q1:1"),wire("PS1:2","Q1:2"),
 wire("Q1:3","M1:0"),wire("Q1:4","M1:1"),wire("Q1:5","M1:2"),
 wire("M1:3","PS1:3"),wire("M1:4","PS1:3"),wire("M1:5","PS1:3")
 ]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const row=result.sweep[0],windings=row.branches.filter(b=>b.id==="M1");
 assert.equal(windings.length,3);
 for(const winding of windings){assert.ok(Math.abs(winding.voltage-400/Math.sqrt(3))<.1,"expected phase voltage: "+JSON.stringify(winding));assert.ok(Math.abs(winding.current-(400/Math.sqrt(3))/24)<.01,"expected winding current: "+JSON.stringify(winding))}
 assert.equal(row.sourceCurrents.filter(s=>s.id==="PS1").length,3);
});

test("three-phase contactor coil energizes from phase-neutral AC voltage and closes motor poles",()=>{
 const p={components:[comp("PS1","threephase",4,{voltage:400,frequency:50}),comp("KM1","contactor",12,{coilVoltage:230,coilResistance:82}),comp("M1","motor",7,{resistance:24})],wires:[
 wire("PS1:0","KM1:0"),wire("KM1:1","PS1:3"),
 wire("PS1:0","KM1:2"),wire("KM1:3","M1:0"),
 wire("PS1:1","KM1:4"),wire("KM1:5","M1:1"),
 wire("PS1:2","KM1:6"),wire("KM1:7","M1:2"),
 wire("M1:3","PS1:3"),wire("M1:4","PS1:3"),wire("M1:5","PS1:3")
 ]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const row=result.sweep[0];
 assert.equal(row.deviceStates.KM1,true,"phase-neutral voltage should energize the 230 V coil");
 assert.ok(row.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&b.current>9),"contactor main pole should carry motor phase current");
 assert.equal(row.branches.filter(b=>b.id==="M1").length,3);
});

test("ideal transformer enforces turns ratio and galvanic isolation in AC MNA",()=>{
 const p={components:[
  comp("V1","ac_source",2,{voltage:230,frequency:50}),
  comp("T1","transformer",4,{primaryVoltage:230,secondaryVoltage:24}),
  comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("V1:0","T1:0"),wire("V1:1","T1:1"),
  wire("T1:2","R1:0"),wire("R1:1","T1:3")
 ]};
 const result=E.ac(p,{frequency:50,points:1});
 assert.equal(result.ok,true,JSON.stringify(result));
 const row=result.sweep[0],load=row.branches.find(b=>b.id==="R1");
 assert.ok(Math.abs(load.voltage-24)<1e-6,"secondary voltage should follow 230:24 turns ratio: "+JSON.stringify(load));
 assert.ok(Math.abs(load.current-.24)<1e-6,"100 ohm secondary load should draw 240 mA: "+JSON.stringify(load));
 assert.ok(Math.abs(load.power-5.76)<1e-5,"secondary load power should be 5.76 W: "+JSON.stringify(load));
});

test("independent current sources stamp without creating floating voltage-source unknowns",()=>{
 const p={components:[comp("V1","battery",2,{voltage:12}),comp("I1","current_source",2,{current:.01}),comp("R1","resistor",2,{resistance:1000})],wires:[
 wire("V1:0","I1:0"),wire("I1:1","V1:1"),wire("V1:0","R1:0"),wire("R1:1","V1:1")
 ]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.branches.find(b=>b.id==="R1").current-.012)<1e-9);
 assert.ok(Math.abs(result.totalCurrent-.022)<1e-8);
});

test("DOL control circuit seals in through the contactor auxiliary NO contact and stops on NC stop",()=>{
 const p={components:[
  comp("CS1","controlsource",2,{voltage:24}),comp("V1","battery",2,{voltage:230}),
  comp("S0","pushbutton-nc",2,{pressed:false}),comp("S1","pushbutton-no",2,{pressed:true}),
  comp("KM1","contactor",12,{coilVoltage:24,coilResistance:100}),comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("CS1:0","S0:0"),wire("S0:1","S1:0"),wire("S0:1","KM1:8"),
  wire("S1:1","KM1:0"),wire("KM1:9","KM1:0"),wire("KM1:1","CS1:1"),
  wire("CS1:1","V1:1"),wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1")
 ]};
 const started=E.analyze(p).dc;
 assert.equal(started.ok,true,JSON.stringify(started));
 assert.equal(started.deviceStates.KM1,true,"start pushbutton should energize contactor");
 assert.ok(started.branches.find(b=>b.id==="R1").current>2,"main pole should feed the load");
 p.components.find(c=>c.id==="KM1").state={energized:started.deviceStates.KM1};
 p.components.find(c=>c.id==="S1").props.pressed=false;
 const held=E.analyze(p).dc;
 assert.equal(held.ok,true,JSON.stringify(held));
 assert.equal(held.deviceStates.KM1,true,"auxiliary NO contact should hold the coil after start is released");
 assert.ok(held.branches.find(b=>b.id==="R1").current>2);
 p.components.find(c=>c.id==="KM1").state={energized:held.deviceStates.KM1};
 p.components.find(c=>c.id==="S0").props.pressed=true;
 const stopped=E.analyze(p).dc;
 assert.equal(stopped.ok,true,JSON.stringify(stopped));
 assert.equal(stopped.deviceStates.KM1,false,"stop NC contact should drop out the coil");
 assert.ok(Math.abs(stopped.branches.find(b=>b.id==="R1").current)<1e-8,"main poles should open after stop");
});

test("overload relay trips on sustained overcurrent and drops out the contactor",()=>{
 const p={components:[
  comp("CS1","controlsource",2,{voltage:24}),comp("PS1","threephase",4,{voltage:400,frequency:50}),
  comp("S0","pushbutton-nc",2,{pressed:false}),comp("S1","pushbutton-no",2,{pressed:true}),
  comp("KM1","contactor",12,{coilVoltage:24,coilResistance:100}),
  comp("OL1","overload-relay",10,{ratedCurrent:10,tripMultiplier:1.05,heaterResistance:.01,tripped:0}),
  comp("M1","motor",7,{resistance:2})
 ],wires:[
  wire("CS1:0","S0:0"),wire("S0:1","OL1:6"),wire("OL1:7","S1:0"),wire("OL1:7","KM1:8"),
  wire("S1:1","KM1:0"),wire("KM1:9","KM1:0"),wire("KM1:1","CS1:1"),
  wire("PS1:3","CS1:1"),
  wire("PS1:0","KM1:2"),wire("KM1:3","OL1:0"),wire("OL1:1","M1:0"),
  wire("PS1:1","KM1:4"),wire("KM1:5","OL1:2"),wire("OL1:3","M1:1"),
  wire("PS1:2","KM1:6"),wire("KM1:7","OL1:4"),wire("OL1:5","M1:2"),
  wire("M1:3","PS1:3"),wire("M1:4","PS1:3"),wire("M1:5","PS1:3")
 ]};
 const dc=E.analyze(p).dc;
 assert.equal(dc.ok,true,JSON.stringify(dc));
 assert.equal(dc.deviceStates.OL1.tripped,true,"overload should latch after phase current exceeds the setting");
 assert.equal(dc.deviceStates.KM1,false,"opening overload NC contact should drop out the contactor");
 assert.ok(Math.abs(dc.branches.find(b=>b.id==="M1").current)<1e-6,"contactor main poles should interrupt motor current");
 const ac=E.ac(p,{frequency:50,points:1});
 assert.equal(ac.ok,true,JSON.stringify(ac));
 assert.equal(ac.sweep[0].deviceStates.OL1.tripped,true,"AC RMS phase current should also trip the overload");
 assert.equal(ac.sweep[0].deviceStates.KM1,false);
});

test("automatic transfer switch selects normal source when both supplies are healthy",()=>{
 const p={components:[comp("VN","battery",2,{voltage:230}),comp("VE","battery",2,{voltage:220}),comp("ATS1","automatic-transfer-switch",12,{minVoltage:180,transferSource:"normal"}),comp("R1","resistor",2,{resistance:100})],wires:[
  wire("VN:0","ATS1:0"),wire("VN:1","ATS1:3"),
  wire("VE:0","ATS1:4"),wire("VE:1","ATS1:7"),wire("VE:1","VN:1"),
  wire("ATS1:8","R1:0"),wire("R1:1","ATS1:11")
 ]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.ATS1.transferSource,"normal");
 assert.ok(result.branches.find(b=>b.id==="ATS1"&&b.contactId==="normal-L1").current>2);
 assert.ok(Math.abs(result.branches.find(b=>b.id==="ATS1"&&b.contactId==="emergency-L1").current)<1e-8,"emergency pole must remain open while normal source is healthy");
});
test("automatic transfer switch transfers to emergency source when normal voltage is lost",()=>{
 const p={components:[comp("VN","battery",2,{voltage:0}),comp("VE","battery",2,{voltage:230}),comp("ATS1","automatic-transfer-switch",12,{minVoltage:180,transferSource:"normal"}),comp("R1","resistor",2,{resistance:100})],wires:[
  wire("VN:0","ATS1:0"),wire("VN:1","ATS1:3"),
  wire("VE:0","ATS1:4"),wire("VE:1","ATS1:7"),wire("VE:1","VN:1"),
  wire("ATS1:8","R1:0"),wire("R1:1","ATS1:11")
 ]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.ATS1.transferSource,"emergency");
 assert.ok(result.branches.find(b=>b.id==="ATS1"&&b.contactId==="emergency-L1").current>2);
 assert.ok(Math.abs(result.branches.find(b=>b.id==="ATS1"&&b.contactId==="normal-L1").current)<1e-8,"normal pole must remain open after transfer");
});

test("PLC ladder outputs drive a wired contactor and respect stop interlocks",()=>{
 const program={rungs:[
  {id:"motor",branches:[
   [{address:"I1",type:"NO"},{address:"I2",type:"NO"},{address:"I0",type:"NO"}],
   [{address:"I1",type:"NO"},{address:"I2",type:"NO"},{address:"Q0",type:"NO"}]
  ],coils:[{address:"Q0",type:"COIL"}]},
  {id:"lamp",branches:[[{address:"Q0",type:"NO"}]],coils:[{address:"Q1",type:"COIL"}]}
 ]};
 const p={components:[
  comp("CS1","controlsource",2,{voltage:24}),comp("V1","battery",2,{voltage:230}),
  comp("PLC1","plc-controller",13,{minVoltage:18,inputThreshold:12,inputResistance:10000,supplyResistance:4800,scanTimeMs:10,program:JSON.stringify(program)}),
  comp("S1","pushbutton-no",2,{pressed:true}),comp("S0","pushbutton-nc",2,{pressed:false}),comp("S2","pushbutton-nc",2,{pressed:false}),
  comp("KM1","contactor",12,{coilVoltage:24,coilResistance:100}),comp("R1","resistor",2,{resistance:100})
 ],wires:[
  wire("CS1:0","PLC1:0"),wire("CS1:1","PLC1:1"),
  wire("CS1:0","S1:0"),wire("S1:1","PLC1:2"),
  wire("CS1:0","S0:0"),wire("S0:1","PLC1:3"),
  wire("CS1:0","S2:0"),wire("S2:1","PLC1:4"),
  wire("CS1:0","PLC1:5"),wire("PLC1:6","KM1:0"),wire("KM1:1","CS1:1"),
  wire("CS1:1","V1:1"),wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1")
 ]};
 const applyStates=result=>{for(const [id,state] of Object.entries(result.deviceStates||{})){const c=p.components.find(x=>x.id===id);if(c)c.state={...(c.state||{}),...(state&&typeof state==="object"?state:{energized:Boolean(state)})}}};
 const started=E.analyze(p).dc;
 assert.equal(started.ok,true,JSON.stringify(started));
 assert.equal(started.deviceStates.PLC1.Q0,true,"ladder coil Q0 should energize from the Start input");
 assert.equal(started.deviceStates.KM1,true,"PLC relay output should energize the contactor coil");
 assert.ok(started.branches.find(b=>b.id==="R1").current>2);
 applyStates(started);p.components.find(c=>c.id==="S1").props.pressed=false;
 const held=E.analyze(p).dc;
 assert.equal(held.ok,true,JSON.stringify(held));
 assert.equal(held.deviceStates.PLC1.Q0,true,"ladder Q0 contact should seal in after Start is released");
 assert.equal(held.deviceStates.KM1,true);
 applyStates(held);p.components.find(c=>c.id==="S0").props.pressed=true;
 const stopped=E.analyze(p).dc;
 assert.equal(stopped.ok,true,JSON.stringify(stopped));
 assert.equal(stopped.deviceStates.PLC1.Q0,false,"opening the physical Stop input should reset the ladder rung");
 assert.equal(stopped.deviceStates.KM1,false);
 assert.ok(Math.abs(stopped.branches.find(b=>b.id==="R1").current)<1e-6);
});

test("Arduino Uno sketch drives D13 into a real resistor branch",()=>{
 const p={components:[comp("UNO","arduino-uno-r3",38,{logicVoltage:5,sketch:"void setup(){pinMode(13,OUTPUT);digitalWrite(13,HIGH);}"}),comp("R1","resistor",2,{resistance:220})],wires:[wire("UNO:13","R1:0"),wire("R1:1","UNO:15")]};
 const high=E.analyze(p).dc;
 assert.equal(high.ok,true,JSON.stringify(high));
 assert.ok(high.branches.find(b=>b.id==="R1").current>.02);
 p.components[0].props.sketch="void setup(){pinMode(13,OUTPUT);digitalWrite(13,LOW);}";
 const low=E.analyze(p).dc;
 assert.equal(low.ok,true,JSON.stringify(low));
 assert.ok(Math.abs(low.branches.find(b=>b.id==="R1").current)<1e-9);
});
test("Arduino 5 V pin powers an external load through the board supply rail",()=>{
 const p={components:[comp("UNO","arduino-uno-r3",38,{logicVoltage:5,sketch:""}),comp("R1","resistor",2,{resistance:1000})],wires:[wire("UNO:21","R1:0"),wire("R1:1","UNO:15")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(result.branches.find(b=>b.id==="R1").current>.0049);
 assert.ok(result.branches.find(b=>b.id==="R1").current<.0051);
});

test("Arduino digitalRead input voltage changes the output pin in the live circuit",()=>{
 const sketch="void setup(){pinMode(2,INPUT);pinMode(13,OUTPUT);}void loop(){if(digitalRead(2)==HIGH){digitalWrite(13,HIGH);}else{digitalWrite(13,LOW);}}";
 const p={components:[comp("CS1","controlsource",2,{voltage:24}),comp("UNO","arduino-uno-r3",38,{logicVoltage:5,inputResistance:1000000,sketch}),comp("S1","pushbutton-no",2,{pressed:true}),comp("R1","resistor",2,{resistance:220})],wires:[
  wire("CS1:0","S1:0"),wire("S1:1","UNO:2"),wire("CS1:1","UNO:15"),
  wire("UNO:13","R1:0"),wire("R1:1","UNO:15")
 ]};
 const high=E.analyze(p).dc;
 assert.equal(high.ok,true,JSON.stringify(high));
 assert.equal(high.deviceStates.UNO.pins["13"].voltage,5);
 assert.ok(high.branches.find(b=>b.id==="R1").current>.02);
 p.components.find(c=>c.id==="S1").props.pressed=false;
 const low=E.analyze(p).dc;
 assert.equal(low.ok,true,JSON.stringify(low));
 assert.equal(low.deviceStates.UNO.pins["13"].voltage,0);
 assert.ok(Math.abs(low.branches.find(b=>b.id==="R1").current)<1e-9);
});
