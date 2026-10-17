/* Original VoltPRo analysis helpers. Pure functions shared by UI and tests. */
(function(root){'use strict';
function voltage(sample,nodes,component){
 const a=nodes[component+':0'],b=nodes[component+':1'];
 const read=n=>n===0?0:sample.nodeVoltages.find(v=>v.node===n)?.voltage;
 const av=read(a),bv=read(b);return Number.isFinite(av)&&Number.isFinite(bv)?av-bv:null;
}
function trace(result,component){
 if(!result?.ok)return [];
 return result.samples.map(s=>({x:s.t,y:voltage(s,result.terminalNodes||{},component)})).filter(s=>Number.isFinite(s.y));
}
function stats(points){
 const values=points.map(p=>p.y).filter(Number.isFinite);if(!values.length)return null;
 const mean=values.reduce((a,b)=>a+b,0)/values.length;
 return {min:Math.min(...values),max:Math.max(...values),mean,rms:Math.sqrt(values.reduce((a,b)=>a+b*b,0)/values.length),peakToPeak:Math.max(...values)-Math.min(...values)};
}
function spectrum(points){
 // Single-sided Hann-windowed DFT, DC removed; amplitude-corrected bins.
 const n=points.length;if(n<4)return [];
 const dt=(points.at(-1).x-points[0].x)/(n-1);if(!(dt>0))return [];
 const mean=stats(points).mean,window=points.map((_,i)=>.5-.5*Math.cos(2*Math.PI*i/(n-1))),weight=window.reduce((a,b)=>a+b,0),out=[];
 for(let k=1;k<=Math.min(128,Math.floor(n/2));k++){
  let re=0,im=0;for(let i=0;i<n;i++){const angle=2*Math.PI*k*i/n,v=(points[i].y-mean)*window[i];re+=v*Math.cos(angle);im-=v*Math.sin(angle)}
  out.push({x:k/(n*dt),y:Math.hypot(re,im)*(k===n/2?1:2)/weight});
 }return out;
}
function bode(result,component,inputAmplitude,inputPhase=0){
 if(!result?.ok||!(inputAmplitude>0))return [];
 return result.sweep.map(s=>{const b=s.branches.find(b=>b.id===component);return b?{x:s.frequency,y:20*Math.log10(Math.max(1e-15,b.voltage/inputAmplitude)),phase:((b.voltagePhaseDeg-inputPhase+540)%360)-180}:null}).filter(Boolean);
}
function csv(points,xLabel='time_s',yLabel='voltage_V'){return xLabel+','+yLabel+'\n'+points.map(p=>p.x+','+p.y).join('\n')+'\n'}
const api={voltage,trace,stats,spectrum,bode,csv};
if(typeof module==='object')module.exports=api;else root.VoltProAnalysisData=api;
})(typeof window==='object'?window:globalThis);
