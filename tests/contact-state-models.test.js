const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadModels() {
  const models = new Map();
  const window = {
    VoltProDeviceModels: {
      register(model) { models.set(model.id, model); }
    }
  };
  vm.runInNewContext(fs.readFileSync("src/simulation/core-models.js", "utf8"), { window, Boolean });
  return models;
}

test("switch model treats numeric and string open states as open", () => {
  const models = loadModels();
  const model = models.get("switch");
  for (const closed of [false, 0, "0", "false", "off", "open", "no", ""]) {
    const result = model.evaluate({ state: { closed } });
    assert.equal(result.closed, false, `closed=${JSON.stringify(closed)} must be interpreted as open`);
    assert.equal(result.contacts[0].closed, false);
  }
});

test("switch model preserves explicit closed states and defaults to closed", () => {
  const model = loadModels().get("switch");
  for (const closed of [true, 1, "1", "true", "on", "closed", "yes"]) {
    assert.equal(model.evaluate({ state: { closed } }).closed, true);
  }
  assert.equal(model.evaluate({ state: {} }).closed, true);
});

test("normally-open pushbutton only closes when pressed", () => {
  const model = loadModels().get("pushbutton-no");
  for (const pressed of [undefined, false, 0, "false", "off"]) {
    assert.equal(model.evaluate({ state: { pressed } }).contacts[0].closed, false);
  }
  for (const pressed of [true, 1, "true", "on"]) {
    assert.equal(model.evaluate({ state: { pressed } }).contacts[0].closed, true);
  }
});

test("normally-closed pushbutton opens when pressed", () => {
  const model = loadModels().get("pushbutton-nc");
  for (const pressed of [undefined, false, 0, "false", "off"]) {
    assert.equal(model.evaluate({ state: { pressed } }).contacts[0].closed, true);
  }
  for (const pressed of [true, 1, "true", "on"]) {
    assert.equal(model.evaluate({ state: { pressed } }).contacts[0].closed, false);
  }
});
