(()=>{"use strict";
const esc=value=>String(value??"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const legacyMicro=window.VoltProWorkbench?.micro;
let timer=null;
function open(options={}){
 if(timer){clearInterval(timer);timer=null}
 if(typeof legacyMicro!=="function"){window.alert("The VoltPRo Workbench did not load. Reload the simulator and try again.");return}
 window.VoltPRoMCULabOpeningLegacy=true;
 try{legacyMicro()}finally{delete window.VoltPRoMCULabOpeningLegacy}
 const shell=document.querySelector("#vpWorkbench"),body=shell?.querySelector(".vpw-body");
 if(!shell||!body)return;
 body.innerHTML='<main class="vpw-main"><section class="vpw-logic-card"><b>Stateful local sketch runner</b><p>Run, pause, step and reset a supported Arduino-style sketch. Modeled pin states and voltages update as the interpreter advances.</p><label>Board <select id="vpwBoard"><option>Arduino UNO</option><option>Generic GPIO</option></select></label> <label>Step interval (ms) <input id="vpwStepMs" type="number" min="10" max="1000" step="10" value="50" style="width:90px"></label><p>Supported subset: pinMode, digitalWrite, analogWrite, simple digitalRead if/else and timed write/delay loops. This is not a native compiler and does not upload firmware.</p></section><textarea id="vpwCode" rows="12" spellcheck="false" aria-label="Arduino-style sketch" style="width:100%;margin:10px 0;background:#06101b;color:#eaf5ff;border:1px solid #31516d;border-radius:8px;padding:12px;font:12px/1.6 ui-monospace,monospace">void setup(){\n  pinMode(13, OUTPUT);\n  Serial.println("VoltPRo ready");\n}\nvoid loop(){\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}</textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><button id="vpwRunMcu">▶ Run</button><button id="vpwStepMcu">Step once</button><button id="vpwStopMcu" disabled>■ Stop</button><button id="vpwResetMcu">↺ Reset</button></div><p id="vpwMcuStatus" role="status" aria-live="polite" style="color:#65e6ad;font:700 11px ui-monospace,monospace">STOPPED · Ready to initialise sketch</p><h3>Pin monitor</h3><div id="vpwMcuPins" style="overflow:auto"><p>Run or step the sketch to inspect modeled pins.</p></div><h3>Serial monitor</h3><pre id="vpwMcuOut" style="white-space:pre-wrap;overflow-wrap:anywhere;background:#06101b;border:1px solid #29475f;border-radius:8px;padding:12px">No Serial output yet.</pre><p id="vpwMcuDetails" style="color:#8da4bd;font-size:10px"></p></main>';
 const code=document.querySelector("#vpwCode"),board=document.querySelector("#vpwBoard"),stepField=document.querySelector("#vpwStepMs"),run=document.querySelector("#vpwRunMcu"),step=document.querySelector("#vpwStepMcu"),stop=document.querySelector("#vpwStopMcu"),reset=document.querySelector("#vpwResetMcu"),status=document.querySelector("#vpwMcuStatus"),close=document.querySelector("#vpwClose");
 const samples={blink:["void setup(){","  pinMode(13, OUTPUT);","  Serial.println(\"VoltPRo ready\");","}","void loop(){","  digitalWrite(13, HIGH);","  delay(500);","  digitalWrite(13, LOW);","  delay(500);","}"].join("\n"),button:["void setup(){","  pinMode(2, INPUT);","  pinMode(13, OUTPUT);","  Serial.println(\"Toggle D2 to control the LED on D13\");","}","void loop(){","  if (digitalRead(2) == HIGH) { digitalWrite(13, HIGH); } else { digitalWrite(13, LOW); }","}"].join("\n"),pwm:["void setup(){","  pinMode(9, OUTPUT);","  Serial.println(\"PWM output on D9\");","}","void loop(){","  analogWrite(9, 64);","  delay(300);","  analogWrite(9, 192);","  delay(300);","}"].join("\n")};
 if(options.sample&&samples[options.sample])code.value=samples[options.sample];
 if(options.board)board.value=options.board;
 let state=null,lastCode=code.value,inputs={};
 const stepMs=()=>Math.max(10,Math.min(1000,Number(stepField.value)||50));
 function stopTimer(){if(timer){clearInterval(timer);timer=null}run.disabled=false;stop.disabled=true}
 function showResult(result){
  const entries=Object.entries(result.pins||{}).sort((a,b)=>Number(a[0])-Number(b[0]));
  document.querySelector("#vpwMcuPins").innerHTML=entries.length?'<table style="width:100%;border-collapse:collapse;font:11px ui-monospace,monospace"><thead><tr><th style="text-align:left;padding:7px;border-bottom:1px solid #29475f">Pin</th><th style="text-align:left;padding:7px;border-bottom:1px solid #29475f">Mode</th><th style="text-align:left;padding:7px;border-bottom:1px solid #29475f">State / input</th><th style="text-align:left;padding:7px;border-bottom:1px solid #29475f">Voltage</th><th style="text-align:left;padding:7px;border-bottom:1px solid #29475f">PWM</th></tr></thead><tbody>'+entries.map(([pin,p])=>'<tr><td style="padding:7px;border-bottom:1px solid #203b53">D'+esc(pin)+'</td><td style="padding:7px;border-bottom:1px solid #203b53">'+esc(p.mode||"OUTPUT")+'</td><td style="padding:7px;border-bottom:1px solid #203b53;color:'+(p.state?"#65e6ad":"#8da4bd")+'">'+((p.mode==="INPUT"||p.mode==="INPUT_PULLUP")?'<button type="button" data-mcu-input="'+esc(pin)+'">'+(inputs[pin]?"HIGH":"LOW")+' · Toggle</button>':(p.state?"HIGH":"LOW"))+'</td><td style="padding:7px;border-bottom:1px solid #203b53">'+(Number(p.voltage)||0).toFixed(2)+' V</td><td style="padding:7px;border-bottom:1px solid #203b53">'+(p.pwmDuty===undefined?"—":esc(p.pwmDuty)+"/255")+'</td></tr>').join("")+'</tbody></table>':'<p>No modeled pins declared yet. Add pinMode() statements to the sketch.</p>';
  document.querySelectorAll("[data-mcu-input]").forEach(button=>button.onclick=()=>{const pin=button.dataset.mcuInput;inputs[pin]=!inputs[pin];stepSimulation(0)});
  document.querySelector("#vpwMcuOut").textContent=(result.serial||[]).join("\n")||"No Serial output in this sketch.";
  document.querySelector("#vpwMcuDetails").textContent=result.note||"";
 }
 function stepSimulation(dt){const source=code.value;if(source!==lastCode){state=null;lastCode=source;inputs={}}const result=window.VoltProMCU?.simulate(source,{target:board.value,state:state||undefined,inputs,dtMs:dt});if(!result){status.textContent="ERROR · MCU engine did not load";document.querySelector("#vpwMcuDetails").textContent="Reload the simulator and try again.";stopTimer();return null}state=result.state;showResult(result);return result}
 run.onclick=()=>{if(timer)return;stepSimulation(0);status.textContent="RUNNING · Advancing sketch in local simulation";run.disabled=true;stop.disabled=false;timer=setInterval(()=>stepSimulation(stepMs()),stepMs())};
 step.onclick=()=>{stopTimer();stepSimulation(stepMs());status.textContent="PAUSED · One simulation step completed"};
 stop.onclick=()=>{stopTimer();status.textContent="STOPPED · State retained; press Run to continue"};
 reset.onclick=()=>{stopTimer();state=null;inputs={};lastCode=code.value;stepSimulation(0);status.textContent="RESET · Setup initialised; loop ready"};
 code.addEventListener("input",()=>{stopTimer();state=null;inputs={};lastCode=code.value;status.textContent="CODE CHANGED · Reset or run to initialise the new sketch"});
 board.addEventListener("change",()=>{stopTimer();state=null;inputs={};lastCode=code.value;status.textContent="BOARD CHANGED · Reset or run to initialise the sketch"});
 if(close)close.onclick=()=>{stopTimer();shell.classList.remove("open")};
}
window.VoltProMCULab={open};
if(window.VoltProWorkbench)window.VoltProWorkbench.micro=open;
})();