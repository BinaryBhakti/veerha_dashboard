/* Render-check the design-system pages. Lived in the scratchpad and was lost
   when that got cleaned, so it belongs in tools/ with everything else. */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MT = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
             '.js':'text/javascript; charset=utf-8', '.woff2':'font/woff2', '.png':'image/png' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { const b = fs.readFileSync(f);
        r.writeHead(200, { 'Content-Type': MT[path.extname(f)] || 'application/octet-stream' }); r.end(b); }
  catch { r.writeHead(404); r.end('x'); }
});
(async () => {
  await new Promise(s => srv.listen(8809, s));
  const b = await chromium.launch({ channel: 'chrome' });
  let bad = 0;
  for (const f of ['index','foundations','components','patterns','spec','departures']) {
    const p = await b.newPage({ viewport: { width: 1512, height: 900 } });
    const errs = [], fails = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('requestfailed', r => fails.push(r.url()));
    await p.goto(`http://127.0.0.1:8809/design-system/${f}.html`, { waitUntil: 'networkidle' });
    const res = await p.evaluate(() => {
      let ov = 0;
      document.querySelectorAll('*').forEach(e => {
        if (e instanceof SVGElement) return;           // SVG clientWidth is meaningless
        if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 &&
            getComputedStyle(e).overflowX === 'visible') ov++;
      });
      const u = [...document.querySelectorAll('use')]
        .filter(x => { const i = x.getAttribute('href'); return i && !document.querySelector(i); }).length;
      return { ov, u, g: document.fonts.check('12px Geist') };
    });
    const ok = !res.ov && !res.u && res.g && !errs.length && !fails.length;
    if (!ok) bad++;
    console.log(` ${ok ? 'ok  ' : 'FAIL'} ${f.padEnd(13)} overflow:${res.ov} unresolved-use:${res.u} font:${res.g} errs:${errs.length} failedReq:${fails.length}`);
    await p.close();
  }
  console.log(bad ? `  ${bad} PROBLEM(S)` : '  design-system: all pages clean');
  await b.close(); srv.close();
})();
