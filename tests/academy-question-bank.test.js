const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const read = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

test("million-variant bank is loaded after the existing content expansion and cached", () => {
  const html = read("index.html");
  assert.match(html, /academy-content-expansion\.js\?v=20261011a"><\/script>\s*<script src="academy-question-bank\.js\?v=20261011c"><\/script>/);
  const worker = read("service-worker.js");
  assert.match(worker, /voltpro-v43/);
  assert.match(worker, /"\.\/academy-question-bank\.js"/);
});

test("both existing assessment sections expose one million on-demand variants without materializing the pool", () => {
  const source = read("academy-question-bank.js");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /GENERATED_TOTAL=1000000/);
  assert.match(source, /VARIANTS_PER_TOPIC=100000/);
  assert.match(source, /PAGE_SIZE=25/);
  assert.match(source, /function generatedQuestion\(kind,f,n\)/);
  assert.match(source, /function pageHtml\(k\)/);
  assert.match(source, /not individually authored or officially validated exam items/);
  assert.doesNotMatch(source, /Array\(1000000\)|new Array\(1000000\)/);
});

test("rendering stays paginated and shows the full available pool count", () => {
  const context = {
    window: { quizzes: [{id:"kc-test",topic:"Core",level:"Foundation",q:"Test question?",a:["A","B","C","D"],c:0,explanation:"Test."}], examQuestions: [{id:"ex-test",topic:"Core",level:"Foundation",q:"Exam question?",a:["A","B","C","D"],c:0,explanation:"Test."}] },
    state: { quiz:{}, exam:{} },
    save() {},
    esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); },
    layout(title, html) { context.lastTitle = title; context.lastHtml = html; },
  };
  vm.runInNewContext(read("academy-question-bank.js"), context);
  context.window.quiz();
  assert.match(context.lastHtml, /1,000,001 available/);
  assert.equal((context.lastHtml.match(/vpx-million-question/g)||[]).length, 25);
  context.window.expandedExam();
  assert.match(context.lastHtml, /1,000,001 available/);
  assert.equal((context.lastHtml.match(/vpx-million-question/g)||[]).length, 25);
});

test("million-bank script adds no sidebar destinations", () => {
  const html = read("index.html");
  const start = html.indexOf('<nav class="nav"');
  const nav = html.slice(start, html.indexOf("</nav>", start));
  assert.equal((nav.match(/data-view=/g)||[]).length, 10);
  assert.doesNotMatch(nav, /question-bank/);
});

test("Exam Practice is connected to the existing navigation and curated exam questions remain available", () => {
  const app = read("script.js");
  assert.match(app, /exam:window\.expandedExam\|\|dashboard/);
  assert.match(app, /window\.examQuestions=examQuestions/);
});
