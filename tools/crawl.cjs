/**
 * Veerha live-site capture — READ ONLY.
 *
 * Navigates, hovers and opens menus/drawers/tabs. It never submits a form
 * (other than the sign-in), never books, pays, messages or changes a setting.
 *
 * Credentials come from the environment and are never written to disk. The
 * session lands in .auth.json, which is deleted when the capture finishes.
 *
 *   MODE=login     log in, save .auth.json, list routes -> audit/routes.json
 *   MODE=capture   full capture using the saved session
 */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || 'https://app.veerha.com';
const AUTH = path.join(ROOT, '.auth.json');
const MODE = process.env.MODE || 'login';

const dirs = ['audit/screens', 'audit/screens-mobile', 'audit/text', 'audit/states'];
dirs.forEach(d => fs.mkdirSync(path.join(ROOT, d), { recursive: true }));

const slug = u => (u.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '') || 'root')
  .replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);

/* A session that has dropped lands on /login with HTTP 200, so the URL is the
   only reliable signal. */
const AUTH_ROUTES = /^\/(login|register|forgot-password|reset-password|activate)\b/;
const bounced = (p, route) => AUTH_ROUTES.test(route || '') ? false
  : /\/(login|signin|sign-in)\b/.test(p.url());

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const email = page.locator('input[type="email"], input[name*="mail" i], input[placeholder*="mail" i]').first();
  const pass  = page.locator('input[type="password"]').first();
  await email.waitFor({ timeout: 8000 }).catch(() => { throw new Error('no login form here'); });
  await email.fill(process.env.VEERHA_USER);
  await pass.fill(process.env.VEERHA_PASS);
  await Promise.all([
    page.waitForLoadState('networkidle').catch(() => {}),
    page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first().click(),
  ]);
  await page.waitForTimeout(4000);
  return !bounced(page);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });

  if (MODE === 'login') {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const ok = await login(page).catch(() => false);
    console.log('login:', ok ? 'OK' : 'FAILED', '· landed on', page.url());
    if (!ok) { await browser.close(); process.exit(1); }
    await ctx.storageState({ path: AUTH });
    console.log('session saved to .auth.json');

    /* Routes come from three places: what we captured last time, what the app
       links to now, and what its JS bundles mention but nothing links to --
       that last sweep is what surfaced unreachable routes on the first crawl. */
    const known = new Set();
    try { JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/inventory.json'), 'utf8'))
      .forEach(r => known.add(r.url)); } catch {}

    const linked = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    linked.filter(h => h && h.startsWith('/')).forEach(h => known.add(h.split('?')[0].split('#')[0]));

    const scripts = await page.$$eval('script[src]', ss => ss.map(s => s.src));
    let fromBundle = 0;
    for (const src of scripts) {
      try {
        const body = await (await page.request.get(src)).text();
        (body.match(/"\/[a-z0-9][a-z0-9\-/_:]{2,60}"/gi) || []).forEach(m => {
          const r = m.slice(1, -1);
          if (/\.(js|css|png|svg|jpg|json|woff2?)$/i.test(r)) return;
          if (/^\/(api|_next|static|assets)\b/.test(r)) return;
          if (!known.has(r)) { known.add(r); fromBundle++; }
        });
      } catch {}
    }
    const routes = [...known].filter(r => !r.includes(':')).sort();
    fs.writeFileSync(path.join(ROOT, 'audit/routes.json'), JSON.stringify(routes, null, 1));
    console.log(`routes: ${routes.length} total · ${fromBundle} new from the JS bundles · ${scripts.length} bundles swept`);
    await browser.close();
    return;
  }

  /* ------------------------------------------------------------- discover2 */
  /* The first pass harvested links from the landing page only, so sidebar
     entries that live on inner pages (Setup Guide, Shared Resources, Rules)
     were never found. This walks a spread of inner pages and unions their
     links into routes.json. */
  if (MODE === 'discover2') {
    const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
    const seeds = ['/', '/settings/workspace/branding', '/memory', '/billing', '/properties',
                   '/sequences', '/channels', '/leads', '/opportunities', '/analytics'];
    const routes = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/routes.json'), 'utf8')));
    const before = routes.size;
    for (const seed of seeds) {
      const page = await ctx.newPage();
      try {
        await page.goto(BASE + seed, { waitUntil: 'networkidle', timeout: 40000 });
        await page.waitForTimeout(900);
        if (bounced(page, seed)) { await login(page).catch(() => {}); await ctx.storageState({ path: AUTH });
                             await page.goto(BASE + seed, { waitUntil: 'networkidle' }); }
        const hrefs = await page.$$eval('a[href], [role="link"][href]', as => as.map(a => a.getAttribute('href')));
        hrefs.filter(h => h && h.startsWith('/')).forEach(h => routes.add(h.split('#')[0]));
      } catch {}
      await page.close();
    }
    const list = [...routes].filter(r => !r.includes(':')).sort();
    fs.writeFileSync(path.join(ROOT, 'audit/routes.json'), JSON.stringify(list, null, 1));
    console.log(`routes: ${list.length} (+${list.length - before} from inner pages)`);
    await browser.close();
    return;
  }

  /* ---------------------------------------------------------------- capture */
  const routes = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/routes.json'), 'utf8'))
    .filter(r => !/^\/(100|counter|month)$/.test(r));           // bundle noise, not routes
  const donePath = path.join(ROOT, 'audit/.crawl-done.json');
  const done = fs.existsSync(donePath) ? JSON.parse(fs.readFileSync(donePath, 'utf8')) : {};
  const log = [];

  const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });

  for (const route of routes) {
    const name = slug(route);
    if (done[name]) continue;
    const rec = { route, name };
    try {
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => errs.push('nav ' + e.message));
      await page.waitForTimeout(1200);

      if (bounced(page, route)) {
        // session dropped mid-crawl: sign in again and retry once
        const ok = await login(page).catch(() => false);
        if (ok) { await ctx.storageState({ path: AUTH });
                  await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
                  await page.waitForTimeout(1200); }
        rec.relogin = true;
      }

      rec.finalUrl = page.url().replace(BASE, '');
      rec.h1 = await page.evaluate(() => (document.querySelector('h1') || {}).innerText || '').catch(() => '');
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      fs.writeFileSync(path.join(ROOT, 'audit/text', name + '.txt'), text);
      rec.chars = text.length;
      await page.screenshot({ path: path.join(ROOT, 'audit/screens', name + '.png'), fullPage: true });

      /* Interaction states -- opening things only. Nothing is submitted. */
      const states = [];
      const shotState = async (tag) => {
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(ROOT, 'audit/states', name + '--' + tag + '.png') });
        states.push(tag);
      };
      // in-page tabs
      const tabs = await page.$$('[role="tab"], .tab:not(.is-active), [data-tab]');
      for (let i = 0; i < Math.min(tabs.length, 4); i++) {
        try { await tabs[i].click({ timeout: 2500 }); await shotState('tab' + i); } catch {}
      }
      // first row / card -> detail
      try {
        const row = await page.$('tbody tr, [role="row"]:not(:first-child), .card a, li a[href^="/"]');
        if (row) { await row.click({ timeout: 2500 }); await page.waitForTimeout(1600); await shotState('detail'); }
      } catch {}
      // command palette
      try { await page.keyboard.press('Meta+k'); await shotState('palette'); await page.keyboard.press('Escape'); } catch {}
      rec.states = states;
      rec.errors = errs.slice(0, 3);
      await page.close();

      // mobile shot on the SAME context — resized, not a second session
      const mp = await ctx.newPage();
      await mp.setViewportSize({ width: 390, height: 844 });
      await mp.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await mp.waitForTimeout(1200);
      await mp.screenshot({ path: path.join(ROOT, 'audit/screens-mobile', name + '.png'), fullPage: true });
      await mp.close();
    } catch (e) {
      rec.fatal = String(e.message || e).slice(0, 120);
    }
    rec.ok = AUTH_ROUTES.test(route) ||
             (!/\/(login|signin)/.test(rec.finalUrl || '') && !/welcome back/i.test(rec.h1 || ''));
    if (rec.ok) { done[name] = rec; } else { console.log('      ! bounced to login, will retry: ' + route); }
    log.push(rec);
    fs.writeFileSync(donePath, JSON.stringify(done, null, 1));
    console.log(`  ${String(Object.keys(done).length).padStart(3)}/${routes.length}  ${route.padEnd(34)} ${rec.h1 ? '· ' + rec.h1.slice(0,28) : ''}${rec.states && rec.states.length ? ' [' + rec.states.join(',') + ']' : ''}${rec.fatal ? ' FATAL ' + rec.fatal : ''}`);
  }

  fs.writeFileSync(path.join(ROOT, 'audit/inventory-new.json'), JSON.stringify(Object.values(done), null, 1));
  await browser.close();
  console.log('capture complete:', Object.keys(done).length, 'routes');
})();
