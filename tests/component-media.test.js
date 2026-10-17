const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const vm=require("node:vm");
test("component media loader is syntactically valid and exposes the media API",async()=>{
 const ctx={window:{},fetch:async()=>({ok:false}),Promise,console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync("platform/component-media.js","utf8"),ctx);
 assert.ok(ctx.window.VoltProMedia);assert.equal(ctx.window.VoltProMedia.files.length,34);assert.ok(ctx.window.VoltProMedia.ready);
 await ctx.window.VoltProMedia.ready;assert.equal(ctx.window.VoltProMedia.count,0);
});
test("simulator has dynamic registry and media integration",()=>{
 const s=fs.readFileSync("simulator.js","utf8");
 assert.match(s,/function paletteEntries\(\)/);assert.match(s,/VoltProRegistry\?\.definition/);assert.match(s,/VoltProComponents\.preview/);
});
