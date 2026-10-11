/* VoltPRo physical breadboard model. All public geometry is in millimeters. */
(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.VoltProBoardModel=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
'use strict';
const PITCH=2.54, ROWS=['a','b','c','d','e','f','g','h','i','j'], COLS=63, RAIL_HOLES=50;
const rowY=r=>r<=4?r*PITCH:(r+1)*PITCH+PITCH/2; // a-e: 0..10.16; f-j: 13.97..24.13
function holeAt(id){
 if(typeof id!=='string')return null;
 let m=/^([a-j])(\d{1,2})$/.exec(id);
 if(m){const c=Number(m[2]);if(c<1||c>COLS)return null;const r=ROWS.indexOf(m[1]);return {id,x:(c-1)*PITCH,y:rowY(r),row:m[1],rowIndex:r,column:c,kind:'terminal',block:r<5?'top':'bottom',node:nodeOf(id)};}
 m=/^([TB])P([+-])(\d{1,2})$/.exec(id);
 if(m){const c=Number(m[3]);if(c<1||c>RAIL_HOLES)return null;const top=m[1]==='T',positive=m[2]==='+',segment=c<=25?0:1;const y=top?(positive?-2*PITCH:-PITCH):(positive?rowY(9)+2*PITCH:rowY(9)+3*PITCH);return {id,x:(6.5+c-1)*PITCH,y,row:null,rowIndex:null,column:c,kind:'rail',rail:(top?'T':'B')+(positive?'+':'-'),segment,node:nodeOf(id)};}
 return null;
}
function rowOf(id){const h=holeAt(id);return h?.row??null}
function colOf(id){const h=holeAt(id);return h?.column??null}
function railOf(id){const h=holeAt(id);return h?.rail??null}
function nodeOf(id,options={}){
 const hRaw=String(id||'');const m=/^([a-j])(\d{1,2})$/.exec(hRaw);
 if(m){const c=Number(m[2]);if(c<1||c>COLS)return null;const r=ROWS.indexOf(m[1]);return (r<5?'upper:':'lower:')+c;}
 const r=/^([TB])P([+-])(\d{1,2})$/.exec(hRaw);if(!r)return null;const c=Number(r[3]);if(c<1||c>RAIL_HOLES)return null;const seg=options.bridgedRails?0:(c<=25?0:1);return 'rail:'+r[1]+r[2]+':'+seg;
}
function holeIdAt(x,y,tolerance=PITCH*0.45,options={}){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(tolerance)||tolerance<0)return null;
 let best=null,d2=Infinity;
 for(const r of ROWS){for(let c=1;c<=COLS;c++){const h=holeAt(r+c);const d=(h.x-x)**2+(h.y-y)**2;if(d<d2){d2=d;best=h.id;}}}
 for(const side of ['T','B'])for(const sign of ['+','-'])for(let c=1;c<=RAIL_HOLES;c++){const id=side+'P'+sign+c,h=holeAt(id),d=(h.x-x)**2+(h.y-y)**2;if(d<d2){d2=d;best=id;}}
 return d2<=tolerance*tolerance?best:null;
}
function createOccupancy(){const map=new Map();return {
 map,
 add(holeId,occupant){if(!holeAt(holeId))throw new Error('Unknown hole: '+holeId);if(!occupant||!['leg','wire'].includes(occupant.kind)||!occupant.id)throw new TypeError('Occupant must have kind leg|wire and id');const xs=map.get(holeId)||[];if(occupant.kind==='leg'&&xs.some(x=>x.kind==='leg'&&x.id!==occupant.id))throw new Error('A hole cannot contain two component legs');if(!xs.some(x=>x.kind===occupant.kind&&x.id===occupant.id))xs.push({...occupant});map.set(holeId,xs);return xs.slice();},
 remove(holeId,kind,id){const xs=map.get(holeId)||[],next=xs.filter(x=>!(x.kind===kind&&x.id===id));if(next.length)map.set(holeId,next);else map.delete(holeId);return xs.length-next.length;},
 at(holeId){return (map.get(holeId)||[]).map(x=>({...x}));},
 clear(){map.clear();},
 nodeFor(holeId,options){return nodeOf(holeId,options);}
};}
function createDefaultModel(options={}){return {pitchMm:PITCH,columns:COLS,rows:ROWS.slice(),railHoles:RAIL_HOLES,bridgedRails:!!options.bridgedRails,holeAt,nodeOf:id=>nodeOf(id,{bridgedRails:!!options.bridgedRails}),holeIdAt,rowOf,colOf,railOf,occupancy:createOccupancy()};}
return {PITCH,ROWS,COLS,RAIL_HOLES,rowY,holeAt,holeIdAt,rowOf,colOf,railOf,nodeOf,createOccupancy,createDefaultModel};
});