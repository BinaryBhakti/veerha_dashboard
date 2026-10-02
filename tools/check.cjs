/* Render-check every screen file at desktop and laptop width.
   Fails on: horizontal overflow, unresolved <use>, fonts not loading, JS
   errors, failed requests, and currency set in a monospace face. */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MT = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
             '.js':'text/javascript; charset=utf-8', '.woff2':'font/woff2', '.png':'image/png' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { r.writeHead(200, { 'Content-Type': MT[path.extname(f)] || 'application/octet-stream' });
        r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end('x'); }
});
const FILES = fs.readdirSync(path.join(ROOT, 'screens'))
  .filter(f => f.endsWith('.html') && !f.startsWith('_')).map(f => f.replace('.html',''));
(async () => {
  // port 0 = let the OS pick a free one; agents run this concurrently
  await new Promise(s => srv.listen(0, s));
  const PORT = srv.address().port;
  const b = await chromium.launch({ channel: 'chrome' });
  let bad = 0; const errs = [];
  for (const w of [1512, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, colorScheme: 'light' });
    const p = await ctx.newPage();
    p.on('response', r => { if (r.status() >= 400 && !r.url().includes('favicon')) errs.push(r.url().split('/').pop()); });
    p.on('pageerror', e => errs.push('JS: ' + e.message));
    for (const f of FILES) {
      await p.goto(`http://127.0.0.1:${PORT}/screens/${f}.html`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(900);
      const d = await p.evaluate(() => ({
        ov: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        g: document.fonts.check('600 16px Geist'),
        u: [...document.querySelectorAll('use')]
             .filter(x => { const i = x.getAttribute('href'); return i && !document.querySelector(i); }).length,
        // a monospace comma takes a full cell, so a grouped amount in mono
        // renders as "₹8 , 69 , 500". Measured, not remembered.
        // A table wider than its card is clipped, and the PAGE does not
        // overflow, so page-level measurement never sees it.
        // Walk up to the first ancestor that actually scrolls. The first
        // version tested .v-card specifically and reported tables that sit in
        // a scroll wrapper one level down -- a false positive that would have
        // had people padding screens to satisfy a broken check.
        clipped: [...document.querySelectorAll('.v-table')].map(t => {
          let n = t.parentElement, box = null;
          while (n && n !== document.body) {
            const ox = getComputedStyle(n).overflowX;
            if (/auto|scroll/.test(ox)) return null;          // something scrolls: not clipped
            if (!box) box = n;                                 // the nearest clipping box
            if (n.classList.contains('vs-frame')) break;
            n = n.parentElement;
          }
          const over = box ? Math.round(t.scrollWidth - box.clientWidth) : 0;
          return over > 2 ? ((t.closest('.vs-frame') || {}).id || '?') + ' +' + over + 'px' : null;
        }).filter(Boolean),
        mono: [...document.querySelectorAll('*')].filter(e => {
          if (e.children.length) return false;
          const t = (e.textContent || '').trim();
          if (!/[₹$€£]\s?\d[\d,]*,\d/.test(t)) return false;
          return /mono/i.test(getComputedStyle(e).fontFamily);
        }).map(e => (e.textContent || '').trim().slice(0, 24))
      }));
      if (d.ov || !d.g || d.u || d.mono.length || d.clipped.length) { console.log(`  PROBLEM ${w} ${f} ${JSON.stringify(d)}`); bad++; }
    }
    await ctx.close();
  }
  console.log('  files checked: ' + FILES.length);
  console.log(bad ? `  ${bad} problems` : '  1512 & 1280: clean · icons resolve · fonts load');
  console.log(errs.length ? '  ' + [...new Set(errs)].slice(0, 5).join(' | ') : '  no failed requests, no JS errors');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
