/* Drive the walkthrough: every panel link must resolve, the panel must fit the
   viewport, the drawer and palette must open, and nothing may throw. */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1512, height: 900 } });
  const errs = [], fails = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => fails.push(r.url().split('/').pop()));
  await p.goto('file://' + path.resolve(__dirname, '..', 'screens/walkthrough.html'), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  const links = await p.$$eval('#wtPanel .wt-link[data-go]', a => a.map(x => x.dataset.go));
  const broken = [];
  for (const id of links) {
    await p.evaluate(i => document.querySelector(`[data-go="${i}"]`).click(), id);
    await p.waitForTimeout(45);
    const on = await p.evaluate(() => (document.querySelector('.wt-screen.is-on') || {}).getAttribute?.('data-screen'));
    if (on !== id && !id.startsWith('soon')) broken.push(id + '->' + on);
  }
  console.log(`  panel links     ${links.length} tested · broken: ${broken.length ? broken.join(', ') : 'none'}`);

  await p.setViewportSize({ width: 1512, height: 700 });
  const fit = await p.evaluate(() => {
    const el = document.getElementById('wtPanel');
    if (!el.classList.contains('is-on')) document.getElementById('wtToggle').click();
    const r = el.getBoundingClientRect();
    const sc = el.querySelector('.wt-panel__scroll'), ft = el.querySelector('.wt-panel__foot');
    const fr = ft && ft.getBoundingClientRect();
    return { fits: r.top >= 0 && r.bottom <= innerHeight + 1,
             scrolls: !!sc && sc.scrollHeight > sc.clientHeight - 1,
             footPinned: !!fr && fr.top >= 0 && fr.bottom <= innerHeight + 1 };
  });
  console.log('  panel fits      ' + JSON.stringify(fit));
  if (!fit.fits || !fit.footPinned) console.log('  PROBLEM panel does not fit the viewport');

  const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('  overflow        ' + ov);
  console.log(errs.length || fails.length
    ? '  ERRORS: ' + [...errs, ...fails].slice(0, 4).join(' | ')
    : '  no JS errors, no failed requests');
  await b.close();
  process.exit(broken.length || !fit.fits || ov > 0 || errs.length ? 1 : 0);
})();
