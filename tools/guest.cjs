/**
 * Capture the public guest pages — READ ONLY, and deliberately with NO session.
 *
 * These pages are what a customer opens from a WhatsApp message: unauthenticated,
 * on a phone. Capturing them logged-in would show a different page, so this runs
 * in a clean context with no storageState.
 *
 * It never submits anything: no check-in, no review, no accepting a quotation.
 */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const links = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/guest-links.json'), 'utf8'));
['audit/guest', 'audit/guest-mobile', 'audit/guest-text'].forEach(d =>
  fs.mkdirSync(path.join(ROOT, d), { recursive: true }));

const slug = u => u.replace(/^https?:\/\/[^/]+\//, '').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 70);

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const out = [];
  // one clean context, no storageState — a customer has no session
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });

  const targets = [];
  for (const [kind, urls] of Object.entries(links))
    urls.forEach(u => {
      targets.push([kind, u]);
      if (kind === 's') { targets.push(['s-checkin', u + '/check-in']); targets.push(['s-review', u + '/review']); }
    });

  for (const [kind, url] of targets) {
    const name = slug(url);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    let status = null;
    try {
      const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      status = r && r.status();
    } catch (e) { errs.push('nav ' + e.message.slice(0, 60)); }
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => document.body.innerText).catch(() => '');
    const h1 = await page.evaluate(() => (document.querySelector('h1,h2') || {}).innerText || '').catch(() => '');
    fs.writeFileSync(path.join(ROOT, 'audit/guest-text', name + '.txt'), text);
    await page.screenshot({ path: path.join(ROOT, 'audit/guest', name + '.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(ROOT, 'audit/guest-mobile', name + '.png'), fullPage: true });
    await page.close();
    out.push({ kind, url, name, status, h1: h1.trim().slice(0, 60), chars: text.length, errs: errs.slice(0, 2) });
    console.log(`  ${kind.padEnd(9)} ${String(status).padEnd(4)} ${String(text.length).padStart(6)} ch  ${h1.trim().slice(0, 44)}`);
  }
  fs.writeFileSync(path.join(ROOT, 'audit/guest-capture.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
