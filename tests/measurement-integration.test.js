const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
function load(){const window={};vm.runInNewContext(fs.readFileSync("src/simulation/measurement.js","utf8"),{window,Number,Math,Infinity,Error});return window.VoltProMeasurement}
test("measurement API reads a solved branch",()=>{const m=load(),state={branches:[{id:"R1",voltage:10,current:.1}]};assert.equal(m.measure("voltage",state,{branchId:"R1"}),10);assert.equal(m.measure("current",state,{branchId:"R1"}),.1);assert.equal(m.measure("resistance",state,{branchId:"R1"}),100)});
test("continuity distinguishes low resistance and open branches",()=>{const m=load(),state={branches:[{id:"Q1",contactId:"closed",voltage:.000001,current:1},{id:"Q1",contactId:"open",voltage:12,current:0}]};assert.equal(m.measure("continuity",state,{branchId:"Q1",contactId:"closed"}),true);assert.equal(m.measure("continuity",state,{branchId:"Q1",contactId:"open"}),false)});
test("node voltage API accepts MNA node result arrays",()=>{const m=load(),state={nodeVoltages:[{node:1,voltage:12},{node:2,voltage:3}]};assert.equal(m.measure("voltage",state,{a:1,b:2}),9)});
