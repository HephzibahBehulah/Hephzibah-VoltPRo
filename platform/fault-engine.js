(()=>{"use strict";
const TYPES={open:{label:"Open circuit",effect:"No current flows through the affected branch."},short:{label:"Short circuit",effect:"Impedance collapses; protective devices may trip."},overload:{label:"Overload",effect:"Current exceeds the configured load/protection envelope."},reverse:{label:"Reverse polarity",effect:"Polarity-sensitive devices may fail or operate incorrectly."},ground:{label:"Ground fault",effect:"A conductor is unintentionally connected to protective earth."},phaseLoss:{label:"Phase loss",effect:"A three-phase load loses one phase and may overheat."}};
function apply(project,fault){if(!TYPES[fault.type])throw Error("Unknown fault");return {...fault,active:true,diagnosis:TYPES[fault.type],timestamp:new Date().toISOString()}}
function clear(project){return {...project,faults:[]}}
function analyze(project){return (project.faults||[]).filter(f=>f.active).map(f=>({...f,...(TYPES[f.type]||{})}))}
window.VoltProFaultCatalog={TYPES,apply,clear,analyze};if(window.VoltProFaults)window.VoltProFaults.catalog=window.VoltProFaultCatalog;
})();