/* Reviewed teaching formulas with bounded parameter variants, not invented products. */
(function(root,factory){const api=factory();root.VoltProPractice=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const topics=['Ohm’s law','Series resistance','Parallel resistance','Voltage divider','Resistor power','Electrical energy','Capacitor charge','RC time constant','RC cutoff','Inductor energy','Transformer ratio','Single-phase power','Three-phase power','Motor efficiency','Voltage drop','Fuse loading','PLC timer','Sensor scaling','Solar conversion','Cooling energy'];
const tools=['Digital voltmeter','Digital ammeter','Ohmmeter','Clamp meter','Oscilloscope','Frequency counter','LCR meter','Wattmeter','Energy meter','Logic analyzer','Signal generator','DC bench supply','Thermometer','Tachometer','Insulation tester','Continuity tester','Differential probe','Current probe','Lux meter','Process calibrator'];
function describe(index,kind='lab'){if(!Number.isInteger(index)||index<0||index>=10000)throw Error('Practice index must be 0–9999.');const family=Math.floor(index/500),v=index%500,a=1+v%25,b=1+Math.floor(v/25),V=5+a,R=100*b;let question,answer,unit,explanation;
const rows=[
['A '+V+' V supply feeds '+R+' Ω. Calculate current.',V/R,'A','I = V / R. Divide volts by ohms to obtain amperes.'],
['Find total resistance of '+R+' Ω and '+(a*10)+' Ω in series.',R+a*10,'Ω','Series resistances add.'],
['Find equivalent resistance of '+R+' Ω in parallel with '+(a*10)+' Ω.',1/(1/R+1/(a*10)),'Ω','1 / Req = 1 / R1 + 1 / R2.'],
['A '+V+' V divider has R1 = '+R+' Ω and R2 = '+(a*10)+' Ω. Find unloaded output.',V*a*10/(R+a*10),'V','Vout = Vin × R2 / (R1 + R2).'],
['A '+R+' Ω resistor has '+V+' V across it. Find dissipation.',V*V/R,'W','P = V² / R. Check the real resistor’s derating curve separately.'],
['A '+(a*25)+' W load runs for '+b+' hours. Find energy.',a*25*b,'Wh','E = P × time.'],
['A '+b+' µF capacitor is charged to '+V+' V. Find charge.',b*V,'µC','Q = C × V; µF × V gives µC.'],
['R = '+R+' Ω, C = '+a+' µF. Find the RC time constant.',R*a/1000,'ms','τ = R × C. Convert microseconds to milliseconds.'],
['R = '+R+' Ω, C = '+a+' µF. Find the low-pass cutoff.',1/(2*Math.PI*R*a*1e-6),'Hz','fc = 1 / (2πRC).'],
['An inductor of '+b+' mH carries '+a+' A. Find stored energy.',.5*b*a*a/1000,'J','E = ½ L I².'],
['An ideal transformer has '+(b*100)+' primary turns and '+(a*10)+' secondary turns at '+V+' V input. Find output.',V*a/(b*10),'V','Vs / Vp = Ns / Np. Losses and regulation are omitted.'],
['A '+V+' V RMS single-phase load draws '+b+' A at power factor 0.8. Find real power.',V*b*.8,'W','P = Vrms Irms cos φ.'],
['A balanced three-phase load has '+(200+a*10)+' V line voltage, '+b+' A and power factor 0.8. Find power.',Math.sqrt(3)*(200+a*10)*b*.8,'W','P = √3 × Vline × Iline × cos φ.'],
['A motor takes '+(a*100)+' W and delivers 80% as shaft power. Find shaft output.',a*80,'W','Pout = efficiency × Pin.'],
['A loop resistance of '+(b/10)+' Ω carries '+a+' A. Find conductor voltage drop.',a*b/10,'V','ΔV = I × Rloop.'],
['A '+(a*2)+' A protective device supplies a steady '+b+' A load. Find rated-current loading.',100*b/(a*2),'%','Loading = load / rating × 100%. This is not a trip-time prediction or cable selection.'],
['A PLC TON preset is '+(a*100)+' ms and scan is '+(b*10)+' ms. How many ideal scans until done?',Math.ceil(a*100/(b*10)),'scans','Round preset / scan upward; real PLC scheduling can add uncertainty.'],
['A 4–20 mA sensor spans 0–100 units. At '+(4+a*16/25)+' mA, find the scaled reading.',a*4,'units','Scaled = (mA − 4) / 16 × 100.'],
['A '+(a*10)+' m² panel receives '+(b*50)+' W/m² at 20% efficiency. Find ideal DC power.',a*10*b*50*.2,'W','P = area × irradiance × efficiency; temperature and system losses are omitted.'],
['A cooler removes '+(a*100)+' W at COP '+(1+b/10)+' for '+b+' hours. Find compressor energy.',a*100/(1+b/10)*b,'Wh','Electrical input = cooling / COP; energy = input × hours.']];
[question,answer,unit,explanation]=rows[family];
if(kind==='tool'){const fullScale=[2,20,200,2000][v%4],reading=fullScale*(a/30),accuracy=.1+b/10;question=tools[family]+': selected full scale '+fullScale+', indicated '+reading.toFixed(4)+' units, teaching accuracy ±'+accuracy.toFixed(1)+'% of reading. Calculate the absolute uncertainty (digits omitted).';answer=reading*accuracy/100;unit='units';explanation='Absolute uncertainty = reading × stated percentage / 100. This synthetic practice specification is not a manufacturer datasheet. '+(['Digital ammeter','Current probe','Clamp meter'].includes(tools[family])?'Choose the correct current measurement method; a series ammeter must not bridge a voltage source.':'Choose an appropriate range, probe and measurement category for the actual instrument.');}
return {id:(kind==='tool'?'TOOL-':'LAB-')+String(index+1).padStart(5,'0'),index,kind,category:kind==='tool'?tools[family]:topics[family],name:(kind==='tool'?tools[family]:topics[family])+' · case '+(v+1),question,answer,unit,explanation,experimentIndex:(family%20)*500+v};}
function query({q='',category='',offset=0,limit=12,kind='lab'}={}){const items=[];q=String(q).toLowerCase();for(let i=0;i<10000;i++){const d=describe(i,kind);if((!category||d.category===category)&&(!q||(d.id+' '+d.name+' '+d.question).toLowerCase().includes(q)))items.push(d);}return {total:items.length,items:items.slice(Math.max(0,offset),Math.max(0,offset)+Math.min(60,limit))};}
function check(index,kind,value){const d=describe(index,kind),n=Number(value);return Number.isFinite(n)&&Math.abs(n-d.answer)<=Math.max(1e-7,Math.abs(d.answer)*.01);}
return {count:10000,topics,tools,describe,query,check};});
