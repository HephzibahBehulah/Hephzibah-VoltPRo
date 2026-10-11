const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

test("Academy expansion is loaded after the existing Academy script", () => {
  const html = read("index.html");
  assert.match(html, /<script src="script\.js[^"]*"><\/script>\s*<script src="academy-content-expansion\.js\?v=20261011a"><\/script>/);
  assert.match(read("service-worker.js"), /"\.\/academy-content-expansion\.js"/);
  assert.match(read("service-worker.js"), /voltpro-v41/);
});

test("Academy expansion parses and expands existing content collections", () => {
  const expansion = read("academy-content-expansion.js");
  assert.doesNotThrow(() => new Function(expansion));
  assert.match(expansion, /modules\.push\(\.\.\.VMODULES\)/);
  assert.match(expansion, /quizzes\.push\(\.\.\.VQUIZ/);
  assert.match(expansion, /examQuestions\.push\(\.\.\.VEXAM/);
  assert.match(expansion, /toolCatalog\.push\(\.\.\.VTOOLS\)/);
  assert.match(expansion, /componentCatalog\.push\(\.\.\.VCOMP\)/);
  assert.match(expansion, /formulaLibrary\.push\(\.\.\.VFORMULAS\)/);
  assert.match(expansion, /standardsLibrary\.push\(\.\.\.VSTANDARDS\)/);
  assert.match(expansion, /safetyRules\.push\(/);
  assert.match(expansion, /No new sidebar items or simulator controls/);
});

test("Expansion banks contain substantial unique question and lab sets", () => {
  const s = read("academy-content-expansion.js");
  for (const [prefix, minimum] of [["lab-", 25], ["kc-", 30], ["ex-", 25]]) {
    const ids = [...s.matchAll(new RegExp('^\\["(' + prefix + '[^"]+)"', "gm"))].map(m => m[1]);
    assert.ok(ids.length >= minimum, prefix + " bank should contain at least " + minimum + " curated entries");
    assert.equal(new Set(ids).size, ids.length, prefix + " IDs must be unique");
  }
  assert.match(s, /not official IHK\/HWK/);
  assert.match(s, /educational simulation only/i);
  assert.match(s, /Never connect resistance mode to an energized circuit|Never measure resistance on an energized circuit/);
});

test("Existing sidebar menu remains unchanged and expansion is not a new navigation destination", () => {
  const html = read("index.html");
  const nav = html.slice(html.indexOf('<nav class="nav"'), html.indexOf("</nav>", html.indexOf('<nav class="nav"')));
  assert.ok(nav.includes('data-view="labs"'));
  assert.ok(nav.includes('data-view="quiz"'));
  assert.ok(nav.includes('data-view="exam"'));
  assert.ok(nav.includes('data-view="reference"'));
  assert.ok(nav.includes('data-view="tools"'));
  assert.ok(!nav.includes("academy-content-expansion"));
  assert.equal((nav.match(/data-view=/g) || []).length, 10);
});
