/**
 * October re-check of the live app — READ ONLY, uses the session from tools/login.cjs.
 *
 * It only navigates and reads. It never clicks a control, so it cannot submit,
 * send, pay or change a setting. Output goes to audit/oct/ (git-ignored: it is
 * a live account and the page text carries real customer records).
 *
 *   1. reads the sidebar, top tabs and section rails as this role/edition sees them
 *   2. sweeps every loaded JS bundle for route strings
 *   3. visits each route once: full-page PNG + page text + nav structure
 *
 *   node tools/recon.cjs            ROUTES="/a,/b" limits step 3 to those routes
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH ||
  '/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), BASE = 'https://app.veerha.com';
const AUTH = path.join(ROOT, '.auth.json'), OUT = path.join(ROOT, 'audit/oct');
['shots', 'text'].forEach(d => fs.mkdirSync(path.join(OUT, d), { recursive: true }));
if (!fs.existsSync(AUTH)) { console.log('No .auth.json — run: node tools/login.cjs'); process.exit(1); }

const slug = r => (r.replace(/^\/+/, '') || 'root').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);
const SKIP = /^\/(login|logout|register|forgot-password|reset-password|activate|verify-email|oauth|auth|q|p|s|f|pref|book|api|superadmin|system)\b|:/;

// Everything that looks like navigation, grouped by where it sits on the page.
const readNav = () => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const links = sel => [...document.querySelectorAll(sel)].filter(vis)
    .map(a => ({ t: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 60), h: a.getAttribute('href') }))
    .filter(x => x.t || x.h);
  return {
    sidebar: links('aside a[href], nav a[href]'),
    tabs: [...document.querySelectorAll('[role=tab], [class*="tab" i] a, [class*="tab" i] button')].filter(vis)
      .map(e => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean),
    h1: (document.querySelector('h1') || {}).innerText || '',
    allLinks: [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')),
  };
};

// The app can hold its load event open for a long time, so wait for the
// response, then for the network to settle, with a ceiling on both.
async function go(page, r) {
  const resp = await page.goto(BASE + r, { waitUntil: 'commit', timeout: 60000 }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // A client-rendered page answers 200 while still showing a spinner; wait for words.
  await page.waitForFunction(() => { const t = document.body.innerText.trim();
    return t.length > 60 && !/^Loading/.test(t); }, null, { timeout: +(process.env.WAIT || 25000) }).catch(() => {});
  await page.waitForTimeout(1200);
  return resp;
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
  const bundles = new Map();
  ctx.on('response', async r => {
    if (/\.js(\?|$)/.test(r.url()) && r.url().startsWith(BASE)) { try { bundles.set(r.url(), await r.text()); } catch {} }
  });

  const p = await ctx.newPage();
  await go(p, '/leads');   // the dashboard can sit on "Loading…"; Leads carries the same sidebar
  if (/\/login\b/.test(p.url())) { console.log('Session not valid — run node tools/login.cjs again'); process.exit(1); }
  const home = await p.evaluate(readNav);
  fs.writeFileSync(path.join(OUT, 'menu.json'), JSON.stringify(home, null, 1));

  const routes = new Set();
  const addR = h => { if (!h) return; const r = h.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
    if (r.startsWith('/') && !SKIP.test(r)) routes.add(r); };
  home.allLinks.forEach(addR);
  for (const body of bundles.values())
    (body.match(/["'`]\/[a-z][a-z0-9\-/_]{1,60}["'`]/gi) || []).map(m => m.slice(1, -1))
      .filter(x => !/\.(js|css|png|svg|jpe?g|json|woff2?|ico|webp)$/i.test(x) && !/^\/(_next|static|assets)\b/.test(x))
      .forEach(addR);

  let queue = process.env.ROUTES ? process.env.ROUTES.split(',') : [...routes].sort();
  const seen = new Set(), log = {};
  while (queue.length) {
    const r = queue.shift(); if (seen.has(r)) continue; seen.add(r);
    const pg = await ctx.newPage();
    const resp = await go(pg, r);
    const final = pg.url().replace(BASE, '');
    if (/\/login\b/.test(final)) { log[r] = { bounced: true }; console.log('BOUNCED', r); await pg.close(); continue; }
    const nav = await pg.evaluate(readNav).catch(() => ({ allLinks: [] }));
    const text = await pg.evaluate(() => document.body.innerText).catch(() => '');
    await pg.screenshot({ path: path.join(OUT, 'shots', slug(r) + '.png'), fullPage: true }).catch(() => {});
    fs.writeFileSync(path.join(OUT, 'text', slug(r) + '.txt'), text);
    log[r] = { status: resp && resp.status(), final, h1: nav.h1.slice(0, 80), tabs: [...new Set(nav.tabs)].slice(0, 20),
               sidebar: nav.sidebar ? nav.sidebar.length : 0 };
    // follow section-rail links the menu never showed (Marketing, Settings)
    if (!process.env.ROUTES) (nav.allLinks || []).forEach(h => { const x = (h || '').split(/[?#]/)[0].replace(/\/$/, '');
      if (x && !SKIP.test(x) && !seen.has(x) && !queue.includes(x) && !/[0-9a-f]{8}-/.test(x)) queue.push(x); });
    console.log(String(Object.keys(log).length).padStart(3), r, '->', final, '|', log[r].h1);
    await pg.close();
  }
  fs.writeFileSync(path.join(OUT, 'recon.json'), JSON.stringify(log, null, 1));
  fs.writeFileSync(path.join(OUT, 'routes-app.json'), JSON.stringify([...seen].sort(), null, 1));
  console.log('\nvisited', seen.size, '· bounced', Object.values(log).filter(x => x.bounced).length);
  await b.close();
})();
