// The collapsed/expanded sidebar test.
//
// The rail is sized by the SHELL, not by itself: `.v-shell:has(> .v-rail.is-expanded)`
// swaps the grid's first column to `--rail-open`. That is easy to break by
// accident -- an inline `style` on the shell, a renamed token, a frame whose rail
// is not a direct child -- and the break is invisible in a static screenshot of a
// collapsed rail. So this asserts the measured pixel width of both states rather
// than the presence of a class.
const { chromium } = require(process.env.PLAYWRIGHT_PATH ||
  '/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.json': 'application/json' };

const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => {
    if (e) { r.statusCode = 404; return r.end(); }
    r.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream');
    r.end(d);
  });
});

srv.listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await (await b.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${port}/screens/01-home.html`, { waitUntil: 'networkidle' });

  const out = await p.evaluate(() => {
    const rail = document.querySelector('.v-rail');
    if (!rail) return { error: 'no .v-rail on 01-home' };
    const shell = rail.parentElement;
    const w = el => Math.round(el.getBoundingClientRect().width);
    const was = rail.classList.contains('is-expanded');

    rail.classList.add('is-expanded');
    const railW = w(rail), shellCol = getComputedStyle(shell).gridTemplateColumns.split(' ')[0];
    rail.classList.remove('is-expanded');
    const railCollapsed = w(rail);
    if (was) rail.classList.add('is-expanded');

    // the label text must actually appear, not just the box get wider
    rail.classList.add('is-expanded');
    const label = rail.querySelector('.v-rail__label');
    const labelShown = label ? Math.round(label.getBoundingClientRect().width) > 0 : false;
    if (!was) rail.classList.remove('is-expanded');

    return { railW, railCollapsed, shellCol, labelShown };
  });

  console.log(JSON.stringify(out));
  if (out.error) { console.log('PROBLEM ' + out.error); }
  else {
    if (out.railW !== 240) console.log(`PROBLEM expanded rail is ${out.railW}px, expected 240`);
    if (out.railCollapsed !== 56) console.log(`PROBLEM collapsed rail is ${out.railCollapsed}px, expected 56`);
    if (!out.labelShown) console.log('PROBLEM expanded rail shows no label text');
    if (!out.shellCol.startsWith('240')) console.log(`PROBLEM shell column is ${out.shellCol}, expected 240px`);
  }
  if (errs.length) console.log('PROBLEM JS error: ' + errs[0]);
  console.log(errs.length ? '' : 'no JS errors');
  await b.close(); srv.close();
});
