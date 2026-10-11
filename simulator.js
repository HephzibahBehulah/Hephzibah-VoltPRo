(()=>{"use strict";
const C={voltage:12,current:0,resistance:1000};
const S={version:1,mode:"schematic",components:[],wires:[],selected:null,selectedWireId:null,wireStart:null,wirePointer:null,wiringMode:false,running:false,zoom:1,pan:{x:0,y:0},grid:20,history:[],future:[],meter:"voltage",lastAnalysis:null,lastAnalysisSignature:"",theme:"dark",symbolStyle:localStorage.getItem("voltpro-symbol-style")||"iec",wireStyle:{color:"#65d8ff",cableType:"standard",size:"1.5",gauge:"16",width:2.5}};
window.S=S;
window.VoltProSimulator={state:S,addComponent:(type,x,y)=>addComponent(type,x,y),render:()=>render()};
const defs={
 battery:{cat:"Power",name:"DC Source",symbol:"V",pins:2,props:{voltage:12},unit:"V",res:0},
 resistor:{cat:"Passive",name:"Resistor",symbol:"R",pins:2,props:{resistance:1000},unit:"Ω"},
 lamp:{cat:"Loads",name:"Lamp",symbol:"L",pins:2,props:{resistance:120},unit:"Ω"},
 led:{cat:"Semiconductor",name:"LED",symbol:"D",pins:2,props:{forward:2,resistance:330},unit:"Ω"},
 switch:{cat:"Switches",name:"Switch",symbol:"S",pins:2,props:{closed:1}},
 fuse:{cat:"Protection",name:"Fuse",symbol:"F",pins:2,props:{rating:1}},
 breaker:{cat:"Protection",name:"MCB",symbol:"QF",pins:2,props:{rating:6}},
 "circuit-breaker-1p":{cat:"Protection",name:"1-Pole Circuit Breaker",symbol:"QF",pins:2,props:{rating:16,poles:1,closed:1}},
 "circuit-breaker-2p":{cat:"Protection",name:"2-Pole Circuit Breaker",symbol:"QF",pins:4,props:{rating:16,poles:2,closed:1}},
 "circuit-breaker-3p":{cat:"Protection",name:"3-Pole Circuit Breaker",symbol:"QF",pins:6,props:{rating:16,poles:3,closed:1}},
 "circuit-breaker-4p":{cat:"Protection",name:"4-Pole Circuit Breaker",symbol:"QF",pins:8,props:{rating:16,poles:4,closed:1}},
 "auxiliary-contact-block":{cat:"Protection",name:"Auxiliary Contact Block · 1NO + 3NC",symbol:"AUX",pins:8,props:{actuated:0,contactSet:"1NO+3NC"}},
 "abb-aux-cb-11":{cat:"Protection",name:"ABB AUX-CB-11 Front Auxiliary Block · 1NO + 3NC",symbol:"ABB AUX",pins:8,props:{actuated:0,contactSet:"1NO+3NC",manufacturer:"ABB",model:"AUX-CB-11"}},
 "overload-relay":{cat:"Protection",name:"Thermal Overload Relay · 3P + 95/96 + 97/98",symbol:"OL",pins:10,props:{ratedCurrent:10,tripMultiplier:1.05,heaterResistance:.01,tripped:0}},
 "automatic-transfer-switch":{cat:"Protection",name:"Automatic Transfer Switch · Normal / Emergency · 4P",symbol:"ATS",pins:12,props:{minVoltage:180,transferSource:"normal",breakBeforeMake:1}},
 "plc-controller":{cat:"Control",name:"PLC Controller · 3 Digital Inputs / 4 Relay Outputs",symbol:"PLC",pins:13,props:{minVoltage:18,inputThreshold:12,inputResistance:10000,supplyResistance:4800,scanTimeMs:10,program:'{"rungs":[{"id":"motor-seal-in","branches":[[{"address":"I1","type":"NO"},{"address":"I2","type":"NO"},{"address":"I0","type":"NO"}],[{"address":"I1","type":"NO"},{"address":"I2","type":"NO"},{"address":"Q0","type":"NO"}]],"coils":[{"address":"Q0","type":"COIL"}]},{"id":"run-lamp","branches":[[{"address":"Q0","type":"NO"}]],"coils":[{"address":"Q1","type":"COIL"}]}]}'}},
 rcd:{cat:"Protection",name:"RCD / FI",symbol:"RCD",pins:2,props:{trip:0.03}},
 relay:{cat:"Relays",name:"Relay",symbol:"K",pins:8,props:{coilVoltage:24,frequency:50,mainPoles:0,auxNO:1,auxNC:1,coilResistance:240,closed:0}},
 contactor:{cat:"Relays",name:"Contactor",symbol:"KM",pins:12,props:{coilVoltage:230,frequency:50,mainPoles:3,auxNO:1,auxNC:1,coilResistance:82,closed:0}},
 motor:{cat:"Loads",name:"3-Phase Motor",symbol:"M",pins:7,props:{resistance:24}},
 ground:{cat:"Grounding",name:"Protective Earth",symbol:"PE",pins:1,props:{}},
 terminal:{cat:"Panel",name:"Terminal Block",symbol:"X",pins:2,props:{label:"X1"}},
 multimeter:{cat:"Measurement",name:"Multimeter",symbol:"V/A",pins:2,props:{mode:"voltage"}},
 oscilloscope:{cat:"Measurement",name:"Oscilloscope",symbol:"OSC",pins:2,props:{mode:"voltage"}},
 acsource:{cat:"Power",name:"AC Source",symbol:"~",pins:2,props:{voltage:230}},
 threephase:{cat:"Power",name:"3-Phase Source",symbol:"3~",pins:4,props:{voltage:400,frequency:50,sequence:"ABC"}},
 controlsource:{cat:"Power",name:"24 V Control Supply",symbol:"24V",pins:2,props:{voltage:24}},
 "pushbutton-no":{cat:"Switches",name:"Normally Open Pushbutton",symbol:"NO",pins:2,props:{pressed:0}},
 capacitor:{cat:"Passive",name:"Capacitor",symbol:"C",pins:2,props:{capacitance:0.000001}},
 inductor:{cat:"Passive",name:"Inductor",symbol:"L",pins:2,props:{inductance:0.01}},
 diode:{cat:"Semiconductor",name:"Diode",symbol:"→|",pins:2,props:{forward:0.7,resistance:100}},
 zener:{cat:"Semiconductor",name:"Zener Diode",symbol:"Z",pins:2,props:{voltage:5.1,resistance:50}},
 logic_and:{cat:"Logic",name:"AND Gate",symbol:"AND",pins:3,props:{}},
 logic_or:{cat:"Logic",name:"OR Gate",symbol:"OR",pins:3,props:{}},
 logic_not:{cat:"Logic",name:"NOT Gate",symbol:"NOT",pins:2,props:{}},
 arduino:{cat:"Microcontroller",name:"Arduino UNO (legacy)",symbol:"UNO",pins:8,props:{code:"blink"}},
 "arduino-uno-r3":{cat:"Microcontroller",name:"Arduino Uno R3",symbol:"UNO R3",pins:38,props:{code:"blink",logicVoltage:5,sketch:"void setup() { pinMode(13, OUTPUT); digitalWrite(13, HIGH); }"}},
 "breadboard-bb400":{cat:"Prototyping",name:"BB400 Solderless Breadboard",symbol:"BB400",pins:400,props:{rows:10,columns:30,railHoles:100}},
 gpio:{cat:"Microcontroller",name:"GPIO Pin",symbol:"GPIO",pins:1,props:{state:0}},
 sensor:{cat:"Microcontroller",name:"Virtual Sensor",symbol:"S",pins:1,props:{value:50}},
 buzzer:{cat:"Loads",name:"Buzzer",symbol:"BZ",pins:2,props:{resistance:100}},
 heater:{cat:"Loads",name:"Heater",symbol:"H",pins:2,props:{resistance:46}},
 socket:{cat:"Panel",name:"Schuko Socket",symbol:"⏚",pins:3,props:{}},
 rail:{cat:"Panel",name:"DIN Rail",symbol:"DIN",pins:0,props:{length:18}},
 wirelabel:{cat:"Panel",name:"Wire Label",symbol:"LBL",pins:1,props:{label:"101"}}
};
window.S=S; window.defs=defs;
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const svg=$("#canvas"), comps=$("#components"), wires=$("#wires"), labels=$("#labels"), selg=$("#selection"), wrap=$("#canvasWrap");
const wiring=window.VoltProWiring?new window.VoltProWiring.Controller({
 getWires:()=>S.wires,nextId:()=>"W"+uid(),
 onState:s=>{S.wiringMode=s.active;S.wireStart=s.start;S.wirePointer=s.pointer;if(svg)svg.style.cursor=s.active?"crosshair":"default";const b=$("#startWireBtn");if(b){b.classList.toggle("active",s.active);b.setAttribute("aria-pressed",String(s.active))}renderCanvas()},
 onStart:(ref,pos)=>{S.selected=ref.split(":")[0];S.wirePointer=pos||null;log("WIRE START "+ref+" · select a destination terminal or press Escape");renderCanvas()},
 onPreview:(start,p)=>{S.wirePointer=p;if(!wirePreviewFrame)wirePreviewFrame=requestAnimationFrame(()=>{wirePreviewFrame=0;renderWires()})},
 onCommit:w=>{saveHistory();S.wires.push(window.VoltProWiring.normalizeWire({...w,...S.wireStyle,bends:w.bends||[],junctions:w.junctions||[]},S.wires.length));render();log("WIRE "+w.id+" CONNECTED "+w.a+" → "+w.b)},
 onError:(message,detail)=>{log("WIRE ERROR ["+detail.code+"]: "+message);toast("Wire not created: "+message)},
 onCancel:()=>{S.wirePointer=null;S.wireStart=null;log("Wiring cancelled.")},
 onTerminalSelect:ref=>{S.selected=ref.split(":")[0];S.selectedWireId=null;renderCanvas();renderInspector()},
 onWireSelect:id=>{S.selectedWireId=id;S.selected=null;renderCanvas();renderInspector()},
 onDeleteWire:id=>deleteWire(id)
}):null;
function bindExtraControls(){
 const demo=document.querySelector("#demoBtn"); if(demo) demo.onclick=()=>{saveHistory();S.components=[];S.wires=[];const v={id:uid(),type:"battery",x:160,y:240,rotation:0,props:{voltage:12},pins:[]},r={id:uid(),type:"resistor",x:360,y:240,rotation:0,props:{resistance:100},pins:[]},l={id:uid(),type:"lamp",x:560,y:240,rotation:0,props:{resistance:120},pins:[]};S.components=[v,r,l];S.wires=[{a:v.id+":0",b:r.id+":0"},{a:r.id+":1",b:l.id+":0"},{a:l.id+":1",b:v.id+":1"}];render();run()};
 const dm=document.querySelector("#demoMotorBtn"); if(dm) dm.onclick=demoMotor;
 const dl=document.querySelector("#demoLogicBtn"); if(dl) dl.onclick=demoLogic;
 const pb=document.querySelector("#paletteBtn"); if(pb){const p=document.querySelector("#palette");const mobile=matchMedia("(max-width:800px)").matches;if(p)pb.setAttribute("aria-expanded",String(mobile?p.classList.contains("open"):!p.classList.contains("collapsed")));pb.onclick=()=>{const palette=document.querySelector("#palette"),workspace=document.querySelector(".workspace");if(!palette)return;const isMobile=matchMedia("(max-width:800px)").matches;if(isMobile){palette.classList.toggle("open");palette.classList.toggle("collapsed",palette.classList.contains("open"));}else{palette.classList.toggle("collapsed");workspace?.classList.toggle("palette-hidden",palette.classList.contains("collapsed"));}pb.setAttribute("aria-expanded",String(isMobile?palette.classList.contains("open"):!palette.classList.contains("collapsed")));};}
 const gs=document.querySelector("#gridSize"); if(gs) gs.onchange=()=>{S.grid=Math.max(5,Math.min(80,+gs.value||20));const pat=$("#grid");if(pat){pat.setAttribute("width",S.grid);pat.setAttribute("height",S.grid);const p=pat.querySelector("path");if(p)p.setAttribute("d","M"+S.grid+" 0H0V"+S.grid)}render()};const svgExport=document.querySelector("#pngBtn");if(svgExport)svgExport.onclick=exportSVG;
 const svgEl=document.querySelector("#canvas"); if(svgEl) svgEl.addEventListener("mousedown",e=>{if(e.button!==1)return;const start={x:e.clientX,y:e.clientY},orig={...S.pan};const move=q=>{S.pan={x:orig.x+q.clientX-start.x,y:orig.y+q.clientY-start.y};if(!panFrame)panFrame=requestAnimationFrame(()=>{panFrame=0;applyViewport()})};const up=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up)};window.addEventListener("mousemove",move);window.addEventListener("mouseup",up)});
}

let search="",cat="All",dragging=null,wireBending=null,dragWire=null,panStart=null,dragFrame=0,panFrame=0,wirePreviewFrame=0,paletteRenderKey="",suppressPaletteClick=false,paletteSearchTimer=0,paletteEntryCache=[],paletteEntryCacheCount=-1;
function uid(){return "c"+Math.random().toString(36).slice(2,9)}
function snap(v){return Math.round(v/S.grid)*S.grid}
function esc(x){return String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
function log(m){$("#console").textContent+=("\n"+m);$("#console").scrollTop=$("#console").scrollHeight}
function saveHistory(){S.history.push(JSON.stringify({components:S.components,wires:S.wires,panel:S.panel||null}));if(S.history.length>30)S.history.shift();S.future=[]}
function restore(s){const x=JSON.parse(s);S.components=x.components;S.wires=x.wires;if(Object.prototype.hasOwnProperty.call(x,"panel"))S.panel=x.panel?window.VoltProPanel?.create?.(x.panel):undefined;S.selected=null;S.selectedWireId=null;if(wiring)wiring.cancel();render()}
function compDef(t){return defs[t]||window.VoltProRegistry?.definition?.(t)||{cat:"Unsupported",name:"Unsupported component ("+String(t)+")",symbol:"?",pins:2,props:{},unsupported:true}}
function paletteEntries(){const count=window.VoltProRegistry?.count||0;if(paletteEntryCacheCount===count&&paletteEntryCache.length)return paletteEntryCache;const base=Object.entries(defs);const reg=(window.VoltProRegistry?.search?.("")||[]).map(r=>[r.id,compDef(r.id)]);const seen=new Set();paletteEntryCache=[...base,...reg].filter(([k,d])=>{if(String(d.cat||"").toLowerCase()==="wires"||/^wires-/.test(k))return false;if(seen.has(k))return false;seen.add(k);return true});paletteEntryCacheCount=count;return paletteEntryCache}
function addComponent(type,x,y){saveHistory();const d=compDef(type);const c={id:uid(),type,x:snap(x),y:snap(y),rotation:0,registryId:d.registryId||null,props:JSON.parse(JSON.stringify(d.props||{})),pins:[]};S.components.push(c);S.selected=c.id;render();log("PLACED "+d.name+" "+c.id)}
function posFromEvent(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const m=comps.getScreenCTM();if(!m)return{x:0,y:0};const q=p.matrixTransform(m.inverse());return{x:q.x,y:q.y}}
function pinLocalPos(c,i){const n=compDef(c.type).pins;if(c.type==="breadboard-bb400"){if(i<300){const row=Math.floor(i/30),col=i%30;return{x:-261+col*18,y:row<5?-68+row*16:24+(row-5)*16}}const j=i-300,rail=Math.floor(j/25),col=j%25;return{x:-216+col*18,y:[-116,-100,108,124][rail]}}if(c.type==="arduino-uno-r3"){if(i<18)return{x:-100,y:(i-8.5)*14};if(i<32)return{x:100,y:((i-18)-6.5)*13};const j=i-32;return{x:-14+(j%3)*14,y:90+Math.floor(j/3)*14}}if(/^circuit-breaker-[1234]p$/.test(c.type)){const poles=Number(c.type.match(/([1234])p$/)[1]),spacing=poles===4?22:24;return i<poles?{x:(i-(poles-1)/2)*spacing,y:-58}:{x:((i-poles)-(poles-1)/2)*spacing,y:58}}if(c.type==="auxiliary-contact-block"||c.type==="abb-aux-cb-11")return i<4?{x:-55,y:(i-1.5)*14}:{x:55,y:((i-4)-1.5)*14};if(c.type==="overload-relay"){const p=[[-55,-20],[55,-20],[-55,0],[55,0],[-55,20],[55,20],[-55,40],[55,40],[-55,54],[55,54]][i]||[0,0];return{x:p[0],y:p[1]}}if(c.type==="automatic-transfer-switch"){const p=[[-65,-24],[-65,-8],[-65,8],[-65,24],[65,-24],[65,-8],[65,8],[65,24],[-24,48],[-8,48],[8,48],[24,48]][i]||[0,0];return{x:p[0],y:p[1]}}if(c.type==="plc-controller"){const p=[[-18,-50],[18,-50],[-55,-24],[-55,-4],[-55,16],[55,-32],[55,-18],[55,-4],[55,10],[55,24],[55,38],[55,52],[55,66]][i]||[0,0];return{x:p[0],y:p[1]}}if(c.type==="threephase")return i<3?{x:55,y:(i-1)*20}:{x:-55,y:35};if(c.type==="contactor"){const p=[[-24,75],[24,75],[-24,-58],[-24,58],[0,-58],[0,58],[24,-58],[24,58],[-55,0],[55,0],[-55,16],[55,16]][i]||[0,0];return{x:p[0],y:p[1]}}if(c.type==="relay"){const p=[[-30,-25],[30,-25],[-45,-8],[45,-8],[45,4],[-45,18],[45,18],[45,30]][i]||[0,0];return{x:p[0],y:p[1]}}if(c.type==="motor"){const p=[[-55,-20],[-55,0],[-55,20],[55,-20],[55,0],[55,20],[0,40]][i]||[0,0];return{x:p[0],y:p[1]}}if(n===1)return{x:38,y:0};if(n===2)return{x:i?55:-55,y:0};if(n===3)return{x:-55+i*55,y:42};return{x:-55+(i%2)*110,y:i<2?-34:34}}function pinPos(c,i){const p=pinLocalPos(c,i),a=(Number(c.rotation)||0)*Math.PI/180,co=Math.cos(a),si=Math.sin(a);return{x:c.x+p.x*co-p.y*si,y:c.y+p.x*si+p.y*co}}
function symbol(c){
 const d=compDef(c.type), p=c.props||{};
 const line=(x1,y1,x2,y2)=>'<line class="lead" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>';
 const path=d=>'<path class="symbol" d="'+d+'"/>';
 const circle=(r)=>'<circle class="symbol" r="'+r+'"/>';
 const text=(s,y=4)=>'<text class="symbol-label" y="'+y+'" text-anchor="middle">'+esc(s)+'</text>';
 if(S.symbolStyle==="terminal-blocks") return '<rect class="symbol device-block" x="-32" y="-30" width="64" height="60" rx="4"/>'+text(d.symbol||d.name.slice(0,2));
 if(S.symbolStyle==="simplified") return '<rect class="symbol" x="-20" y="-14" width="40" height="28" rx="3"/>'+text(d.symbol||d.name.slice(0,1));
 if(c.type==="arduino-uno-r3") return '<rect class="symbol" x="-88" y="-143" width="176" height="286" rx="9" style="fill:#176b58;stroke:#8aa99c;stroke-width:2"/><rect x="-76" y="-130" width="58" height="35" rx="3" fill="#c4cbd0" stroke="#59656d"/><rect x="-68" y="-122" width="42" height="19" rx="2" fill="#7c8990"/><rect x="-70" y="-78" width="140" height="36" rx="3" fill="#1a272d" stroke="#9caab0"/><rect x="-58" y="-68" width="116" height="16" rx="2" fill="#29383e"/><text class="symbol-label" y="-20" text-anchor="middle">ATmega328P</text><rect x="-47" y="4" width="94" height="44" rx="3" fill="#c5ced2" stroke="#65737b"/><rect x="-39" y="12" width="78" height="28" rx="2" fill="#66777f"/><text class="symbol-label" y="69" text-anchor="middle">UNO R3 · 5 V</text><rect x="-18" y="90" width="36" height="25" rx="2" fill="#273b43" stroke="#a9b6bd"/><circle cx="0" cy="102" r="4" fill="#8aa99c"/>';
 if(c.type==="breadboard-bb400"){const holes=[];for(let row=0;row<10;row++)for(let col=0;col<30;col++){const y=row<5?-68+row*16:24+(row-5)*16;holes.push('<circle cx="'+(-261+col*18)+'" cy="'+y+'" r="2.2" fill="#25313a" stroke="#aeb9bf" stroke-width=".7"/>')}for(const y of [-116,-100,108,124])for(let col=0;col<25;col++)holes.push('<circle cx="'+(-216+col*18)+'" cy="'+y+'" r="2.2" fill="#25313a" stroke="#aeb9bf" stroke-width=".7"/>');return '<rect class="symbol" x="-280" y="-137" width="560" height="274" rx="8" style="fill:#e4e7e5;stroke:#87969d;stroke-width:2"/><rect x="-274" y="-130" width="548" height="34" rx="3" fill="#f3f5f4"/><rect x="-274" y="96" width="548" height="34" rx="3" fill="#f3f5f4"/><path d="M-275 -88H275 M-275 12H275" stroke="#c2cbce" stroke-width="2" stroke-dasharray="3 4"/><path d="M-260 -118H216 M-260 106H216" stroke="#d75a5a" stroke-width="1.5"/><path d="M-260 -102H216 M-260 122H216" stroke="#4c83d8" stroke-width="1.5"/><text class="symbol-label" x="0" y="-78" text-anchor="middle">BB400 · 400 TIE POINTS</text>'+holes.join("")}
 if(c.type==="battery"||c.type==="acsource") return line(-55,0,-25,0)+line(25,0,55,0)+circle(25)+text("+",-4)+text("−",13);
 if(c.type==="resistor") return line(-55,0,-34,0)+path("M-34 0 L-24 -9 L-14 9 L-4 -9 L6 9 L16 -9 L26 9 L34 0")+line(34,0,55,0);
 if(c.type==="lamp") return line(-55,0,-23,0)+circle(23)+path("M-15 -15 L15 15 M15 -15 L-15 15")+line(23,0,55,0);
 if(c.type==="led") return line(-55,0,-14,0)+path("M-14 -17 L16 0 L-14 17 Z")+path("M16 -19 V19")+line(16,0,55,0)+path("M-2 -23 L8 -33 M4 -31 L8 -33 L8 -27 M10 -16 L20 -26 M16 -24 L20 -26 L20 -20");
 if(c.type==="diode"||c.type==="zener") return line(-55,0,-14,0)+path("M-14 -17 L16 0 L-14 17 Z")+path(c.type==="zener"?"M16 -18 L16 18 L23 12 M16 -18 L9 -12":"M16 -19 V19")+line(16,0,55,0);
 if(c.type==="capacitor") return line(-55,0,-7,0)+line(-7,-19,-7,19)+line(7,-19,7,19)+line(7,0,55,0);
 if(c.type==="inductor") return line(-55,0,-30,0)+path("M-30 0 C-30 -22 -15 -22 -15 0 C-15 -22 0 -22 0 0 C0 -22 15 -22 15 0 C15 -22 30 -22 30 0")+line(30,0,55,0);
 if(c.type==="switch") return line(-55,0,-24,0)+'<circle class="symbol" cx="-24" cy="0" r="3"/><circle class="symbol" cx="24" cy="0" r="3"/>'+line(24,0,55,0)+line(-24,0,p.closed?24:15,p.closed?0:-15);
 if(c.type==="motor") return line(-55,-20,-25,-20)+line(-55,0,-25,0)+line(-55,20,-25,20)+circle(25)+text("M")+line(25,-20,55,-20)+line(25,0,55,0)+line(25,20,55,20)+line(0,25,0,40)+text("PE",48);
 if(c.type==="threephase") return circle(25)+line(25,-20,55,-20)+line(25,0,55,0)+line(25,20,55,20)+text("3~")+text("400 V",39);
 if(c.type==="plc-controller") return '<rect class="symbol" x="-35" y="-40" width="70" height="104" rx="4"/>'+text("PLC");
 if(c.type==="automatic-transfer-switch") return line(-65,-24,-35,-24)+line(-65,-8,-35,-8)+line(-65,8,-35,8)+line(-65,24,-35,24)+line(35,-24,65,-24)+line(35,-8,65,-8)+line(35,8,65,8)+line(35,24,65,24)+'<rect class="symbol" x="-35" y="-30" width="70" height="60" rx="4"/>'+text("ATS");
 if(c.type==="overload-relay") return line(-55,-20,-30,-20)+line(30,-20,55,-20)+line(-55,0,-30,0)+line(30,0,55,0)+line(-55,20,-30,20)+line(30,20,55,20)+line(-55,40,-30,40)+line(30,40,55,40)+line(-55,54,-30,54)+line(30,54,55,54)+'<rect class="symbol" x="-30" y="-28" width="60" height="56" rx="3"/>'+text("OL");
 if(c.type==="contactor") return line(-55,-18,-30,-18)+line(-55,-6,-30,-6)+line(-55,6,-30,6)+line(-55,18,-30,18)+'<rect class="symbol" x="-30" y="-26" width="60" height="52" rx="3"/>'+text("KM")+line(30,-18,55,-18)+line(30,-6,55,-6)+line(30,6,55,6)+line(30,18,55,18);
 if(/^circuit-breaker-[1234]p$/.test(c.type)){const poles=Number(c.type.match(/([1234])p$/)[1]),left=poles===4?["L1","L2","L3","N"]:poles===2?["L1","N"]:Array.from({length:poles},(_,i)=>"L"+(i+1)),right=poles===4?["T1","T2","T3","TN"]:poles===2?["T1","TN"]:Array.from({length:poles},(_,i)=>"T"+(i+1)),spacing=poles===1?0:poles===2?20:poles===3?20:16;const leads=left.map((_,i)=>{const y=(i-(poles-1)/2)*spacing;return line(-55,y,-28,y)+line(28,y,55,y)+path("M-13 "+(y-5)+" L-3 "+(y+5)+" M3 "+(y-5)+" L13 "+(y+5))}).join("");return '<rect class="symbol" x="-28" y="-28" width="56" height="56" rx="3"/>'+leads+text(poles+"P",4);}
 if(c.type==="auxiliary-contact-block"||c.type==="abb-aux-cb-11"){const rows=["NO","NC","NC","NC"];return '<rect class="symbol" x="-28" y="-28" width="56" height="56" rx="3"/>'+rows.map((kind,i)=>{const y=-21+i*14;return line(-55,y,-28,y)+line(28,y,55,y)+text(kind,y+3)}).join("");}
 if(c.type==="ground") return line(0,-12,0,0)+'<path class="symbol" d="M-20 0H20 M-13 7H13 M-6 14H6"/>';
 if(c.type==="fuse"||c.type==="breaker") return line(-55,0,-28,0)+'<rect class="symbol" x="-28" y="-12" width="56" height="24" rx="2"/>'+line(28,0,55,0)+text(c.type==="fuse"?"F":"MCB");
 if(c.type==="relay"||c.type==="contactor") return line(-55,0,-30,0)+'<rect class="symbol" x="-30" y="-17" width="60" height="34" rx="3"/>'+line(30,0,55,0)+text(c.type==="relay"?"K":"KM");
 if(c.type==="heater"||c.type==="buzzer") return line(-55,0,-34,0)+'<rect class="symbol" x="-34" y="-18" width="68" height="36" rx="3"/>'+text(c.type==="heater"?"H":"BZ")+line(34,0,55,0);
 if(c.type==="threephase") return line(-55,0,-25,0)+circle(25)+text("3~")+line(25,0,55,0);
 if(c.type==="terminal") return line(-55,0,-18,0)+'<rect class="symbol" x="-18" y="-15" width="36" height="30"/>'+line(18,0,55,0);
 if(c.type==="multimeter"||c.type==="oscilloscope") return line(-55,0,-25,0)+circle(25)+text(c.type==="multimeter"?"V/A":"OSC")+line(25,0,55,0);
 return line(-55,0,-34,0)+'<rect class="body" x="-34" y="-21" width="68" height="42" rx="7"/>'+text(d.symbol)+line(34,0,55,0);
}
function syncRunControls(state=S.running?"running":"stopped"){
 const runButton=$("#runBtn"),stopButton=$("#stopBtn"),status=$("#simStatus");
 if(!runButton||!stopButton||!status)return;
 const current=state==="error"?"error":(S.running?"running":"stopped");
 runButton.classList.toggle("is-running",current==="running");
 stopButton.classList.toggle("is-stopped",current==="stopped"||current==="error");
 runButton.setAttribute("aria-pressed",String(current==="running"));
 stopButton.setAttribute("aria-pressed",String(current==="stopped"||current==="error"));
 runButton.setAttribute("aria-label",current==="running"?"Simulation is running":"Run simulation");
 stopButton.setAttribute("aria-label",current==="running"?"Stop running simulation":"Simulation is stopped");
 status.dataset.state=current;
 const label=status.querySelector(".status-label");
 if(label)label.textContent=current==="running"?"RUNNING":current==="error"?"ERROR · STOPPED":"STOPPED";
 else status.textContent=current==="running"?"RUNNING":current==="error"?"ERROR · STOPPED":"STOPPED";
}
function render(){const key=[cat,search,window.VoltProRegistry?.count||0].join("|");if(key!==paletteRenderKey)renderPalette();renderCanvas();renderInspector();$("#componentCount").textContent=window.VoltProRegistry?.count||Object.keys(defs).length;syncRunControls();$("#zoomLabel").textContent=Math.round(S.zoom*100)+"%"}
function renderPalette(){const entries=paletteEntries();paletteRenderKey=[cat,search,window.VoltProRegistry?.count||0].join("|");const cats=["All",...new Set(entries.map(([,d])=>d.cat))];const tabs=$("#catTabs");tabs.innerHTML=cats.map(x=>'<button class="'+(cat===x?"active":"")+'" data-cat="'+esc(x)+'">'+esc(x)+'</button>').join("");$$("[data-cat]").forEach(b=>b.onclick=()=>{cat=b.dataset.cat;renderPalette()});
 const list=entries.filter(([k,d])=>(cat==="All"||d.cat===cat)&&(d.name+" "+k).toLowerCase().includes(search.toLowerCase()));
 const MAX_VISIBLE=100,visible=list.slice(0,MAX_VISIBLE);$("#paletteList").innerHTML=(list.length>MAX_VISIBLE?'<div class="palette-results-note">Showing first '+MAX_VISIBLE+' of '+list.length+' matches. Search to narrow results.</div>':"")+visible.map(([k,d])=>{const media=window.VoltProMedia?.get?.(d.name)||null;const visual=media?.url?'<img class="palette-thumb" loading="lazy" src="'+esc(media.url)+'" alt="" referrerpolicy="no-referrer">':'<span class="sym">'+esc(d.symbol||"◇")+'</span>';return '<div class="palette-item" draggable="true" data-type="'+k+'">'+visual+'<span><b>'+esc(d.name)+'</b><small>'+esc(d.cat)+(d.registryId?" · catalog":"")+'</small></span></div>'}).join("");
 $$(".palette-item").forEach(el=>{el.onclick=()=>{if(suppressPaletteClick)return;const r=wrap.getBoundingClientRect();addComponent(el.dataset.type,(r.width/2-S.pan.x)/S.zoom,(r.height/2-S.pan.y)/S.zoom)};el.ondragstart=e=>{suppressPaletteClick=true;e.dataTransfer.setData("text/plain",el.dataset.type)};el.ondragend=()=>setTimeout(()=>{suppressPaletteClick=false},250)});
}
const physicalCanvasKinds=new Set(["arduino","breadboard","mcb","rcd","rcbo","mccb","resistor","knx","plc","contactor","relay","motor","db","fuse","sensor","drive","auxiliary","isolator"]);
function canvasPhoto(){return "";}
function canvasDevice(c,d){
 const visuals=window.VoltProRealisticDevices,key=visuals?.kind?.(c.type,d.name);
 if(!physicalCanvasKinds.has(key))return symbol(c);
 const sizes=key==="arduino"?{x:-92,y:-137,w:184,h:274}:key==="breadboard"?{x:-280,y:-137,w:560,h:274}:key==="resistor"?{x:-70,y:-34,w:140,h:68}:key==="motor"?{x:-70,y:-70,w:140,h:140}:{x:-56,y:-70,w:112,h:140};
 const url=visuals?.photoCatalog?.[key]?.url;
 const raw=visuals?.svg?.(c.type,d.name,c.id)||"";
 const inner=raw.replace(/^<svg\b[^>]*>/,"").replace(/<\/svg>\s*$/,"");
 const fallback='<svg class="physical-device-fallback" x="'+sizes.x+'" y="'+sizes.y+'" width="'+sizes.w+'" height="'+sizes.h+'" viewBox="0 0 128 150" preserveAspectRatio="xMidYMid meet" style="'+(url?"display:none":"")+'">'+inner+'</svg>';
 const photo=url?'<image class="physical-device-photo" href="'+esc(url)+'" x="'+sizes.x+'" y="'+sizes.y+'" width="'+sizes.w+'" height="'+sizes.h+'" preserveAspectRatio="xMidYMid meet" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'inline\\'"><title>'+esc(d.name||c.type)+' representative product photograph</title></image>':"";
 return '<g class="physical-device-face" aria-label="'+esc(d.name||c.type)+' physical device view">'+photo+fallback+'</g>';
}
function deviceLabelY(c,d){
 const key=window.VoltProRealisticDevices?.kind?.(c.type,d.name);
 if(key==="arduino")return 157;
 if(key==="breadboard")return 158;
 if(key==="resistor")return 48;
 if(key==="motor")return 86;
 return physicalCanvasKinds.has(key)?91:36;
}
function renderCanvas(){if(window.VoltProWiring)S.wires=S.wires.map((w,i)=>window.VoltProWiring.normalizeWire(w,i));comps.innerHTML=S.components.map(c=>{const d=compDef(c.type),pins=Array.from({length:d.pins},(_,i)=>{const p=pinLocalPos(c,i),circle='<circle class="pin '+(c.type==="breadboard-bb400"?'<rect class="component-hit" x="-285" y="-145" width="570" height="290" fill="transparent" pointer-events="all"/>':c.type==="arduino-uno-r3"?'<rect class="component-hit" x="-100" y="-145" width="200" height="300" fill="transparent" pointer-events="all"/>':physicalCanvasKinds.has(window.VoltProRealisticDevices?.kind?.(c.type,d.name))?'<rect class="component-hit" x="-82" y="-88" width="164" height="190" fill="transparent" pointer-events="all"/>':'<rect class="component-hit" x="-64" y="-30" width="128" height="64" fill="transparent" pointer-events="all"/>')+''+canvasDevice(c,d)+(c.type==="breadboard-bb400"?'<text y="158" text-anchor="middle">BB400 Solderless Breadboard</text><text class="value" y="174" text-anchor="middle">400 tie points · 5-hole strips</text>':c.type==="arduino-uno-r3"?'<text y="160" text-anchor="middle">Arduino Uno R3</text><text class="value" y="176" text-anchor="middle">5 V logic · digital / analog / ICSP</text>':'<text y="'+deviceLabelY(c,d)+'" text-anchor="middle">'+esc(d.name)+'</text><text class="value" y="'+(deviceLabelY(c,d)+16)+'" text-anchor="middle">'+esc(valueText(c))+'</text>')+pins+'</g>'}).join("");
comps.querySelectorAll(".component[data-id]").forEach(g=>{g.onclick=e=>{if(e.target.classList.contains("pin"))return;e.stopPropagation();S.selected=g.dataset.id;S.selectedWireId=null;$$( ".component").forEach(el=>el.classList.toggle("selected",el.dataset.id===S.selected));renderInspector()};g.onpointerdown=e=>{if(e.target.classList.contains("pin")||e.button!==0)return;e.preventDefault();e.stopPropagation();const id=g.dataset.id;if(wiring?.active)wiring.cancel();S.selected=id;S.selectedWireId=null;$$(".component").forEach(el=>el.classList.toggle("selected",el.dataset.id===S.selected));renderInspector();const c=S.components.find(x=>x.id===id);if(!c)return;saveHistory();dragging={id,start:posFromEvent(e),orig:{...c},pointerId:e.pointerId,moved:false};try{svg.setPointerCapture(e.pointerId)}catch(_){};};g.ondblclick=e=>{e.stopPropagation();S.selected=g.dataset.id;S.selectedWireId=null;renderInspector();const el=document.querySelector("#inspectorBody input[data-prop], #inspectorBody select[data-prop]");if(el)el.focus();};});
 $$(".pin").forEach(p=>p.onpointerdown=e=>{e.stopPropagation();e.preventDefault();dragWire={start:p.dataset.pin,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};handlePin(p.dataset.pin)});
applyViewport();renderWires();}
function applyViewport(){const t="translate("+S.pan.x+" "+S.pan.y+") scale("+S.zoom+")";[comps,wires,labels,selg,$("#gridRect")].forEach(el=>{if(el)el.setAttribute("transform",t)});}
function renderWires(){
 wires.innerHTML=S.wires.map((w,i)=>{
  const a=getPin(w.a),b=getPin(w.b);if(!a||!b)return "";
  const route=window.VoltProWiring?window.VoltProWiring.routeOrthogonal(a,b,{grid:S.grid,bends:w.bends}):{points:[a,b]};
  const d=route.points.map((p,j)=>(j?"L":"M")+p.x+" "+p.y).join(" ");
  const color=/^#[0-9a-f]{6}$/i.test(w.color||"")?w.color:"#65d8ff";
  const width=Math.max(1,Math.min(10,Number(w.width)||2.5));
  const dash=w.pattern==="dashed"?"8 5":w.pattern==="dotted"?"2 5":"";
  const junctions=(w.junctions||[]).map(j=>'<circle class="wire-junction" cx="'+Number(j.x)+'" cy="'+Number(j.y)+'" r="4" data-junction="'+esc(j.id||"")+'"/>').join("");
  const handles=S.selectedWireId===w.id?(w.bends||[]).map((p,j)=>'<circle class="wire-bend-handle" data-wire-bend="'+esc(w.id)+":"+j+'" cx="'+Number(p.x)+'" cy="'+Number(p.y)+'" r="5"/>').join(""):"";
  return '<g class="wire-group '+(S.selectedWireId===w.id?"selected":"")+'"><path class="wire '+(S.running&&isLiveWire(w)?"live ":"")+(S.selectedWireId===w.id?"selected":"")+'" data-wire="'+esc(w.id)+'" d="'+d+'" style="stroke:'+color+';stroke-width:'+width+';'+(dash?"stroke-dasharray:"+dash+";":"")+'"/>'+junctions+handles+'</g>';
 }).join("");
 if(S.wiringMode&&S.wireStart&&S.wirePointer){const a=getPin(S.wireStart);if(a){const route=window.VoltProWiring.routeOrthogonal(a,S.wirePointer,{grid:S.grid});wires.insertAdjacentHTML("beforeend",'<path class="wire-preview" d="'+route.points.map((p,j)=>(j?"L":"M")+p.x+" "+p.y).join(" ")+'"/>')}}
 $$(".wire-bend-handle").forEach(el=>el.onpointerdown=e=>{e.stopPropagation();e.preventDefault();const parts=el.dataset.wireBend.split(":");wireBending={id:parts[0],index:Number(parts[1])};saveHistory()});
 $$("[data-wire]").forEach(el=>{
  el.onclick=e=>{e.stopPropagation();const id=el.dataset.wire;if(wiring)wiring.selectWire(id);else{S.selectedWireId=id;S.selected=null;renderCanvas();renderInspector()}log("WIRE "+id+" selected")};
  el.ondblclick=e=>{e.stopPropagation();const wire=S.wires.find(x=>x.id===el.dataset.wire);if(!wire)return;saveHistory();const p=posFromEvent(e),point={x:snap(p.x),y:snap(p.y)};if(e.shiftKey){const existing=S.wires.filter(x=>x!==wire).flatMap(x=>x.junctions||[]).find(j=>Math.abs(Number(j.x)-point.x)<=1&&Math.abs(Number(j.y)-point.y)<=1);const junctionId=existing?.id||"J"+uid();wire.junctions=wire.junctions||[];wire.junctions.push({id:junctionId,x:point.x,y:point.y});wire.bends=wire.bends||[];wire.bends.push(point);render();log("EXPLICIT JUNCTION "+junctionId+" added. Shift-double-click another wire at this point to join it electrically")}else{wire.bends=wire.bends||[];wire.bends.push(point);S.selectedWireId=wire.id;S.selected=null;render();log("WIRE "+wire.id+" bend added. Select it and edit its properties in the inspector.")}};
 });
}
function valueText(c){const p=c.props;if(c.type==="contactor")return (p.closed?"ON":"OFF")+" · "+(p.coilVoltage||0)+" V · "+(p.mainPoles||0)+"P";if(c.type==="relay")return (p.closed?"ON":"OFF")+" · "+(p.coilVoltage||0)+" V";if(c.type==="resistor")return (p.resistance||0)+" Ω";if(c.type==="battery"||c.type==="acsource")return (p.voltage||0)+" V";if(c.type==="fuse"||c.type==="breaker")return (p.rating||0)+" A";if(c.type==="switch")return p.closed?"CLOSED":"OPEN";return p.label||""}
function getPin(ref){const [id,ix]=ref.split(":");const c=S.components.find(x=>x.id===id);return c?pinPos(c,+ix):null}
function handlePin(ref){const p=getPin(ref);if(!wiring){S.selected=ref.split(":")[0];renderCanvas();renderInspector();return}if(!wiring.active)wiring.begin();wiring.selectTerminal(ref,p)}
function isClosed(c){return c.type!=="switch"||!!c.props.closed}
function resistance(c){const p=c.props;if(c.type==="resistor")return Math.max(.001,+p.resistance||1);if(c.type==="lamp"||c.type==="motor"||c.type==="heater"||c.type==="buzzer")return Math.max(.001,+p.resistance||100);if(c.type==="led"||c.type==="diode"||c.type==="zener")return Math.max(1,+p.resistance||330);if(c.type==="switch")return isClosed(c)?.01:Infinity;if(c.type==="fuse"||c.type==="breaker"||c.type==="rcd")return 0.05;if(c.type==="contactor"||c.type==="relay")return Math.max(.01,+p.coilResistance||100);const d=compDef(c.type);if(d.registryId&&typeof d.res==="number")return Math.max(.001,d.res);return Infinity}
function electricalWires(){return window.VoltProWiring?window.VoltProWiring.electricalWires(S.wires):S.wires}
function solve(){const connectedWires=electricalWires();const src=S.components.find(c=>c.type==="battery"||c.type==="acsource");if(!src)return {voltage:0,current:0,loads:[]};const active=S.components.filter(c=>{const d=compDef(c.type);return ["resistor","lamp","led","motor","heater","buzzer","diode","zener","switch","fuse","breaker","rcd","relay","contactor"].includes(c.type)||(d.registryId&&typeof d.res==="number");}).filter(isClosed);const adj=new Map();connectedWires.forEach(w=>{const [a]=w.a.split(":"),[b]=w.b.split(":");if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a)});
 const srcPins=connectedWires.filter(w=>w.a.startsWith(src.id+":")||w.b.startsWith(src.id+":"));if(srcPins.length<2)return {voltage:+src.props.voltage||0,current:0,loads:[]};
 const nodes=new Map();let n=0;function nodeOf(pin){const [id]=pin.split(":");if(!nodes.has(id))nodes.set(id,n++);return nodes.get(id)}
 connectedWires.forEach(w=>{nodeOf(w.a);nodeOf(w.b)});let plus=null,minus=null;for(const w of connectedWires){if(w.a.startsWith(src.id+":0"))plus=nodeOf(w.b);if(w.b.startsWith(src.id+":0"))plus=nodeOf(w.a);if(w.a.startsWith(src.id+":1"))minus=nodeOf(w.b);if(w.b.startsWith(src.id+":1"))minus=nodeOf(w.a)}if(plus===null||minus===null)return {voltage:+src.props.voltage||0,current:0,loads:[]};
 const V=+src.props.voltage||12;const R=[];for(const c of active){const ps=connectedWires.filter(w=>w.a.startsWith(c.id+":")||w.b.startsWith(c.id+":"));if(ps.length<2)continue;const na=ps[0].a.startsWith(c.id)?nodeOf(ps[0].b):nodeOf(ps[0].a);const nb=ps[1].a.startsWith(c.id)?nodeOf(ps[1].b):nodeOf(ps[1].a);R.push({c,na,nb,r:resistance(c)})}
 let series=0;for(const x of R)series+=x.r;const current=series>0?V/series:0;return {voltage:V,current,loads:R.map(x=>({id:x.c.id,name:compDef(x.c.type).name,current:current,resistance:x.r}))}
}
function solverProject(){return {components:S.components.map(c=>({...c,pins:Array.from({length:compDef(c.type).pins},(_,i)=>c.id+":"+i)})),wires:electricalWires()}}
let simulationInterval=null;
function solveSimulationTick(continuous=false){
 const visualSignature=()=>JSON.stringify(S.components.map(c=>({id:c.id,energized:c.state?.energized,tripped:c.state?.tripped,transferSource:c.state?.transferSource,Q0:c.state?.Q0,Q1:c.state?.Q1,Q2:c.state?.Q2,Q3:c.state?.Q3,pins:Object.fromEntries(Object.entries(c.state?.pins||{}).filter(([,p])=>p.mode==="OUTPUT").map(([k,p])=>[k,p.voltage]))}))),visualBefore=visualSignature();
 const project=solverProject();
 let r;
 if(window.VoltProEngine){
   r=VoltProEngine.analyze(project,{dc:{scanTimeMs:250},transient:{duration:.1,steps:40},ac:{frequency:50,points:1,scanTimeMs:250}});
 } else {
   r={dc:solve()};
 }
 const phaseSource=project.components.find(c=>c.type==="threephase"),phasor=r.ac?.ok?r.ac.sweep?.[0]:null;
 const dc=phaseSource?(phasor?.branches?{...phasor,ok:true,analysis:"Three-phase AC operating point (MNA)",engine:"VoltPRo MNA",sourceVoltage:Number(phaseSource.props?.lineVoltage??phaseSource.props?.voltage)||400,totalCurrent:(phasor.sourceCurrents||[]).filter(x=>x.id===phaseSource.id).reduce((sum,x)=>sum+x.current,0)/3,totalPower:phasor.totalPower||0,nodes:phasor.nodeVoltages?.length||0,branches:phasor.branches,sourceCurrents:phasor.sourceCurrents,nodeVoltages:phasor.nodeVoltages,threePhase:true}:{ok:false,error:r.ac?.error||"Three-phase AC analysis failed."}):(r.dc||r);
 if(!dc.ok){S.running=false;if(simulationInterval){clearInterval(simulationInterval);simulationInterval=null}S.lastAnalysis=null;S.lastAnalysisSignature="";$("#meterReadout").textContent="--";$("#console").textContent="RUN ERROR\\n"+(dc.error||"Unable to solve circuit.");$("#calcPanel").textContent="Check source, connections and component values.";renderCanvas();syncRunControls("error");return}
 for(const [id,deviceState] of Object.entries(dc.deviceStates||{})){const component=S.components.find(c=>c.id===id);if(component){const patch=deviceState&&typeof deviceState==="object"?deviceState:{energized:Boolean(deviceState)};component.state={...(component.state||{}),...patch}}}
 S.lastAnalysis=dc;S.lastAnalysisSignature=JSON.stringify(solverProject());
 const amps=Number(dc.totalCurrent)||0;
 $("#meterReadout").textContent=amps.toFixed(4)+" A";
 $("#console").textContent="VOLTPro Engine v3\\nAnalysis: "+(dc.analysis||"DC operating point")+"\\nSource: "+(dc.sourceVoltage||0)+" V\\nTotal current: "+amps.toFixed(4)+" A\\nTotal power: "+(Number(dc.totalPower)||0).toFixed(4)+" W\\nNodes: "+(dc.nodes||0)+"\\n";
 (dc.branches||[]).forEach(x=>$("#console").textContent+=x.name+" · "+(Number(x.voltage)||0).toFixed(3)+" V · "+(Number(x.current)||0).toFixed(4)+" A · "+(Number(x.power)||0).toFixed(4)+" W\\n");
 $("#calcPanel").innerHTML="<b>DC operating point</b><br>Current: "+amps.toFixed(4)+" A<br>Power: "+(Number(dc.totalPower)||0).toFixed(4)+" W<br><small>Engine v3 · educational analysis</small>";
 if(!continuous||visualBefore!==visualSignature())renderCanvas();syncRunControls();if(!continuous)log("Engine v3 analysis complete.");
}
function run(){
 if(!S.running){S.running=true;syncRunControls()}
 solveSimulationTick(false);
 if(S.running&&!simulationInterval)simulationInterval=setInterval(()=>{if(S.running)solveSimulationTick(true);else{clearInterval(simulationInterval);simulationInterval=null}},250);
}
function stop(){S.running=false;if(simulationInterval){clearInterval(simulationInterval);simulationInterval=null}renderCanvas();syncRunControls()}
const AWG_MM2={24:0.205,22:0.326,20:0.518,18:0.823,16:1.31,14:2.08,12:3.31,10:5.26,8:8.37,6:13.3,4:21.2,2:33.6};
const METRIC_WIRE_SIZES=["0.5","0.75","1","1.5","2.5","4","6","10","16","25","35"];
function nearestAwg(size){const target=Number(size)||1.5;return Object.keys(AWG_MM2).reduce((best,g)=>Math.abs(AWG_MM2[g]-target)<Math.abs(AWG_MM2[best]-target)?g:best,"16")}
function nearestMetricSize(gauge){const target=AWG_MM2[Number(gauge)]||1.31;return METRIC_WIRE_SIZES.reduce((best,size)=>Math.abs(Number(size)-target)<Math.abs(Number(best)-target)?size:best,"1.5")}
function renderInspector(){
 const body=$("#inspectorBody"),wire=S.wires.find(w=>w.id===S.selectedWireId);
 if(wire){
  const wireType=wire.cableType||"standard",color=/^#[0-9a-f]{6}$/i.test(wire.color||"")?wire.color:"#65d8ff",width=Math.max(1,Math.min(10,Number(wire.width)||2.5)),size=String(wire.size||"1.5"),gauge=String(wire.gauge||nearestAwg(size)),pattern=wire.pattern||"solid";
  body.innerHTML='<div class="prop"><label>Selected object</label><input value="Wire '+esc(wire.id)+'" disabled></div><div class="prop"><label>Connection</label><input value="'+esc(wire.a)+' → '+esc(wire.b)+'" disabled></div><div class="prop"><label>Cable type</label><select data-wire-prop="cableType"><option value="standard" '+(wireType==="standard"?"selected":"")+' >Standard copper</option><option value="flexible" '+(wireType==="flexible"?"selected":"")+' >Flexible cable</option><option value="control" '+(wireType==="control"?"selected":"")+' >Control cable</option><option value="protective-earth" '+(wireType==="protective-earth"?"selected":"")+' >Protective earth</option><option value="neutral" '+(wireType==="neutral"?"selected":"")+' >Neutral</option></select></div><div class="prop"><label>Wire colour</label><input data-wire-prop="color" type="color" value="'+color+'"></div><div class="prop"><label>Wire gauge (AWG reference, approximate)</label><select data-wire-prop="gauge">'+[24,22,20,18,16,14,12,10,8,6,4,2].map(v=>'<option value="'+v+'" '+(gauge===String(v)?"selected":"")+' >AWG '+v+' · '+AWG_MM2[v]+' mm² nominal</option>').join("")+'</select></div><div class="prop"><label>Cable cross-section</label><select data-wire-prop="size">'+METRIC_WIRE_SIZES.map(v=>'<option value="'+v+'" '+(size===v?"selected":"")+' >'+v+' mm²</option>').join("")+'</select></div><div class="prop"><label>Visual line width</label><input data-wire-prop="width" type="number" min="1" max="10" step="0.5" value="'+width+'"><small class="wire-prop-note">Drawing thickness only. It does not calculate current capacity or electrical safety.</small></div><div class="prop"><label>Line pattern</label><select data-wire-prop="pattern"><option value="solid" '+(pattern==="solid"?"selected":"")+' >Solid</option><option value="dashed" '+(pattern==="dashed"?"selected":"")+' >Dashed</option><option value="dotted" '+(pattern==="dotted"?"selected":"")+' >Dotted</option></select></div><div class="prop-row"><button class="ins-btn" id="addBendBtn">Add bend at wire midpoint</button><button class="ins-btn" id="resetWireBtn">Reset route</button></div><button class="ins-btn" id="removeWireBtn" style="margin-top:7px;color:#ff8c96">Delete wire</button>';
  $$("[data-wire-prop]").forEach(el=>el.onchange=()=>{saveHistory();const prop=el.dataset.wireProp;let v=el.value;if(prop==="width")v=Math.max(1,Math.min(10,Number(v)||2.5));if(prop==="gauge"){wire.gauge=String(v);wire.size=nearestMetricSize(v)}else if(prop==="size"){wire.size=String(v);wire.gauge=String(nearestAwg(v))}else{wire[prop]=v}if(prop==="cableType"){const defaults={standard:"#65d8ff",flexible:"#ffbd69",control:"#b99cff","protective-earth":"#61df9a",neutral:"#8aa8ff"};wire.color=defaults[v]||wire.color;}renderCanvas();renderInspector()});
  $("#addBendBtn").onclick=()=>{saveHistory();const a=getPin(wire.a),b=getPin(wire.b);if(!a||!b)return;wire.bends=wire.bends||[];wire.bends.push({x:snap((a.x+b.x)/2),y:snap((a.y+b.y)/2)});render()};
  $("#resetWireBtn").onclick=()=>{saveHistory();wire.bends=[];render()};$("#removeWireBtn").onclick=()=>deleteWire(wire.id);return;
 }
 const c=S.components.find(x=>x.id===S.selected);
 if(!c){body.innerHTML='<div class="empty">Select any component on the canvas to edit its parameters. Components remain in the project when you select another one. Click any component again to return to its settings.</div>';return}
 const d=compDef(c.type),meta=window.VoltProRegistry?.get?.(c.type),unsupported=Boolean(d.unsupported||(!defs[c.type]&&!meta)),terminalCount=meta?.terminals?.length||d.pins||0,modelStatus=meta?.electricalModel?.type||(c.type==="arduino-uno-r3"?"pin map only — firmware execution not modelled":c.type==="breadboard-bb400"?"400-hole passive connection matrix":c.type==="abb-aux-cb-11"?"ABB AUX-CB-11 · 1NO + 3NC contact map":unsupported?"unsupported — no model registered":defs[c.type]?"legacy educational model":"catalogue metadata only"),schema=meta?.parameters||{},keys=[...new Set([...Object.keys(schema),...Object.keys(c.props||{})])];
 const fields=keys.map(k=>{const spec=schema[k]||{},v=c.props?.[k]??spec.default??"",label=spec.label||k.replace(/([A-Z])/g," $1").replace(/^./,m=>m.toUpperCase()),opts=Array.isArray(spec.options)?'<select data-prop="'+esc(k)+'">'+spec.options.map(o=>'<option '+(String(o)===String(v)?'selected':'')+'>'+esc(o)+'</option>').join("")+"</select>":'<input data-prop="'+esc(k)+'" type="'+(spec.type==="number"||typeof v==="number"?"number":"text")+'" value="'+esc(v)+'">';return '<div class="prop"><label>'+esc(label)+(spec.unit?" <small>("+esc(spec.unit)+")</small>":"")+"</label>"+opts+"</div>"}).join("");
 body.innerHTML='<div class="prop"><label>Component</label><input value="'+esc(d.name)+'" disabled></div><div class="prop"><label>Component ID</label><input value="'+esc(c.id)+'" disabled></div><div class="prop"><label>Terminals</label><input value="'+terminalCount+'" disabled></div><div class="prop"><label>Model status</label><input value="'+esc(modelStatus)+'" disabled></div>'+(unsupported?'<div class="prop inspector-warning" role="alert"><b>Unsupported component</b><p>No supported model is registered for this type. The simulator will not approximate it as a resistor. Replace it with a supported device before relying on electrical results.</p></div>':'')+fields+'<div class="prop-row"><button class="ins-btn" id="rotateBtn">Rotate</button><button class="ins-btn" id="duplicateBtn">Duplicate</button></div><button class="ins-btn" id="removeBtn" style="margin-top:7px;color:#ff8c96">Delete component</button>';
 $$("[data-prop]").forEach(el=>el.onchange=()=>{saveHistory();const spec=schema[el.dataset.prop]||{};let v=el.value;if(el.type==="number")v=Number(v);c.props[el.dataset.prop]=v;render()});
 $("#rotateBtn").onclick=()=>{saveHistory();c.rotation=(c.rotation+90)%360;render()};
 $("#duplicateBtn").onclick=()=>{saveHistory();const n={...JSON.parse(JSON.stringify(c)),id:uid(),x:c.x+S.grid,y:c.y+S.grid};S.components.push(n);S.selected=n.id;S.selectedWireId=null;render()};
 $("#removeBtn").onclick=()=>{saveHistory();S.components=S.components.filter(x=>x.id!==c.id);S.wires=S.wires.filter(w=>!w.a.startsWith(c.id+":")&&!w.b.startsWith(c.id+":"));S.selected=null;render()};
}
function deleteWire(id){const index=S.wires.findIndex(w=>w.id===id);if(index<0)return false;saveHistory();const removed=S.wires[index];S.wires.splice(index,1);S.selectedWireId=null;if(wiring)wiring.selectWire(null);render();log("WIRE DELETED "+removed.id+" · "+removed.a+" → "+removed.b);return true}
function clearProject(){saveHistory();S.components=[];S.wires=[];S.panel=window.VoltProPanel?.create?.();S.selected=null;S.selectedWireId=null;if(wiring)wiring.cancel();stop();render()}
function demoMotor(){saveHistory();S.components=[];S.wires=[];const add=(type,x,y,props={})=>{const d=compDef(type),c={id:uid(),type,x,y,rotation:0,props:{...JSON.parse(JSON.stringify(d.props)),...props},pins:[]};S.components.push(c);return c};const v=add("threephase",170,260,{voltage:400}),k=add("contactor",380,260,{closed:1}),m=add("motor",600,260,{resistance:32}),pe=add("ground",600,380);S.wires=[{a:v.id+":0",b:k.id+":2"},{a:v.id+":1",b:k.id+":4"},{a:v.id+":2",b:k.id+":6"},{a:k.id+":3",b:m.id+":0"},{a:k.id+":5",b:m.id+":1"},{a:k.id+":7",b:m.id+":2"},{a:pe.id+":0",b:m.id+":6"}];S.selected=m.id;render();log("MOTOR STARTER topology loaded: phases route through the three contactor poles to U1/V1/W1, with PE shown. Motor winding-end links (U2/V2/W2) must be configured from the nameplate; this incomplete educational draft is not auto-simulated.");}
function demoLogic(){saveHistory();S.components=[];S.wires=[];const add=(type,x,y)=>{const d=compDef(type),c={id:uid(),type,x,y,rotation:0,props:JSON.parse(JSON.stringify(d.props)),pins:[]};S.components.push(c);return c};const a=add("gpio",180,220),b=add("gpio",180,320),g=add("logic_and",380,270),o=add("gpio",580,270);S.wires=[{a:a.id+":0",b:g.id+":0"},{a:b.id+":0",b:g.id+":1"},{a:g.id+":2",b:o.id+":0"}];S.selected=g.id;render();log("LOGIC LAB demo loaded: GPIO + GPIO → AND → GPIO.");}
function exportSVG(){const clone=svg.cloneNode(true);clone.querySelectorAll("#gridRect").forEach(x=>x.remove());clone.setAttribute("xmlns","http://www.w3.org/2000/svg");const data=new XMLSerializer().serializeToString(clone);download("voltpro-schematic.svg",data,"image/svg+xml")}
function serialize(){return JSON.stringify({format:"voltpro",version:2,metadata:{name:"VoltPRo project",created:new Date().toISOString()},mode:S.mode,components:S.components,wires:S.wires,wireStyle:{...S.wireStyle},panel:window.VoltProPanel?.create?.(S.panel||{}),simulation:{running:false}},null,2)}
function download(name,data,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function loadProject(data){
 await window.VoltProRegistry?.ready;
 const input=typeof data==="string"?JSON.parse(data):data;
 const x=window.VoltProProject?.toLegacy?window.VoltProProject.toLegacy(input):input;
 if(!x||x.format!=="voltpro")throw Error("Not a supported .voltpro project");
 const components=Array.isArray(x.components)?x.components:[];
 const ids=new Set();
 for(const c of components){if(!c.id||ids.has(String(c.id)))throw Error("Project contains a missing or duplicate component ID: "+String(c.id||"(empty)"));ids.add(String(c.id))}
 S.components=components.map(c=>({...c,x:Number(c.x??c.position?.x??0),y:Number(c.y??c.position?.y??0),rotation:Number(c.rotation||0),props:structuredClone(c.props||c.parameters||{}),pins:Array.isArray(c.pins)?c.pins:[]}));
 S.wires=Array.isArray(x.wires)?x.wires.map((w,i)=>window.VoltProWiring?window.VoltProWiring.normalizeWire(w,i):w):[];
 if(x.wireStyle&&typeof x.wireStyle==="object"){
  const style=x.wireStyle;
  if(/^#[0-9a-f]{6}$/i.test(style.color||""))S.wireStyle.color=style.color;
  if(Object.prototype.hasOwnProperty.call(wireTypeColors,style.cableType))S.wireStyle.cableType=style.cableType;
  if(METRIC_WIRE_SIZES.includes(String(style.size)))S.wireStyle.size=String(style.size);
  if(Object.prototype.hasOwnProperty.call(AWG_MM2,String(style.gauge)))S.wireStyle.gauge=String(style.gauge);
  if(Number.isFinite(Number(style.width)))S.wireStyle.width=Math.max(1,Math.min(10,Number(style.width)));
 }
 S.mode=["schematic","panel","plc","micro","reference"].includes(x.mode)?x.mode:"schematic";
 S.panel=window.VoltProPanel?.create?.(x.panel||{});
 S.selected=null;S.selectedWireId=null;
 $$(".mode").forEach(b=>{const active=b.dataset.mode===S.mode;b.classList.toggle("active",active)});
 syncWireMenu();render();window.VoltProRealisticDevices?.update?.();
 log("PROJECT LOADED · "+S.components.length+" devices · "+S.wires.length+" wires");
}
svg.addEventListener("dragover",e=>e.preventDefault());svg.addEventListener("drop",e=>{e.preventDefault();const t=e.dataTransfer.getData("text/plain");if(t){if(wiring?.active)wiring.cancel();const p=posFromEvent(e);addComponent(t,p.x,p.y)}});svg.addEventListener("contextmenu",e=>{e.preventDefault();if(wiring?.active)wiring.cancel();});svg.addEventListener("click",e=>{if(e.target===svg||e.target.id==="gridRect"){if(wiring?.active)wiring.cancel();S.selected=null;S.selectedWireId=null;renderInspector();renderCanvas();}});svg.addEventListener("pointermove",e=>{const p=posFromEvent(e);if(dragWire&&dragWire.pointerId===e.pointerId&&Math.hypot(e.clientX-dragWire.startX,e.clientY-dragWire.startY)>5)dragWire.moved=true;if(wiring&&wiring.active&&wiring.start)wiring.pointerMove(p);if(wireBending){const wire=S.wires.find(w=>w.id===wireBending.id);if(wire){wire.bends=wire.bends||[];wire.bends[wireBending.index]={x:snap(p.x),y:snap(p.y)};renderWires()}return}if(!dragging||dragging.pointerId!==e.pointerId)return;const c=S.components.find(x=>x.id===dragging.id);if(!c)return;const dx=p.x-dragging.start.x,dy=p.y-dragging.start.y;if(Math.abs(dx)+Math.abs(dy)>1)dragging.moved=true;c.x=snap(dragging.orig.x+dx);c.y=snap(dragging.orig.y+dy);if(dragFrame)return;dragFrame=requestAnimationFrame(()=>{dragFrame=0;if(!dragging)return;const current=S.components.find(x=>x.id===dragging.id);if(!current)return;const el=comps.querySelector('[data-id="'+current.id+'"]');if(el)el.setAttribute("transform","translate("+current.x+","+current.y+") rotate("+current.rotation+")");renderWires();});});
window.addEventListener("pointerup",e=>{if(dragWire&&dragWire.pointerId===e.pointerId){const gesture=dragWire;dragWire=null;if(gesture.moved&&wiring?.active&&wiring.start){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest?.("[data-pin]");if(target&&target.dataset.pin!==gesture.start)handlePin(target.dataset.pin);else if(!target)wiring.cancel()}}if(wireBending){wireBending=null;render();return}if(dragging&&dragging.pointerId===e.pointerId){if(dragFrame){cancelAnimationFrame(dragFrame);dragFrame=0}dragging=null;render()}});window.addEventListener("pointercancel",e=>{if(dragWire&&dragWire.pointerId===e.pointerId){dragWire=null;if(wiring?.active)wiring.cancel()}if(dragging&&dragging.pointerId===e.pointerId){dragging=null;render()}});svg.addEventListener("wheel",e=>{e.preventDefault();S.zoom=Math.max(.35,Math.min(2.5,S.zoom*(e.deltaY<0?1.1:.9)));render()},{passive:false});
$("#componentSearch").oninput=e=>{search=e.target.value;clearTimeout(paletteSearchTimer);paletteSearchTimer=setTimeout(renderPalette,120)};$("#runBtn").onclick=run;$("#stopBtn").onclick=stop;$("#newBtn").onclick=()=>{if(confirm("Start a new project?")){saveHistory();S.components=[];S.wires=[];S.panel=window.VoltProPanel?.create?.();S.selected=null;render();}};$("#saveBtn").onclick=()=>{localStorage.setItem("voltpro-project",serialize());toast("Project saved locally")};$("#loadBtn").onclick=()=>$("#fileInput").click();$("#fileInput").onchange=e=>{const f=e.target.files[0];if(f)f.text().then(loadProject).catch(x=>alert(x.message))};$("#exportBtn").onclick=()=>download("voltpro-project.voltpro",serialize(),"application/json");$("#deleteBtn").onclick=()=>{if(S.selectedWireId){deleteWire(S.selectedWireId);return}if(S.selected)$("#removeBtn").click()};
const wireMenu=$("#wireMenu"),wireTool=document.querySelector(".wire-tool"),wireColor=$("#wireColor"),wireCableType=$("#wireCableType"),wireSize=$("#wireSize"),wireGauge=$("#wireGauge"),startWireBtn=$("#startWireBtn");
const wireTypeColors={standard:"#65d8ff",flexible:"#ffbd69",control:"#b99cff","protective-earth":"#61df9a",neutral:"#8aa8ff"};
function syncWireMenu(){
 if(!wireMenu)return;
 if(wireColor)wireColor.value=S.wireStyle.color;
 if(wireCableType)wireCableType.value=S.wireStyle.cableType;
 if(wireSize)wireSize.value=S.wireStyle.size;
 if(wireGauge)wireGauge.value=S.wireStyle.gauge;
 if(startWireBtn){startWireBtn.textContent=wiring?.active?"Cancel wire drawing":"Start drawing wires";startWireBtn.setAttribute("aria-pressed",String(Boolean(wiring?.active)))}
}
function setWireMenu(open){
 if(!wireMenu)return;
 const isOpen=Boolean(open);
 wireMenu.hidden=!isOpen;
 ["#wireBtn","#wireMenuBtn"].forEach(q=>{const b=$(q);if(b)b.setAttribute("aria-expanded",String(isOpen))});
 if(isOpen){
  const anchor=$("#wireMenuBtn")?.getBoundingClientRect();
  if(anchor){
   const menuWidth=Math.min(300,window.innerWidth-16);
   const menuHeight=Math.min(560,window.innerHeight-24);
   wireMenu.style.left=Math.max(8,Math.min(anchor.left,window.innerWidth-menuWidth-8))+"px";
   wireMenu.style.top=Math.max(8,Math.min(anchor.bottom+8,window.innerHeight-menuHeight-8))+"px";
   wireMenu.style.width=menuWidth+"px";
   wireMenu.style.maxHeight=menuHeight+"px";
  }
  syncWireMenu();
 }
}
function toggleWireDrawing(){
 if(wiring){if(wiring.active)wiring.cancel();else wiring.begin();}
 else {S.wiringMode=!S.wiringMode;S.wireStart=null;renderCanvas();}
 setWireMenu(false);
 syncWireMenu();
}
// The main Wire button starts/cancels drawing; the arrow opens wire settings.
const wireButton=$("#wireBtn"),wireMenuButton=$("#wireMenuBtn");
if(wireButton)wireButton.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();toggleWireDrawing()});
if(wireMenuButton)wireMenuButton.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();setWireMenu(wireMenu?.hidden)});
document.addEventListener("click",e=>{if(wireTool&&!wireTool.contains(e.target))setWireMenu(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&wireMenu&&!wireMenu.hidden){setWireMenu(false)}});
if(wireColor)wireColor.addEventListener("input",()=>{S.wireStyle.color=wireColor.value});
if(wireCableType)wireCableType.addEventListener("change",()=>{S.wireStyle.cableType=wireCableType.value;S.wireStyle.color=wireTypeColors[wireCableType.value]||S.wireStyle.color;syncWireMenu()});
if(wireSize)wireSize.addEventListener("change",()=>{S.wireStyle.size=wireSize.value;S.wireStyle.gauge=String(nearestAwg(wireSize.value));syncWireMenu()});
if(wireGauge)wireGauge.addEventListener("change",()=>{S.wireStyle.gauge=wireGauge.value;S.wireStyle.size=nearestMetricSize(wireGauge.value);syncWireMenu()});
if(startWireBtn)startWireBtn.addEventListener("click",toggleWireDrawing);$("#undoBtn").onclick=()=>{if(S.history.length){S.future.push(JSON.stringify({components:S.components,wires:S.wires,panel:S.panel||null}));restore(S.history.pop())}};$("#redoBtn").onclick=()=>{if(S.future.length){S.history.push(JSON.stringify({components:S.components,wires:S.wires,panel:S.panel||null}));restore(S.future.pop())}};$("#fitBtn").onclick=()=>{S.zoom=1;S.pan={x:0,y:0};render()};$("#zoomIn").onclick=()=>{S.zoom=Math.min(2.5,S.zoom*1.15);render()};$("#zoomOut").onclick=()=>{S.zoom=Math.max(.35,S.zoom/1.15);render()};
$("[data-meter]").forEach(b=>b.onclick=()=>{
 S.meter=b.dataset.meter;
 const project=solverProject(),signature=JSON.stringify(project);
 let result=signature===S.lastAnalysisSignature?S.lastAnalysis:null;
 if(!result?.ok){result=window.VoltProEngine?.dc(project);if(result?.ok){S.lastAnalysis=result;S.lastAnalysisSignature=signature}}
 if(!result?.ok){$("#meterReadout").textContent="--";$("#console").textContent="METER ERROR\\n"+(result?.error||"Run the circuit and check its connections first.");return}
 const selected=S.components.find(c=>c.id===S.selected);
 const candidates=selected?(result.branches||[]).filter(x=>x.id===selected.id):[];
 const branch=candidates.find(x=>x.contactId==="coil")||candidates.find(x=>!x.contactId)||candidates[0]||null;
 const sourceSelected=selected?.type==="threephase";
 if(selected&&!branch&&!sourceSelected){$("#meterReadout").textContent="NO BRANCH";return}
 const api=window.VoltProMeasurement;
 const args=branch?{branchId:branch.id,contactId:branch.contactId}:{};
 const sourceCurrent=Number(result.sourceCurrents?.[0]?.current)||0,sourceVoltage=Number(result.sourceVoltage)||0;
 const measured=(type,fallback)=>api?.measure?api.measure(type,result,args):fallback;
 let value,display;
 if(S.meter==="voltage"){value=branch?measured("voltage",branch.voltage):sourceVoltage;display=(Number(value)||0).toFixed(2)+" V"}
 else if(S.meter==="current"){value=branch?measured("current",branch.current):sourceSelected?(result.sourceCurrents||[]).filter(x=>x.id===selected.id).reduce((sum,x)=>sum+Math.abs(Number(x.current)||0),0)/3:Math.abs(sourceCurrent);display=(Number(value)||0).toFixed(3)+" A"}
 else if(S.meter==="resistance"){value=branch?measured("resistance",Math.abs(branch.current)>1e-12?Math.abs(branch.voltage/branch.current):Infinity):(Math.abs(sourceCurrent)>1e-12?Math.abs((sourceSelected?sourceVoltage/Math.sqrt(3):sourceVoltage)/sourceCurrent):Infinity);display=Number.isFinite(value)?value.toFixed(1)+" Ω":"∞ Ω"}
 else if(!branch){display="SELECT PART"}
 else {value=measured("continuity",Math.abs(branch.current)>1e-12&&Math.abs(branch.voltage/branch.current)<=.1);display=value?"PASS":"OPEN"}
 $("#meterReadout").textContent=display;
});
$$(".mode").forEach(b=>b.onclick=()=>{$$(".mode").forEach(x=>x.classList.remove("active"));b.classList.add("active");S.mode=b.dataset.mode;$("#engineInfo").textContent=b.dataset.mode==="micro"?"Microcontroller workspace · local educational engine":b.dataset.mode==="panel"?"Panel planning workspace · local educational engine":"DC educational engine · local-only"});
$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("voltpro-theme",document.body.classList.contains("light")?"light":"dark")};
function toast(m){const t=document.createElement("div");t.textContent=m;t.style="position:fixed;right:18px;bottom:45px;background:#12314a;border:1px solid #39647f;color:white;padding:9px 13px;border-radius:8px;z-index:99;font-size:11px";document.body.append(t);setTimeout(()=>t.remove(),1600)}
window.addEventListener("keydown",e=>{if(wiring&&wiring.handleKey(e))return;const target=e.target;const typing=target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));if(!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)&&S.selected&&!wiring?.active){const c=S.components.find(x=>x.id===S.selected);if(c){e.preventDefault();if(!e.repeat)saveHistory();const step=S.grid*(e.shiftKey?5:1);if(e.key==="ArrowUp")c.y-=step;if(e.key==="ArrowDown")c.y+=step;if(e.key==="ArrowLeft")c.x-=step;if(e.key==="ArrowRight")c.x+=step;c.x=snap(c.x);c.y=snap(c.y);render();return}}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();if(e.shiftKey)$("#redoBtn").click();else $("#undoBtn").click()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();$("#redoBtn").click()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();$("#saveBtn").click()}if(e.key==="Delete")$("#deleteBtn").click();});
window.addEventListener("voltpro-registry-ready",()=>{render();log("Component registry loaded: "+(window.VoltProRegistry?.count||0)+" catalog records.")});if(window.VoltProRegistry?.ready)window.VoltProRegistry.ready.then(()=>render());if(window.VoltProMedia?.ready)window.VoltProMedia.ready.then(()=>renderPalette());if(localStorage.getItem("voltpro-theme")==="light")document.body.classList.add("light");window.VoltProUI={render,renderCanvas,renderPalette,renderInspector,addComponent,saveHistory,run,stop};const symbolStyleSelect=$("#symbolStyle");if(symbolStyleSelect){symbolStyleSelect.value=S.symbolStyle;symbolStyleSelect.onchange=()=>{S.symbolStyle=["iec","terminal-blocks","simplified"].includes(symbolStyleSelect.value)?symbolStyleSelect.value:"iec";localStorage.setItem("voltpro-symbol-style",S.symbolStyle);renderCanvas()}}renderPalette();render();bindExtraControls();const importParams=new URLSearchParams(location.search);if(importParams.get("libraryImport")==="1"){const pending=localStorage.getItem("voltpro-library-import");if(pending){try{loadProject(pending);localStorage.removeItem("voltpro-library-import");toast("Academy project loaded. Review the topology and component settings before running.");log("Academy project imported from the workbench.");}catch(err){toast("Academy project import failed: "+err.message);log("ACADEMY IMPORT ERROR: "+err.message);}}}log("Base simulation components: "+Object.keys(defs).length+" · catalog registry loads asynchronously.");
})();