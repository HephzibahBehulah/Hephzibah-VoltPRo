const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'simulator.html'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'simulator-layout-restore.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

test('simulator layout restoration stylesheet loads after the visual theme layers', () => {
  const cyber = html.indexOf('cyber-theme.css');
  const hb = html.indexOf('voltpro-hb-theme.css');
  const restore = html.indexOf('simulator-layout-restore.css?v=20261012a');
  assert.ok(cyber >= 0 && hb > cyber && restore > hb);
});

test('top navigation and toolbar keep controls readable and horizontally reachable', () => {
  assert.match(layout, /\.sim-top\s*\{[^}]*flex-flow:\s*row nowrap/s);
  assert.match(layout, /\.sim-top\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(layout, /\.simulator-page \.top-actions button,\s*\.simulator-page \.top-actions a\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(layout, /\.toolbar\s*\{[^}]*flex-flow:\s*row nowrap/s);
  assert.match(layout, /\.toolbar\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(layout, /\.simulator-page \.top-actions button,\s*\.simulator-page \.top-actions a\s*\{[^}]*display:\s*inline-flex/s);
});

test('component category tabs cannot shrink into unreadable fragments', () => {
  assert.match(layout, /\.cat-tabs\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(layout, /\.cat-tabs button\s*\{[^}]*flex:\s*0 0 auto/s);
  assert.match(layout, /\.cat-tabs button\s*\{[^}]*min-width:\s*max-content/s);
  assert.match(layout, /\.cat-tabs button\s*\{[^}]*white-space:\s*nowrap/s);
});

test('service worker refreshes and caches the restored simulator layout', () => {
  assert.match(worker, /const CACHE="voltpro-v92"/);
  assert.match(worker, /"\.\/simulator-layout-restore\.css"/);
  assert.match(worker, /"\.\/voltpro-hb-theme\.css"/);
});
