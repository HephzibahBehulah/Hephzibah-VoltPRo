const test=require("node:test");
const assert=require("node:assert/strict");
const ladder=require("../platform/ladder-engine.js");
const motorProgram={rungs:[
 {id:"motor",branches:[
  [{address:"I1",type:"NC"},{address:"I2",type:"NC"},{address:"I0",type:"NO"}],
  [{address:"I1",type:"NC"},{address:"I2",type:"NC"},{address:"Q0",type:"NO"}]
 ],coils:[{address:"Q0",type:"COIL"}]},
 {id:"lamp",branches:[[{address:"Q0",type:"NO"}]],coils:[{address:"Q1",type:"COIL"}]}
]};
test("NO/NC contacts execute a seal-in rung and a dependent output rung",()=>{
 let r=ladder.scan(motorProgram,{I0:false,I1:false,I2:false},{},{dtMs:10});
 assert.equal(r.outputs.Q0,false);assert.equal(r.outputs.Q1,false);
 r=ladder.scan(motorProgram,{I0:true,I1:false,I2:false},r.state,{dtMs:10});
 assert.equal(r.outputs.Q0,true);assert.equal(r.outputs.Q1,true);
 r=ladder.scan(motorProgram,{I0:false,I1:false,I2:false},r.state,{dtMs:10});
 assert.equal(r.outputs.Q0,true,"Q0 auxiliary contact should seal in");
 r=ladder.scan(motorProgram,{I0:false,I1:true,I2:false},r.state,{dtMs:10});
 assert.equal(r.outputs.Q0,false,"NC stop contact should interrupt the rung");assert.equal(r.outputs.Q1,false);
});
test("TON timer accumulates scan time and resets when its rung loses power",()=>{
 const p={rungs:[{id:"delay",contacts:[{address:"I0",type:"NO"}],coils:[{address:"Q0",type:"TON",presetMs:300}]}]};
 let r=ladder.scan(p,{I0:true},{},{dtMs:100});assert.equal(r.outputs.Q0,false);assert.equal(r.timers.Q0.elapsedMs,100);
 r=ladder.scan(p,{I0:true},r.state,{dtMs:100});assert.equal(r.outputs.Q0,false);
 r=ladder.scan(p,{I0:true},r.state,{dtMs:100});assert.equal(r.outputs.Q0,true);
 r=ladder.scan(p,{I0:false},r.state,{dtMs:100});assert.equal(r.outputs.Q0,false);assert.equal(r.timers.Q0.elapsedMs,0);
});
test("SET and RESET coils retain state between scans",()=>{
 const p={rungs:[{id:"set",contacts:[{address:"I0",type:"NO"}],coils:[{address:"M0",type:"SET"}]},{id:"reset",contacts:[{address:"I1",type:"NO"}],coils:[{address:"M0",type:"RESET"}]}]};
 let r=ladder.scan(p,{I0:true,I1:false},{},{dtMs:10});assert.equal(r.memory.M0,true);
 r=ladder.scan(p,{I0:false,I1:false},r.state,{dtMs:10});assert.equal(r.memory.M0,true);
 r=ladder.scan(p,{I0:false,I1:true},r.state,{dtMs:10});assert.equal(r.memory.M0,false);
});
test("CTU counts rising rung transitions rather than every scan",()=>{
 const p={rungs:[{id:"count",contacts:[{address:"I0",type:"NO"}],coils:[{address:"Q0",type:"CTU",preset:2}]}]};
 let r=ladder.scan(p,{I0:true},{},{dtMs:10});assert.equal(r.counters.Q0.count,1);assert.equal(r.outputs.Q0,false);
 r=ladder.scan(p,{I0:true},r.state,{dtMs:10});assert.equal(r.counters.Q0.count,1);
 r=ladder.scan(p,{I0:false},r.state,{dtMs:10});
 r=ladder.scan(p,{I0:true},r.state,{dtMs:10});assert.equal(r.counters.Q0.count,2);assert.equal(r.outputs.Q0,true);
});
test("invalid ladder programs return a diagnostic instead of silently producing outputs",()=>{assert.equal(ladder.scan({},{}).ok,false)});

test("TP timer emits a pulse for the preset scan duration",()=>{
 const p={rungs:[{id:"pulse",contacts:[{address:"I0",type:"NO"}],coils:[{address:"Q0",type:"TP",presetMs:200}]}]};
 let r=ladder.scan(p,{I0:true},{},{dtMs:100});assert.equal(r.outputs.Q0,true);
 r=ladder.scan(p,{I0:true},r.state,{dtMs:100});assert.equal(r.outputs.Q0,false);
 r=ladder.scan(p,{I0:false},r.state,{dtMs:100});assert.equal(r.outputs.Q0,false);
 r=ladder.scan(p,{I0:true},r.state,{dtMs:100});assert.equal(r.outputs.Q0,true,"a new rising edge should start another pulse");
});
