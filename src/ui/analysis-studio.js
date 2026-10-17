/* Original VoltPRo instrument UI. All traces come from the local MNA engine. */
(()=>{'use strict';
const $=s=>document.querySelector(s),data=window.VoltProAnalysisData,api=window.VoltProSimulator;
if(!api||!window.VoltProUI||!data)return;
const wrap=$('#canvasWrap'),S=api.state;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(n)?Number(n).toPrecision(4):'—';
let view='time',rows=[],lastResult=null,lastKey='',refreshTimer,paintPending=false,layout=null;
const drawer=document.createElement('section');drawer.className='studio-drawer';drawer.hidden=true;drawer.setAttribute('aria-label','Circuit analysis instruments');
drawer.innerHTML=`<div class="studio-head"><b>ANALYSIS STUDIO</b><button data-view="time" aria-pressed="true">Time</button><button data-view="ac" aria-pressed="false">Bode</button><button data-view="xy" aria-pressed="false">XY</button><button data-view="spectrum" aria-pressed="false">Spectrum</button><button data-view="dc" aria-pressed="false">DC sweep</button><button class="studio-close" aria-label="Close analysis studio">×</button></div>
<div class="studio-controls"><label>Probe <select id="studioProbe" aria-label="Primary probe"></select></label><label>CH2 <select id="studioProbe2" aria-label="Secondary probe"></select></label><label id="studioDurationLabel">Window (s) <input id="studioDuration" type="number" value="0.05" min="0.000001" max="10" step="0.01"></label><label id="studioStartLabel" hidden>From <input id="studioStart" type="number" value="1" min="0.001"></label><label id="studioStopLabel" hidden>To <input id="studioStop" type="number" value="100000" min="0.001"></label><button id="studioCapture">Capture</button><button id="studioCsv">CSV</button><button id="studioReset">Reset state</button></div>
<div class="studio-plot-wrap"><svg class="studio-plot" id="studioPlot" role="img" aria-label="Circuit analysis plot"></svg></div><div class="studio-readings" id="studioReadings" role="status">Choose a circuit and capture a trace.</div>`;
wrap.append(drawer);
const legend=document.createElement('div');legend.className='studio-legend';legend.innerHTML='<span data-positive>+V</span> · <span data-negative>−V</span> · ground grey · dots: energized path';legend.hidden=true;wrap.append(legend);
const welcome=document.createElement('section');welcome.className='studio-quickstart';welcome.innerHTML=`<span class="studio-kicker">VOLTPro · ELECTRICAL WORKBENCH</span><h1>Build it. Measure it. Understand it.</h1><p>Choose a wired experiment or place components from the library. Connect pins, change values in the inspector, and explore the calculated response.</p><div class="studio-example-list"><button data-example="divider">Voltage divider<small>DC · 12 V → 6 V</small></button><button data-example="rc">RC charging<small>Time domain · τ = 10 ms</small></button><button data-example="filter">Low-pass filter<small>Bode · f₍c₎ ≈ 159 Hz</small></button><button data-example="led">Switched LED<small>Interact · current limiting</small></button></div><p>Local-first · no account · educational component models</p>`;wrap.append(welcome);
const launch=document.createElement('button');launch.id='studioLaunch';launch.className='studio-launch';launch.textContent='⌁ Analysis';launch.setAttribute('aria-expanded','false');launch.onclick=()=>open(drawer.hidden);$('#runBtn').parentElement.append(launch);
const step=document.createElement('button');step.id='studioStep';step.textContent='Step';step.title='Stop continuous updates and solve one operating point';step.onclick=()=>api.step();$('#runBtn').parentElement.insertBefore(step,$('#stopBtn'));
const examples=document.createElement('button');examples.textContent='Experiments';examples.onclick=()=>{welcome.hidden=!welcome.hidden};launch.parentElement.append(examples);
const deviceView=document.createElement('button');deviceView.textContent='Device view';deviceView.title='Toggle component photographs and schematic symbols';deviceView.setAttribute('aria-pressed','false');deviceView.onclick=()=>{S.deviceView=!S.deviceView;deviceView.setAttribute('aria-pressed',String(S.deviceView));window.VoltProUI.renderCanvas()};launch.parentElement.append(deviceView);
const live=document.createElement('div');live.className='studio-live-values';live.setAttribute('aria-label','Live circuit measurements');$('#inspectorBody').after(live);
const adjust=document.createElement('div');adjust.className='studio-adjust';live.after(adjust);
function selectedControls(){
 refreshVisuals();
 const c=S.components.find(c=>c.id===S.selected);adjust.replaceChildren();if(!c)return;
 const field=c.type==='resistor'?'resistance':['battery','acsource','controlsource'].includes(c.type)?'voltage':null;
 if(c.type==='switch'){
  const button=document.createElement('button');button.className='ins-btn';button.textContent=c.props.closed?'Open switch':'Close switch';button.onclick=()=>{window.VoltProUI.saveHistory();c.props.closed=c.props.closed?0:1;window.VoltProUI.render();if(S.running)window.VoltProUI.run()};adjust.append(button);return;
 }
 if(!field)return;const label=document.createElement('label');label.textContent='Live '+field;
 const slider=document.createElement('input');slider.type='range';slider.setAttribute('aria-label','Live '+field);slider.min=field==='resistance'?'1':'0';slider.max=String(Math.max(field==='resistance'?10000:24,Number(c.props[field])*2));slider.step=field==='resistance'?'1':'0.1';slider.value=c.props[field];
 slider.onpointerdown=()=>window.VoltProUI.saveHistory();slider.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.stopPropagation();if(!e.repeat)window.VoltProUI.saveHistory()}};
 slider.oninput=()=>{c.props[field]=Number(slider.value);const input=$('#inspectorBody [data-prop="'+field+'"]');if(input)input.value=slider.value;window.VoltProUI.renderCanvas();if(S.running)window.VoltProUI.run();invalidate()};label.append(slider);adjust.append(label);
}
new MutationObserver(selectedControls).observe($('#inspectorBody'),{childList:true});
const get=id=>drawer.querySelector('#'+id);
function setMessage(text,error=false){get('studioReadings').textContent=text;get('studioReadings').classList.toggle('studio-error',error)}
function open(show=true){drawer.hidden=!show;wrap.classList.toggle('studio-open',show);launch.setAttribute('aria-expanded',String(show));if(show){syncProbes();capture()}else{clearTimeout(refreshTimer)}requestAnimationFrame(()=>{$('#fitBtn').click();if(show)draw()})}
function project(){return api.getSolverProject()}
function syncProbes(){
 const values=[get('studioProbe').value,get('studioProbe2').value];
 const eligible=S.components.filter(c=>(window.defs[c.type]?.pins||window.VoltProRegistry?.definition?.(c.type)?.pins)===2);
 const options=eligible.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.props?.label||c.id)+' · '+esc(window.defs[c.type]?.name||c.type)+'</option>').join('');
 ['studioProbe','studioProbe2'].forEach((id,i)=>{get(id).innerHTML=options;if(eligible.some(c=>c.id===values[i]))get(id).value=values[i];else if(eligible.length)get(id).value=eligible[Math.min(i,eligible.length-1)].id});
}
function capture(){
 clearTimeout(refreshTimer);syncProbes();
 const p=project(),id=get('studioProbe').value,id2=get('studioProbe2').value;
 if(!id){rows=[];lastResult=null;draw();setMessage('Place and wire a source and a two-terminal component to begin.');return}
 try{
  const preflight=window.VoltProSimulationPreflight?.validate?.(p);if(preflight?.valid===false)throw Error(preflight.errors.map(e=>e.message||e.code).join('; '));
  const duration=Number(get('studioDuration').value),start=Number(get('studioStart').value),stop=Number(get('studioStop').value);
  if(view==='ac'||view==='dc'){
   if(!Number.isFinite(start)||!Number.isFinite(stop)||stop<=start||(view==='ac'&&start<=0))throw Error('Use finite limits with To greater than From; frequency must be positive.');
  }else if(!Number.isFinite(duration)||duration<=0||duration>10)throw Error('Choose a time window above zero and up to 10 seconds.');
  let result;
  if(view==='ac'){
   const sources=p.components.filter(c=>['battery','dcsource','acsource','controlsource','ac_source'].includes(c.type));
   if(sources.length!==1)throw Error('Bode transfer measurement requires one independent voltage source.');
   if(p.components.some(c=>['diode','led','zener','mosfet','npn','pnp'].includes(c.type)||/semiconductor/.test(c.type)))throw Error('Use a linear RLC circuit for this frequency-response measurement.');
   const source=sources[0],amplitude=Number(source.props.voltage??source.props.amplitude);
   if(!(amplitude>0))throw Error('Set a positive source amplitude.');
   result=window.VoltProEngine.ac(p,{start,stop,points:90});if(!result.ok)throw Error(result.error);
   rows=data.bode(result,id,amplitude,source.type==='acsource'||source.type==='ac_source'?Number(source.props.phase||0):0);lastResult=result;
   setMessage('Transfer magnitude (dB) · phase (°, orange) · '+rows.length+' frequencies · probe voltage / source amplitude');
  }else if(view==='dc'){
   const c=p.components.find(c=>c.id===id),keys=['resistance','voltage','capacitance','inductance'];const param=keys.find(k=>typeof c.props[k]==='number');
   if(!param||!['resistance','voltage'].includes(param))throw Error('Choose a resistor or a voltage source for a DC parameter sweep.');
   if(param==='resistance'&&start<=0)throw Error('Resistance must stay above zero.');
   result=window.VoltProEngine.dcSweep(p,{componentId:id,param,start,stop,points:80});if(!result.ok)throw Error(result.error);
   rows=result.sweep.map(s=>({x:s.value,y:s.totalCurrent}));lastResult=result;
   setMessage('Swept '+param+' · vertical axis: total source current (A) · '+rows.length+' operating points');
  }else{
   result=window.VoltProEngine.transient(p,{duration,steps:512});if(!result.ok)throw Error(result.error);
   const a=data.trace(result,id),b=data.trace(result,id2);
   if(!a.length)throw Error('The selected probe has no solved voltage. Check its connections.');
   lastResult=result;
   if(view==='spectrum'){rows=data.spectrum(a);setMessage('Hann-windowed DFT · DC removed · '+fmt(rows[0]?.x)+' Hz bin spacing · Nyquist '+fmt(256/duration)+' Hz');}
   else if(view==='xy'){rows=a.map((p,i)=>({x:b[i]?.y??0,y:p.y}));setMessage('XY · horizontal: CH2 voltage · vertical: probe voltage');}
   else{rows=a.map((p,i)=>({...p,y2:b[i]?.y}));const stats=data.stats(a);setMessage('Probe: '+fmt(stats.rms)+' V RMS · '+fmt(stats.peakToPeak)+' V p–p · min '+fmt(stats.min)+' V · max '+fmt(stats.max)+' V · zero initial energy');}
  }
  if(!rows.length)throw Error('No data for this probe. Choose a passive branch.');
  lastKey=JSON.stringify(p);draw();
 }catch(error){rows=[];lastResult=null;draw();setMessage(error.message,true)}
}
function draw(){
 const svg=get('studioPlot'),w=Math.max(280,svg.clientWidth||600),h=Math.max(90,svg.clientHeight||160),left=62,right=42,top=16,bottom=28;
 svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 if(!rows.length){svg.innerHTML=`<text x="${w/2}" y="${h/2}" text-anchor="middle">No captured data</text>`;layout=null;return}
 const xs=rows.map(p=>view==='ac'?Math.log10(p.x):p.x),ys=rows.flatMap(p=>[p.y,p.y2].filter(Number.isFinite));
 let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);if(xmax===xmin)xmax=xmin+1;if(ymax-ymin<1e-9){ymin-=1;ymax+=1}else{const pad=(ymax-ymin)*.1;ymin-=pad;ymax+=pad}
 const X=x=>left+(x-xmin)/(xmax-xmin)*(w-left-right),Y=y=>h-bottom-(y-ymin)/(ymax-ymin)*(h-top-bottom);
 let body='';for(let i=0;i<=4;i++){const x=left+i*(w-left-right)/4,y=top+i*(h-top-bottom)/4,xv=xmin+(xmax-xmin)*i/4,yv=ymax-(ymax-ymin)*i/4;
  body+=`<path d="M${x} ${top}V${h-bottom}M${left} ${y}H${w-right}" stroke="#21354a"/><text x="${left-8}" y="${y+3}" text-anchor="end">${fmt(yv)}</text><text x="${x}" y="${h-8}" text-anchor="middle">${fmt(view==='ac'?10**xv:xv)}</text>`;
 }
 const path=key=>rows.map((p,i)=>`${i?'L':'M'}${X(xs[i]).toFixed(2)} ${Y(p[key]).toFixed(2)}`).join(' ');
 body+=`<path d="${path('y')}" fill="none" stroke="#67e8c0" stroke-width="2"/>`;
 if(rows.every(p=>Number.isFinite(p.y2)))body+=`<path d="${path('y2')}" fill="none" stroke="#80b9ff" stroke-width="1.5"/>`;
 if(view==='ac'){body+=`<path d="${rows.map((p,i)=>(i?'L':'M')+X(xs[i]).toFixed(2)+' '+(h-bottom-(p.phase+180)/360*(h-top-bottom)).toFixed(2)).join(' ')}" fill="none" stroke="#ffbd72" stroke-width="1.5"/><text x="${w-3}" y="${top+7}" text-anchor="end">180°</text><text x="${w-3}" y="${h-bottom}" text-anchor="end">−180°</text>`}
 body+='<g id="studioCursor"></g>';svg.innerHTML=body;layout={w,h,left,right,top,bottom,xmin,xmax,X,Y};
 svg.setAttribute('aria-label',`${view} analysis: ${rows.length} samples, vertical range ${fmt(ymin)} to ${fmt(ymax)}`);
}
get('studioPlot').addEventListener('pointermove',event=>{
 if(!layout||!rows.length)return;const r=event.currentTarget.getBoundingClientRect(),px=(event.clientX-r.left)/r.width*layout.w;
 const x=layout.xmin+(px-layout.left)/(layout.w-layout.left-layout.right)*(layout.xmax-layout.xmin);
 const closest=rows.reduce((a,b)=>Math.abs((view==='ac'?Math.log10(b.x):b.x)-x)<Math.abs((view==='ac'?Math.log10(a.x):a.x)-x)?b:a);
 const xx=layout.X(view==='ac'?Math.log10(closest.x):closest.x),text='x '+fmt(closest.x)+' · y '+fmt(closest.y)+(Number.isFinite(closest.phase)?' · '+fmt(closest.phase)+'°':'');
 get('studioCursor').innerHTML=`<path d="M${xx} ${layout.top}V${layout.h-layout.bottom}" stroke="#e4edf6" stroke-dasharray="3 4"/><text x="${layout.left+6}" y="${layout.top+12}">${text}</text>`;
});
function refreshVisuals(){if(window.VoltProLiveFlow?.active)return;
 if(paintPending)return;paintPending=true;requestAnimationFrame(()=>{paintPending=false;
  const result=S.lastAnalysis,valid=S.running&&result?.ok;
  legend.hidden=!valid;wrap.classList.toggle('studio-paused',!S.running);
  const branch=result?.branches?.find(b=>b.id===S.selected);
  live.textContent=valid?(branch?'Selected: '+fmt(branch.voltage)+' V · '+fmt(branch.current)+' A · '+fmt(branch.power)+' W':'Source '+fmt(result.sourceVoltage)+' V · '+fmt(result.totalCurrent)+' A · '+fmt(result.totalPower)+' W'):'';
  document.querySelectorAll('#wires [data-wire]').forEach(path=>{
   path.parentElement.querySelector('.studio-flow')?.remove();if(!valid)return;
   const wire=S.wires.find(w=>w.id===path.dataset.wire),v=result.terminalVoltages?.[wire?.a];
   if(Number.isFinite(v)){path.style.stroke=Math.abs(v)<1e-5?'#7e91a5':v>0?'#74e5ae':'#ff8f99';path.setAttribute('aria-label',fmt(v)+' V');}
   // A net's individual ideal-wire current is not uniquely resolved by MNA.
   // Dots mark an energized conductive path, not a claimed wire-current magnitude.
   const ids=[wire?.a?.split(':')[0],wire?.b?.split(':')[0]],active=(result.branches||[]).some(b=>ids.includes(b.id)&&Math.abs(b.current)>1e-8);
   if(active){const flow=document.createElementNS('http://www.w3.org/2000/svg','path');flow.setAttribute('d',path.getAttribute('d'));flow.setAttribute('class','studio-flow');path.after(flow)}
  });
 });
}
function invalidate(){welcome.hidden=S.components.length>0;if(!drawer.hidden){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(lastKey!==JSON.stringify(project()))capture()},180)}refreshVisuals()}
window.addEventListener('voltpro-analysis',()=>{refreshVisuals();if(!drawer.hidden)invalidate()});
const observer=new MutationObserver(refreshVisuals);observer.observe($('#wires'),{childList:true});
// Observe only the wires container itself; decorative paths are inserted in child groups.
drawer.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
 view=button.dataset.view;drawer.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const range=view==='ac'||view==='dc';get('studioDurationLabel').hidden=range;get('studioStartLabel').hidden=!range;get('studioStopLabel').hidden=!range;
 if(range){get('studioStart').value=view==='dc'?100:1;get('studioStop').value=view==='dc'?10000:100000}capture();
});
drawer.querySelector('.studio-close').onclick=()=>open(false);get('studioCapture').onclick=capture;
['studioProbe','studioProbe2','studioDuration','studioStart','studioStop'].forEach(id=>get(id).onchange=capture);
get('studioReset').onclick=()=>{window.VoltProUI.stop();S.components.forEach(c=>delete c.state);S.lastAnalysis=null;window.VoltProUI.render();capture()};
get('studioCsv').onclick=()=>{if(!rows.length){setMessage('Capture data before exporting.',true);return}const x=view==='ac'||view==='spectrum'?'frequency_Hz':view==='xy'?'CH2_V':view==='dc'?'parameter':'time_s',y=view==='ac'?'gain_dB':view==='dc'?'current_A':'voltage_V';const blob=new Blob([data.csv(rows,x,y)],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='voltpro-'+view+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function example(kind,confirmed=false){
 if(S.components.length&&!confirmed){
  if(document.getElementById('studioReplaceDialog'))return;
  const dialog=document.createElement('dialog');dialog.id='studioReplaceDialog';dialog.className='studio-replace';dialog.setAttribute('aria-labelledby','studioReplaceTitle');
  dialog.innerHTML='<h2 id="studioReplaceTitle">Load this experiment?</h2><p>This replaces the circuit on your canvas. Save the current project first if you want to keep it.</p><div><button data-cancel>Keep current circuit</button><button data-replace>Replace circuit</button></div>';
  dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.querySelector('[data-replace]').onclick=()=>{dialog.close();example(kind,true)};dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();return;
 }
 window.VoltProUI.stop();window.VoltProUI.saveHistory();
 const c=(id,type,x,y,props)=>({id,type,x,y,rotation:0,props});
 let components=[c('V1',kind==='filter'?'acsource':'battery',180,190,{voltage:kind==='filter'?1:12,frequency:50}),c('R1','resistor',380,100,{resistance:kind==='led'?470:1000}),c('OUT',kind==='divider'?'resistor':kind==='led'?'led':'capacitor',580,190,kind==='divider'?{resistance:1000}:kind==='led'?{forward:2,resistance:10}:{capacitance:kind==='rc'?1e-5:1e-6})];
 components[0].rotation=90;components[2].rotation=90;
 let links=[['V1:0','R1:0'],['R1:1','OUT:0'],['OUT:1','V1:1']];
 if(kind==='led'){components.push(c('S1','switch',360,350,{closed:1}));links=[['V1:0','R1:0'],['R1:1','OUT:0'],['OUT:1','S1:0'],['S1:1','V1:1']]}
 S.components=components;S.wires=links.map(([a,b],i)=>({id:'W'+(i+1),a,b}));S.selected='OUT';S.selectedWireId=null;S.lastAnalysis=null;S.mode='schematic';
 const name=$('#vpProjectName');if(name){name.value=({divider:'Voltage divider',rc:'RC charging',filter:'RC low-pass filter',led:'Switched LED'})[kind];name.dispatchEvent(new Event('change',{bubbles:true}))}
 window.VoltProUI.render();welcome.hidden=true;view=kind==='filter'?'ac':'time';drawer.querySelector('[data-view="'+view+'"]').click();get('studioProbe').value='OUT';get('studioProbe2').value='V1';get('studioDuration').value=.05;open();window.VoltProUI.run();
}
welcome.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>example(b.dataset.example));
document.addEventListener('keydown',e=>{if(e.target.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key.toLowerCase()==='k'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();S.running?window.VoltProUI.stop():window.VoltProUI.run()}if(e.key==='Escape'&&!drawer.hidden)open(false)});
new ResizeObserver(()=>{if(!drawer.hidden)draw()}).observe(drawer);
new ResizeObserver(()=>{if(!drawer.hidden)$('#fitBtn').click()}).observe($('#canvas'));
window.VoltProStudio={open,capture,invalidate,example};invalidate();
})();
