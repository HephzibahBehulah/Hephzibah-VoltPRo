(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.VoltProCircuitPlanner=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const clone=value=>JSON.parse(JSON.stringify(value));
  const templates={
    "battery-resistor-lamp":{
      title:"Battery → resistor → lamp",
      description:"A simple DC series circuit with a current-limiting resistance and lamp load.",
      components:[
        {id:"B1",type:"battery",x:160,y:240,props:{voltage:12}},
        {id:"R1",type:"resistor",x:360,y:240,props:{resistance:100}},
        {id:"L1",type:"lamp",x:560,y:240,props:{resistance:120}}
      ],
      wires:[{id:"W1",a:"B1:0",b:"R1:0"},{id:"W2",a:"R1:1",b:"L1:0"},{id:"W3",a:"L1:1",b:"B1:1"}],
      warnings:["Educational DC example. Confirm component ratings before using real hardware."]
    },
    "battery-led-resistor":{
      title:"Battery → resistor → LED",
      description:"A low-voltage DC LED circuit with a series resistor.",
      components:[
        {id:"B1",type:"battery",x:160,y:240,props:{voltage:5}},
        {id:"R1",type:"resistor",x:360,y:240,props:{resistance:330}},
        {id:"D1",type:"led",x:560,y:240,props:{forward:2,resistance:330}}
      ],
      wires:[{id:"W1",a:"B1:0",b:"R1:0"},{id:"W2",a:"R1:1",b:"D1:0"},{id:"W3",a:"D1:1",b:"B1:1"}],
      warnings:["Educational example only. LED forward voltage and current limits depend on the specific part."]
    },
    "battery-switch-lamp":{
      title:"Battery → normally-open switch → lamp",
      description:"A simple DC circuit with a switch in series with a lamp load.",
      components:[
        {id:"B1",type:"battery",x:160,y:240,props:{voltage:12}},
        {id:"S1",type:"switch",x:350,y:240,props:{closed:0}},
        {id:"L1",type:"lamp",x:550,y:240,props:{resistance:120}}
      ],
      wires:[{id:"W1",a:"B1:0",b:"S1:0"},{id:"W2",a:"S1:1",b:"L1:0"},{id:"W3",a:"L1:1",b:"B1:1"}],
      warnings:["Educational DC example. The switch is initially open."]
    },
    "three-phase-breaker":{
      title:"Three-phase supply → three-pole circuit breaker",
      description:"A three-phase source connected phase-by-phase to the line terminals of a three-pole breaker.",
      components:[
        {id:"PS1",type:"threephase",x:180,y:240,props:{voltage:400}},
        {id:"QF1",type:"circuit-breaker-3p",x:420,y:240,props:{rating:16,poles:3}}
      ],
      wires:[{id:"W1",a:"PS1:0",b:"QF1:0"},{id:"W2",a:"PS1:1",b:"QF1:1"},{id:"W3",a:"PS1:2",b:"QF1:2"}],
      warnings:["This draft stops at the breaker load terminals. It is not a complete installation or protection study."]
    },
    "three-phase-motor-starter":{
      title:"Three-phase motor starter — topology draft",
      description:"Three-phase source, three-pole breaker, three-pole contactor, motor, 24 V control supply and normally-open start pushbutton.",
      components:[
        {id:"PS1",type:"threephase",x:150,y:220,props:{voltage:400}},
        {id:"QF1",type:"circuit-breaker-3p",x:330,y:220,props:{rating:16,poles:3}},
        {id:"KM1",type:"contactor",x:530,y:220,props:{coilVoltage:24,frequency:50,mainPoles:3,auxNO:1,auxNC:1,coilResistance:82,closed:0}},
        {id:"M1",type:"motor",x:740,y:220,props:{resistance:24}},
        {id:"CS1",type:"controlsource",x:330,y:410,props:{voltage:24}},
        {id:"PB1",type:"pushbutton-no",x:520,y:410,props:{pressed:0}}
      ],
      wires:[
        {id:"W1",a:"PS1:0",b:"QF1:0"},{id:"W2",a:"PS1:1",b:"QF1:1"},{id:"W3",a:"PS1:2",b:"QF1:2"},
        {id:"W4",a:"QF1:3",b:"KM1:2"},{id:"W5",a:"QF1:4",b:"KM1:4"},{id:"W6",a:"QF1:5",b:"KM1:6"},
        {id:"W7",a:"KM1:3",b:"M1:0"},{id:"W8",a:"KM1:5",b:"M1:1"},{id:"W9",a:"KM1:7",b:"M1:2"},
        {id:"W10",a:"CS1:0",b:"PB1:0"},{id:"W11",a:"PB1:1",b:"KM1:0"},{id:"W12",a:"KM1:1",b:"CS1:1"}
      ],
      warnings:[
        "Topology draft only. The active legacy solver does not yet simulate a certified three-phase motor-starter circuit.",
        "No overload relay, short-circuit coordination, PE conductor, emergency stop, seal-in/holding circuit or installation-specific protection study is included.",
        "Do not use this educational drawing as a construction or commissioning plan."
      ]
    }
  };
  function plan(prompt,previous){if(globalThis.VoltProAssistantEngineering&&/(?:three|3)[ -]?way/.test(String(prompt).toLowerCase())){const project=globalThis.VoltProAssistantEngineering.normalize(globalThis.VoltProAssistantEngineering.threeWay());return {recognized:true,title:project.metadata.name,description:project.metadata.objective,template:"three-way-switch",components:project.components,wires:project.wires,warnings:["Low-voltage SPDT teaching circuit; regional terminology differs."]};}
    const q=String(prompt||"").toLowerCase().replace(/[–—]/g,"-").trim();
    if(!q)return {recognized:false,error:"Enter a circuit description first.",components:[],wires:[],warnings:[]};
    if(previous&&previous.recognized){
      const updated=clone(previous);let changed=false;
      const voltageMatch=q.match(/\b(\d+(?:\.\d+)?)\s*v\b/);
      if(voltageMatch){
        const sources=updated.components.filter(c=>["battery","threephase","controlsource"].includes(c.type));
        const target=/\bcontrol\b/.test(q)?sources.find(c=>c.type==="controlsource"):(sources.length===1?sources[0]:null);
        if(target){target.props=target.props||{};target.props.voltage=Number(voltageMatch[1]);changed=true;}
      }
      const resistanceMatch=q.match(/\b(\d+(?:\.\d+)?)\s*(?:ohms?|Ω)/);
      if(resistanceMatch){
        const resistor=updated.components.find(c=>c.type==="resistor");
        if(resistor){resistor.props=resistor.props||{};resistor.props.resistance=Number(resistanceMatch[1]);changed=true;}
      }
      if(changed){updated.prompt=String(prompt);updated.followup=true;return updated;}
    }
    let key=null;
    if(/\b(motor starter|starter circuit)\b|\bcontactor\b.*\bmotor\b|\bmotor\b.*\bcontactor\b/.test(q))key="three-phase-motor-starter";
    else if((/\bthree[- ]phase\b|\b3[- ]phase\b|\b400\s*v\b/.test(q))&&/\b(breaker|mcb|protection)\b/.test(q))key="three-phase-breaker";
    else if(/\bled\b/.test(q)&&/\b(battery|resistor|circuit|light|power|build|make|create|design)\b/.test(q))key="battery-led-resistor";
    else if(/\b(switch|pushbutton)\b/.test(q)&&/\b(lamp|light|battery|circuit|build|make|create|design)\b/.test(q))key="battery-switch-lamp";
    else if(/\b(battery|resistor|lamp|light|simple dc|series circuit)\b/.test(q))key="battery-resistor-lamp";
    if(!key&&previous&&/\badd\b.*\bswitch\b/.test(q)&&previous.template==="battery-resistor-lamp")key="battery-switch-lamp";
    if(!key)return {recognized:false,error:"I could not safely map that request to a supported template. Try a low-voltage LED circuit, a switched lamp, a three-phase breaker, or a three-phase motor-starter topology draft.",components:[],wires:[],warnings:[]};
    const result=clone(templates[key]);
    result.template=key;result.recognized=true;result.prompt=String(prompt);
    result.components=result.components.map(c=>({...c,rotation:0,pins:[]}));
    result.wires=result.wires.map(w=>({...w}));
    return result;
  }
  function templatesList(){return Object.keys(templates).map(key=>({id:key,title:templates[key].title}));}
  return {plan,templates:templatesList};
});
