/* Drive the walkthrough like a user: the main journeys with assertions on
   screens, layers and bound numbers, then a smoke pass that clicks every wired
   control on every screen and fails on a JS error or a click that does nothing.

     node tools/journeys.cjs            journeys + smoke
     node tools/journeys.cjs --quick    journeys only
     URL=https://…/screens/walkthrough node tools/journeys.cjs   against a deploy

   A click "does something" if it changes the screen, opens a layer or menu, or
   shows a toast. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH ||
  '/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
const BASE = process.env.URL || 'file://' + path.resolve(__dirname, '..', 'screens/walkthrough.html');

let fails = 0;
const ok = (cond, msg) => { if (cond) console.log('  ok    ' + msg); else { fails++; console.log('  FAIL  ' + msg); } };

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const errs = [];
  const fresh = async (hash) => {
    const p = await b.newPage({ viewport: { width: 1440, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '#' + hash, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    return p;
  };
  const val = (p, sel) => p.$eval(sel, e => e.textContent.trim()).catch(() => null);
  const screen = p => p.evaluate(() => document.querySelector('.wt-screen.is-on').dataset.screen);
  const layers = p => p.evaluate(() => [...document.querySelectorAll('.wt-layer')].filter(l => !l.hidden).map(l => l.dataset.layer));
  const shown = (p, sel) => p.$eval(sel, e => !e.hidden).catch(() => false);
  const click = async (p, sel) => { await p.click(sel); await p.waitForTimeout(250); };

  console.log('J2 · convert a lead');
  let p = await fresh('leads');
  await click(p, 'tr[data-lead="LEAD-0129"] td:nth-child(2)');
  ok((await layers(p)).includes('lead'), 'row opens the lead drawer');
  await click(p, '.wt-layer[data-layer="lead"] [data-open="convert"]');
  ok((await layers(p)).includes('convert'), 'Convert opens the modal');
  await click(p, '.wt-layer[data-layer="convert"] [data-do="convert"]');
  ok(await screen(p) === 'opportunities', 'lands on Opportunities');
  ok(await val(p, '[data-screen="leads"] [data-bind="leads"]') === '26', 'Leads 27 → 26');
  ok(await val(p, '[data-screen="opportunities"] [data-bind="opps"]') === '61', 'Deals 60 → 61');
  ok(await shown(p, '[data-screen="opportunities"] tr[data-when="arjun.converted"]'), 'his deal row appears');
  await click(p, '[data-vf-undo]');
  ok(await val(p, '[data-screen="leads"] [data-bind="leads"]') === '27', 'Undo restores 27');
  await p.close();

  console.log('A3 / J6 · mail views from the dashboard');
  p = await fresh('dashboard');
  await click(p, '[data-screen="dashboard"] [data-go="mail"][data-view="needs-reply"]');
  ok(await screen(p) === 'mail', 'Needs reply opens Mail');
  ok((await val(p, '[data-screen="mail"] [data-view-tab].is-active')).startsWith('Needs reply'), 'on the Needs reply view');
  await click(p, '[data-screen="mail"] [data-thread][data-ctx-name="Nandini Gokhale"]');
  ok(await val(p, '[data-screen="mail"] [data-bind="ctx.subject"]') === 'Menus for the 28th?', 'selecting a thread fills the reading pane');
  await click(p, '[data-screen="mail"] [data-do="mail-send"]');
  ok(await val(p, '[data-screen="dashboard"] [data-bind="needsReply"]') === '3', 'Needs reply 4 → 3 on the dashboard');
  await p.close();

  console.log('J5 / J7 · review queue and tasks');
  p = await fresh('review');
  await click(p, '[data-screen="review"] [data-card="review-1"] [data-do="approve"]');
  ok(await val(p, '#wtRail [data-bind="waiting"]') === '19', 'approve: Waiting on you 20 → 19');
  await click(p, '#wtRail [data-go="tasks"]');
  await click(p, '[data-screen="tasks"] [data-card="task-2"] [data-do="task-done"]');
  ok(await val(p, '#wtRail [data-bind="tasks"]') === '9', 'done: Tasks 10 → 9');
  await p.close();

  console.log('J3 / J9 / J1 / J4 · quote, add lead, start my day, take over');
  p = await fresh('dashboard');
  await click(p, '[data-screen="dashboard"] [data-open="new-quote"]');
  await click(p, '.wt-layer[data-layer="new-quote"] [data-open="quote-items"]');
  ok((await layers(p)).join() === 'quote-items', 'a step replaces its dialog');
  await click(p, '.wt-layer[data-layer="quote-items"] [data-open="quote-send"]');
  await click(p, '.wt-layer[data-layer="quote-send"] [data-do="quote-send"]');
  ok(await shown(p, '[data-screen="quotes"] tr[data-when="quote.sent"]'), 'sent quote appears in Quotations');
  await p.evaluate(() => window.wtGo('dashboard')); await p.waitForTimeout(200);
  await click(p, '[data-screen="dashboard"] [data-open="new-lead"]');
  await click(p, '.wt-layer[data-layer="new-lead"] [data-do="lead-new"]');
  ok(await val(p, '[data-screen="leads"] [data-bind="leads"]') === '28', 'add lead: 27 → 28');
  await p.evaluate(() => window.wtGo('dashboard')); await p.waitForTimeout(200);
  await click(p, '[data-screen="dashboard"] [data-do="start-day"]');
  ok(await screen(p) === 'review', 'Start my day opens the first item');
  await click(p, '[role="status"] .v-btn--primary');
  ok(await screen(p) === 'tasks', 'Next walks to the second');
  await click(p, '[role="status"] .v-btn--ghost');
  await p.evaluate(() => window.wtGo('inbox')); await p.waitForTimeout(200);
  await click(p, '[data-screen="inbox"] [data-do="takeover"]');
  ok(await shown(p, '[data-screen="inbox"] [data-do="handback"]'), 'take over shows Hand back');
  await p.close();

  if (!process.argv.includes('--quick')) {
    console.log('Smoke · every wired control on every screen');
    p = await fresh('dashboard');
    const ids = await p.evaluate(() => [...document.querySelectorAll('.wt-screen[data-screen]')].map(s => s.dataset.screen).filter(i => i !== 'soon'));
    let clicked = 0, silent = [];
    for (const id of ids) {
      await p.evaluate(i => { window.VF && VF.closeAll(); window.wtGo(i); }, id); await p.waitForTimeout(120);
      const n = await p.evaluate(i => document.querySelectorAll('[data-screen="' + i + '"] [data-w]').length, id);
      for (let k = 0; k < n; k++) {
        const before = await p.evaluate(() => [document.querySelector('.wt-screen.is-on').dataset.screen,
          [...document.querySelectorAll('.wt-layer')].filter(l => !l.hidden).length, document.querySelectorAll('.v-toast').length,
          document.querySelectorAll('.v-menu:not([hidden])').length].join('|'));
        const r = await p.evaluate(([i, k]) => {
          const el = document.querySelectorAll('[data-screen="' + i + '"] [data-w]')[k];
          if (!el || el.offsetParent === null || el.disabled) return null;   // disabled is a state, not a dead button
          const t = (el.getAttribute('aria-label') || el.textContent).replace(/\s+/g, ' ').trim().slice(0, 40);
          el.click(); return t;
        }, [id, k]);
        if (r === null) continue;
        clicked++; await p.waitForTimeout(60);
        const after = await p.evaluate(() => [document.querySelector('.wt-screen.is-on').dataset.screen,
          [...document.querySelectorAll('.wt-layer')].filter(l => !l.hidden).length, document.querySelectorAll('.v-toast').length,
          document.querySelectorAll('.v-menu:not([hidden])').length].join('|'));
        if (after === before) silent.push(id + ': ' + r);
        await p.evaluate(i => { window.VF && VF.closeAll(); document.querySelectorAll('.v-menu').forEach(m => m.hidden = true);
          document.querySelectorAll('.v-toast').forEach(t => t.remove()); if (document.querySelector('.wt-screen.is-on').dataset.screen !== i) window.wtGo(i); }, id);
      }
    }
    ok(clicked > 500, clicked + ' controls clicked across ' + ids.length + ' screens');
    ok(!silent.length, silent.length ? silent.length + ' clicks did nothing visible: ' + silent.slice(0, process.env.ALL ? 999 : 8).join(' · ') : 'every click did something');
    await p.close();
  }

  ok(!errs.length, errs.length ? 'JS errors: ' + [...new Set(errs)].slice(0, 5).join(' | ') : 'no JS errors');
  console.log(fails ? `\n${fails} FAILED` : '\nALL JOURNEYS PASS');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
