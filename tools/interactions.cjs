/**
 * Deep interaction capture — READ ONLY.
 *
 * The earlier pass reported "133 interaction states" which were really 109
 * command-palette attempts and 24 row clicks: its tab selector looked for
 * role="tab", which this app does not use, so no menu, tab, drawer or modal
 * state was ever captured.
 *
 * This opens things and never commits them. Any control whose label matches
 * MUTATES is recorded in the skip list and NOT clicked -- that list is itself
 * a deliverable: it is the inventory of every destructive action in the product.
 */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), BASE = 'https://app.veerha.com';
const AUTH = path.join(ROOT, '.auth.json');
const CAP = +(process.env.CAP || 18);              // states per route

// Anything that writes, sends, pays, or cannot be undone.
const MUTATES = /\b(delete|remove|discard|send|pay|approve|reject|decline|publish|unpublish|disconnect|revoke|rotate|regenerate|save|submit|confirm|archive|cancel|resend|invite|generate|sync now|run (due|now)|start|upload|import|export|download|merge|assign|convert|book|reschedule|mark done|take over|hire|pause|resume|activate|deactivate|enable|disable|apply|replace)\b/i;
const SAFE_DISMISS = /^(close|cancel|back|dismiss|not now|×|✕)$/i;

fs.mkdirSync(path.join(ROOT, 'audit/states'), { recursive: true });
const slug = s => s.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 60);

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const email = page.locator('input[type="email"], input[name*="mail" i]').first();
  await email.waitFor({ state: 'visible', timeout: 30000 });
  await email.fill(process.env.VEERHA_USER);
  await page.locator('input[type="password"]').first().fill(process.env.VEERHA_PASS);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();
  await page.waitForTimeout(4000);
}
const bounced = p => /\/(login|signin)\b/.test(p.url());

// Wait until the page stops adding controls. Two identical readings 600ms apart
// means the render has finished; 12s is the ceiling for a page that really is
// empty.
async function settle(page, floor = 3000, ceiling = 15000) {
  const t0 = Date.now();
  let prev = -1, stable = 0;
  while (Date.now() - t0 < ceiling) {
    await page.waitForTimeout(600);
    const n = await page.evaluate(() => document.querySelectorAll(
      'button,a[role="button"],[aria-haspopup],summary,[role="menuitem"],[role="combobox"]'
    ).length).catch(() => -1);
    stable = (n === prev) ? stable + 1 : 0;
    prev = n;
    if (stable >= 2 && n > 0 && Date.now() - t0 >= floor) return n;
  }
  return prev;
}

(async () => {
  const routes = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/routes-all.json'), 'utf8'))
    .filter(r => !/^\/(100|counter|month|login|register|forgot-password|reset-password|activate|oauth)/.test(r))
    .filter(r => !r.includes('/stay'));                 // 21 copies of one template
  const donePath = path.join(ROOT, 'audit/.inter-done.json');
  const done = fs.existsSync(donePath) ? JSON.parse(fs.readFileSync(donePath, 'utf8')) : {};

  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({
    ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
    viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  if (!fs.existsSync(AUTH)) { await login(page); await ctx.storageState({ path: AUTH }); }

  // Labels of persistent chrome already captured once. Without this the same
  // sidebar and account menu are shot on all 104 routes and the state count
  // says far more than the research does.
  const chromeSeen = new Set();

  for (const route of routes) {
    const rname = slug(route.replace(/^\//, '') || 'root');
    if (done[rname]) continue;
    const rec = { route, states: [], skipped: [], controls: 0 };
    let shots = 0;

    const shoot = async (tag) => {
      if (shots >= CAP) return false;
      await page.waitForTimeout(420);
      await page.screenshot({ path: path.join(ROOT, 'audit/states', `${rname}--${slug(tag)}.png`) });
      rec.states.push(tag); shots++; return true;
    };

    try {
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 25000 });
      } catch (e) {
        if (!/Timeout/i.test(String(e.message || e))) throw e;
        rec.neverIdle = true;   // a finding: something on this route polls forever
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
      }
      await settle(page);
      if (bounced(page)) { await login(page); await ctx.storageState({ path: AUTH });
                           await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(()=>{});
                           await settle(page); }

      // Inventory every control, and decide what may be touched.
      //
      // Each candidate is TAGGED with data-icap rather than counted. The first
      // version handed back an array index assigned before an empty-label filter
      // and then re-read it after that filter, so every index was off by the
      // number of icon-only buttons above it and each click landed on the wrong
      // element. What survived was the handful of controls that sit at the same
      // low index on all 104 routes -- the sidebar collapse and the account menu
      // -- which is exactly the hollow result it produced: 339 screenshots of two
      // buttons. An attribute cannot drift the way an index can.
      const controls = await page.evaluate(() => {
        const sel = 'button,a[role="button"],[aria-haspopup],summary,[role="menuitem"],[role="combobox"]';
        const out = [];
        document.querySelectorAll('[data-icap]').forEach(e => e.removeAttribute('data-icap'));
        [...document.querySelectorAll(sel)].forEach(e => {
          const label = (e.getAttribute('aria-label') || e.textContent || '')
            .replace(/\s+/g, ' ').trim().slice(0, 48);
          if (!label) return;
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height) return;                  // never rendered
          const id = 'c' + out.length;
          e.setAttribute('data-icap', id);
          // Persistent chrome is identical on every route; capturing it 104 times
          // is what made the last run look productive. Mark it so it is shot once.
          const chrome = !!e.closest('aside,nav,header,[class*="sidebar" i],[class*="topbar" i]');
          out.push({ id, label, chrome, x: Math.round(r.x), y: Math.round(r.y) });
        });
        return out;
      });
      rec.controls = controls.length;
      rec.url = page.url().replace(BASE, '');
      rec.textLen = await page.evaluate(() => document.body.innerText.trim().length).catch(() => 0);
      if (rec.textLen === 0) rec.blank = 'renders nothing at all — readyState complete, zero text';
      else if (rec.textLen < 200) rec.thin = 'almost no text (' + rec.textLen + ' chars)';

      // 1 · menus, dropdowns and anything else that opens
      try {
      const openers = controls.filter(c =>
        !MUTATES.test(c.label) && !SAFE_DISMISS.test(c.label) &&
        !(c.chrome && chromeSeen.has(c.label)));
      // Content first: the chrome is the same everywhere, the page is the point.
      openers.sort((a, b) => (a.chrome - b.chrome) || (a.y - b.y));

      for (const c of openers.slice(0, 14)) {
        const snap = () => page.evaluate(() => ({
          len: document.body ? document.body.innerHTML.length : 0,
          overlays: document.body ? document.querySelectorAll(
            '[role="dialog"],[role="menu"],[role="listbox"],[data-state="open"]').length : 0
        })).catch(() => null);
        const before = await snap();
        if (!before) continue;
        const ok = await page.evaluate((id) => {
          const el = document.querySelector(`[data-icap="${id}"]`);
          if (!el) return false; el.click(); return true;
        }, c.id).catch(() => false);
        if (!ok) continue;
        await page.waitForTimeout(700);
        const after = (await snap()) || before;

        // An overlay appearing counts even when it is small. The old run only
        // accepted a 400-character DOM delta, which a short dropdown never meets.
        const opened = after.overlays > before.overlays || Math.abs(after.len - before.len) > 120;
        if (opened) {
          if (c.chrome) chromeSeen.add(c.label);
          if (!await shoot((c.chrome ? 'chrome-' : 'open-') + c.label)) break;
          await page.keyboard.press('Escape'); await page.waitForTimeout(350);
        }
        if (bounced(page) || !page.url().includes(route.split('?')[0])) {
          await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
          await page.waitForTimeout(900);
          // the DOM was replaced, so every data-icap tag from before is stale
          break;
        }
      }

      } catch (e) { rec.openerErr = String(e.message || e).slice(0, 70); }

      // 2 · tabs, detected structurally (this app does not use role="tab")
      const tabSets = await page.evaluate(() => {
        const groups = [];
        document.querySelectorAll('div,nav,ul').forEach(g => {
          const kids = [...g.children].filter(k => /^(BUTTON|A|LI)$/.test(k.tagName));
          if (kids.length < 2 || kids.length > 7) return;
          const active = kids.filter(k => /active|selected|current|is-on/i.test(k.className) ||
                                          k.getAttribute('aria-current'));
          if (active.length === 1 && kids.every(k => (k.textContent||'').trim().length < 28))
            groups.push(kids.map(k => (k.textContent||'').replace(/\s+/g,' ').trim()));
        });
        return groups.slice(0, 2);
      });
      for (const set of tabSets) {
        for (const label of set.slice(0, 4)) {
          if (MUTATES.test(label)) { rec.skipped.push(label); continue; }
          const clicked = await page.evaluate((t) => {
            const el = [...document.querySelectorAll('button,a,li')]
              .find(e => (e.textContent||'').replace(/\s+/g,' ').trim() === t);
            if (!el) return false; el.click(); return true;
          }, label).catch(() => false);
          if (clicked) { await page.waitForTimeout(900); if (!await shoot('tab-' + label)) break; }
        }
      }

      // 3 · first record
      try {
        const row = await page.$('tbody tr, [role="row"]:not(:first-child), .cursor-pointer');
        if (row) { await row.click({ timeout: 2500 }); await page.waitForTimeout(1800);
                   await shoot('record'); await page.keyboard.press('Escape'); }
      } catch {}

      // 4 · a search that matches nothing
      try {
        const s = await page.$('input[placeholder*="Search" i]');
        if (s) { await s.fill('zzzqqq'); await page.waitForTimeout(1100); await shoot('no-results'); await s.fill(''); }
      } catch {}

      rec.skipped.push(...controls.filter(c => MUTATES.test(c.label)).map(c => c.label));
      rec.skipped = [...new Set(rec.skipped)];
    } catch (e) { rec.fatal = String(e.message || e).slice(0, 90); }

    done[rname] = rec;
    fs.writeFileSync(donePath, JSON.stringify(done, null, 1));
    console.log(`  ${String(Object.keys(done).length).padStart(3)}/${routes.length} ${route.padEnd(30)} ctl:${String(rec.controls).padStart(3)} txt:${String(rec.textLen||0).padStart(5)} states:${rec.states.length} skipped:${rec.skipped.length}${rec.fatal ? ' FATAL' : ''}${rec.blank ? ' BLANK' : ''}${rec.thin ? ' THIN' : ''}${rec.neverIdle ? ' NO-IDLE' : ''}`);
  }
  await b.close();
  console.log('interaction capture complete');
})();
