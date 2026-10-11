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

test("digitalRead if/else branches select the matching output state",()=>{
 const sketch="pinMode(2,INPUT);pinMode(13,OUTPUT);if(digitalRead(2)==HIGH){digitalWrite(13,HIGH);}else{digitalWrite(13,LOW);}";
 assert.equal(MCU.simulate(sketch,{inputs:{"2":true}}).pins["13"].voltage,5);
 assert.equal(MCU.simulate(sketch,{inputs:{"2":false}}).pins["13"].voltage,0);
});

test("timed loop sequences advance through digitalWrite and delay instructions",()=>{
 const sketch="void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(100);digitalWrite(13,LOW);delay(100);}";
 let r=MCU.simulate(sketch,{dtMs:0});assert.equal(r.pins["13"].voltage,0);
 r=MCU.simulate(sketch,{state:r.state,dtMs:50});assert.equal(r.pins["13"].voltage,5);assert.equal(r.state.delayRemainingMs,50);
 r=MCU.simulate(sketch,{state:r.state,dtMs:50});assert.equal(r.pins["13"].voltage,0);assert.equal(r.state.delayRemainingMs,100);
});
