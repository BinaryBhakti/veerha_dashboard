// Crawl from hub.html over file:// after JS render; report broken local links and unreachable pages.
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const start = 'file://' + path.join(ROOT, 'hub.html');
  const seen = new Set(), queue = [start], broken = new Map(), errors = [];
  while (queue.length) {
    const url = queue.shift(); if (seen.has(url)) continue; seen.add(url);
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(path.relative(ROOT, new URL(url).pathname) + ': ' + e.message));
    await p.goto(url, { waitUntil: 'load' }).catch(() => {}); await p.waitForTimeout(250);
    const hrefs = await p.$$eval('a[href]', as => as.map(a => a.href));
    for (const h of hrefs) {
      if (!h.startsWith('file://')) continue;
      const clean = h.split('#')[0].split('?')[0];
      if (!clean.endsWith('.html')) continue;
      const f = decodeURIComponent(new URL(clean).pathname);
      if (!fs.existsSync(f)) { const k = path.relative(ROOT, f); if (!broken.has(k)) broken.set(k, new Set()); broken.get(k).add(path.relative(ROOT, new URL(url).pathname)); }
      else if (!seen.has(clean)) queue.push(clean);
    }
    await p.close();
  }
  // Veerha's pages: one dashboard at the root, plus screens/, design-system/ and audit/.
  // _partials.html is an authoring reference and never ships, so it is not expected to be reachable.
  // Not expected to be reachable, and not shipped: _partials is an authoring
  // reference, the dashboard copy is byte-identical to the original, and
  // audit/index.html is the internal inventory that gallery.html replaces.
  const SKIP = new Set(['screens/_partials.html', 'veerha-dashboard copy.html',
                        'audit/index.html', 'audit/features.html']);
  const dir = d => { try { return fs.readdirSync(path.join(ROOT, d)).map(f => d + '/' + f); } catch { return []; } };
  const all = [...fs.readdirSync(ROOT), ...dir('screens'), ...dir('design-system'), ...dir('audit')]
    .filter(f => f.endsWith('.html') && !SKIP.has(f));
  const reached = new Set([...seen].map(u => path.relative(ROOT, decodeURIComponent(new URL(u).pathname))));
  console.log('Pages reached:', reached.size);
  console.log('Unreachable pages:', all.filter(f => !reached.has(f)).join(', ') || 'none');
  console.log('Broken links:'); for (const [k, v] of broken) console.log('  ' + k + '  <- ' + [...v].slice(0, 6).join(', '));
  if (!broken.size) console.log('  none');
  console.log('JS errors:', errors.length ? '\n  ' + errors.join('\n  ') : 'none');
  await b.close();
})();
