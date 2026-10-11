const test=require("node:test");
const assert=require("node:assert/strict");
const MCU=require("../platform/mcu-engine.js");
test("Arduino pinMode and digitalWrite produce a deterministic output voltage",()=>{
 const r=MCU.simulate("void setup(){pinMode(13,OUTPUT);digitalWrite(13,HIGH);}",{target:"Arduino Uno R3"});
 assert.equal(r.pins["13"].mode,"OUTPUT");assert.equal(r.pins["13"].state,1);assert.equal(r.pins["13"].voltage,5);assert.equal(r.executable,false);
});
test("analogWrite maps an 8-bit PWM duty cycle to its DC-equivalent voltage",()=>{
 const r=MCU.simulate("pinMode(9,OUTPUT);analogWrite(9,128);");
 assert.equal(r.pins["9"].mode,"OUTPUT");assert.equal(r.pins["9"].pwmDuty,128);assert.ok(Math.abs(r.pins["9"].voltage-(5*128/255))<1e-12);
});
test("INPUT_PULLUP is represented as a digital input mode",()=>{
 const r=MCU.simulate("pinMode(2,INPUT_PULLUP);");
 assert.equal(r.pins["2"].mode,"INPUT_PULLUP");
});
