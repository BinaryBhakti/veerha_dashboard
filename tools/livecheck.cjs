const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const BASE = process.argv[2];
(async () => { const b = await chromium.launch({ channel: 'chrome' }); const ctx = await b.newContext();
  const seen = new Set(), q = [BASE + '/'], bad = [], errs = [];
  while (q.length) { const u = q.shift(); if (seen.has(u)) continue; seen.add(u);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u.replace(BASE, '') + ': ' + e.message));
    const r = await p.goto(u, { waitUntil: 'load' }).catch(() => null); if (!r || r.status() >= 400) bad.push((r ? r.status() : 'ERR') + ' ' + u.replace(BASE, ''));
    else { const hs = await p.$$eval('a[href]', as => as.map(a => a.href)); for (const h of hs) { const c = h.split('#')[0].split('?')[0]; if (c.startsWith(BASE) && (c.endsWith('.html') || c.endsWith('/')) && !seen.has(c)) q.push(c); } }
    await p.close(); }
  console.log('Live pages crawled:', seen.size); console.log('Bad:', bad.length ? bad.join(', ') : 'none'); console.log('JS errors:', errs.length ? errs.join('\n') : 'none'); await b.close(); })();
