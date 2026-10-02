#!/usr/bin/env node
/**
 * shot.js — screenshot local HTML pages with Playwright + the system Chrome.
 *
 * Why it is shaped like this (each line is a bug I hit):
 *
 *  1. SERVE, DON'T file://  — a local static server is started in this same
 *     process. Opening file:// breaks relative CSS/font paths, blocks
 *     document.fonts.check(), and taints the page so getComputedStyle-based
 *     checks misreport. Serving also lets you send a correct charset, without
 *     which ₹ · — render as mojibake in the PNG.
 *
 *  2. SYSTEM CHROME — `executablePath` points at the installed Chrome, because
 *     Playwright's own browser download is usually not present and installing
 *     it is a 300MB detour. Any Chrome/Chromium path works.
 *
 *  3. deviceScaleFactor: 2 — otherwise the text in the PNG is soft and you
 *     cannot judge type or hairline borders, which is the whole point.
 *
 *  4. networkidle + a fonts wait — `load` fires before webfonts swap in, so
 *     screenshots silently capture the fallback face. Waiting on
 *     document.fonts.ready is what makes the shot show the real typography.
 *
 *  5. ELEMENT SHOTS — pass selectors to capture just those elements. Much more
 *     useful than a full-page dump when one file holds many sections, and it
 *     sidesteps the sticky-header overlap you get from full-page captures.
 *
 * Usage:
 *   node shot.js --root <dir> --page <path-relative-to-root> [options]
 *
 *   --out <dir>        where PNGs go              (default ./shots)
 *   --sel  a,b,c       element ids/selectors      (default: whole page)
 *   --width  1512      viewport width            (default 1512)
 *   --height 900       viewport height           (default 900)
 *   --full             full-page instead of viewport
 *   --port 8899        local server port
 *
 * Examples:
 *   node shot.js --root . --page screens/13-org.html --sel "#org-chart,#team"
 *   node shot.js --root . --page index.html --full --width 1280
 */

const PLAYWRIGHT = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let chromium;
try { ({ chromium } = require(PLAYWRIGHT)); }
catch (e) {
  console.error('Cannot load playwright from "' + PLAYWRIGHT + '".');
  console.error('Install it (npm i -D playwright) or set PLAYWRIGHT_PATH to an existing copy.');
  process.exit(1);
}

const http = require('http'), fs = require('fs'), path = require('path');

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1]; };
const flag = n => argv.includes('--' + n);

const ROOT   = path.resolve(arg('root', '.'));
const PAGE   = arg('page');
const OUT    = path.resolve(arg('out', 'shots'));
const SELS   = (arg('sel', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const WIDTH  = parseInt(arg('width', '1512'), 10);
const HEIGHT = parseInt(arg('height', '900'), 10);
const PORT   = parseInt(arg('port', '8899'), 10);

if (!PAGE) { console.error('Need --page <path relative to --root>'); process.exit(1); }

// Charset matters: without it, ₹ · — → em-dash and rupee render as mojibake.
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('no'); }   // no ../ escapes
  try {
    const body = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,          // retina, or the type is unjudgeable
    colorScheme: 'light'
  });

  const problems = [];
  page.on('pageerror', e => problems.push('JS: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) problems.push(r.status() + ' ' + r.url()); });

  const url = 'http://127.0.0.1:' + PORT + '/' + PAGE.replace(/^\.?\//, '');
  await page.goto(url, { waitUntil: 'networkidle' });
  // `load`/`networkidle` can both fire before webfonts swap in, which silently
  // captures the fallback face.
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(250);

  const base = path.basename(PAGE).replace(/\.html?$/, '');
  const shots = [];

  if (SELS.length) {
    for (const sel of SELS) {
      const q = sel.startsWith('#') || sel.startsWith('.') ? sel : '#' + sel;
      const el = await page.$(q);
      if (!el) { problems.push('selector not found: ' + q); continue; }
      const name = q.replace(/[^a-zA-Z0-9_-]/g, '') || 'el';
      const file = path.join(OUT, base + '--' + name + '.png');
      // Un-stick the page chrome first. Scrolling an element into view drags a
      // position:sticky site header along with it, and it then paints over the
      // top of the very element being captured -- so an element shot of a tall
      // frame came back with the nav bar stamped across its middle. Only
      // elements OUTSIDE the target are touched, so a sticky footer or rail
      // that belongs to the frame is still captured where it really sits.
      const undo = await page.evaluate((selector) => {
        const target = document.querySelector(selector);
        const changed = [];
        for (const node of document.querySelectorAll('*')) {
          if (target && (node === target || target.contains(node))) continue;
          const pos = getComputedStyle(node).position;
          if (pos === 'sticky' || pos === 'fixed') {
            changed.push([node, node.style.position]);
            node.style.position = 'static';
          }
        }
        window.__shotUndo = changed;
        return changed.length;
      }, q);
      await el.screenshot({ path: file });
      await page.evaluate(() => {
        for (const [node, prev] of (window.__shotUndo || [])) node.style.position = prev;
        window.__shotUndo = null;
      });
      if (undo) problems.push('note: un-stuck ' + undo + ' element(s) outside ' + q);
      shots.push(file);
    }
  } else {
    const file = path.join(OUT, base + '.png');
    await page.screenshot({ path: file, fullPage: flag('full') });
    shots.push(file);
  }

  await browser.close(); server.close();

  shots.forEach(f => console.log('  wrote ' + f));
  if (problems.length) { console.log('  problems:'); problems.forEach(p => console.log('    ' + p)); }
  else console.log('  no JS errors, no failed requests');
})();
