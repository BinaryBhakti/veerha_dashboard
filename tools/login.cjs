/**
 * Sign in to the live app once and save the session to .auth.json (git-ignored).
 *
 * Run it in your own terminal, not through an assistant: it asks for the email
 * and password interactively with the password hidden, so neither lands in
 * shell history or a chat transcript. VEERHA_USER / VEERHA_PASS are used
 * instead if they are already set.
 *
 *   node tools/login.cjs
 *
 * Delete .auth.json when the capture is finished.
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH ||
  '/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path'), readline = require('readline');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || 'https://app.veerha.com';
const AUTH = path.join(ROOT, '.auth.json');

function ask(q, hidden) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = s => { if (s.includes(q)) rl.output.write(q); };
    rl.question(q, a => { rl.close(); if (hidden) process.stdout.write('\n'); res(a.trim()); });
  });
}

(async () => {
  const user = process.env.VEERHA_USER || await ask('Email: ');
  const pass = process.env.VEERHA_PASS || await ask('Password (hidden): ', true);
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  // The login page can hold a load event open for a long time; wait for the form, not the page.
  await p.goto(BASE + '/login', { waitUntil: 'commit', timeout: 60000 });
  const email = p.locator('input[type="email"], input[name*="mail" i], input[placeholder*="mail" i]').first();
  await email.waitFor({ timeout: 60000 });
  await email.fill(user);
  await p.locator('input[type="password"]').first().fill(pass);
  await p.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(4000);
  if (/\/login\b/.test(p.url())) { console.log('Sign-in failed — still on', p.url()); await b.close(); process.exit(1); }
  await ctx.storageState({ path: AUTH });
  console.log('Signed in. Session saved to .auth.json (landed on ' + p.url().replace(BASE, '') + ')');
  await b.close();
})();
