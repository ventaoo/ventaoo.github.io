/**
 * Headless verification harness.
 *
 * Since screenshots can't be eyeballed here, this script:
 *   1. renders every route and converts the screenshot into an ASCII luminance map
 *   2. runs functional assertions (interactions, a11y basics, overflow, contrast)
 *   3. reports console/page errors
 *
 *   node scripts/verify.mjs [baseUrl]
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  process.env.CHROME_PATH,
  path.join(
    os.homedir(),
    'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  ),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No Chromium found');
  process.exit(1);
}

const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const RAMP = ' .:-=+*#%@';

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const blank = await browser.newPage();

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('[console] ' + m.text());
});
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

/** Decode a PNG buffer inside the browser and return a coarse ASCII map. */
async function ascii(buffer, cols = 96) {
  return blank.evaluate(
    async ({ b64, cols, ramp, aspect }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const rows = Math.max(8, Math.round((cols * img.height * aspect) / img.width));
      const c = document.createElement('canvas');
      c.width = cols;
      c.height = rows;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, cols, rows);
      const d = ctx.getImageData(0, 0, cols, rows).data;
      const lums = [];
      for (let i = 0; i < d.length; i += 4) {
        lums.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
      }
      // min/max stretch: a dark UI hides all its detail otherwise
      const lo = Math.min(...lums);
      const hi = Math.max(...lums);
      const span = Math.max(0.02, hi - lo);
      let out = '';
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < cols; x++) {
          const v = (lums[y * cols + x] - lo) / span;
          line += ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))];
        }
        out += line + '\n';
      }
      return out;
    },
    { b64: buffer.toString('base64'), cols, ramp: RAMP, aspect: 0.5 },
  );
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  return ok;
};

/* ───────────────── 1. route renders + ASCII composition ───────────────── */
// Skip the boot animation so the map shows the real page.
await page.goto(base + '/', { waitUntil: 'load' });
await page.evaluate(() => sessionStorage.setItem('pv:booted', '1'));

const routes = ['/', '/blog', '/blog/pixel-world-canvas', '/projects', '/lab', '/about'];
for (const r of routes) {
  await page.goto(base + r, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const shot = await page.screenshot();
  const map = await ascii(shot);
  console.log('\n═══ ' + r + ' ═══');
  console.log(map);
}

/* ───────────────── 2. functional assertions ───────────────── */
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1800);

// boot overlay must be gone
check('boot overlay dismissed', (await page.locator('#boot').count()) === 0);

// world canvas actually painted, and varies between sky and ground
const canvasStats = await page.evaluate(() => {
  const c = document.getElementById('world');
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  const top = ctx.getImageData(0, 0, w, Math.floor(h * 0.2)).data;
  const bot = ctx.getImageData(0, Math.floor(h * 0.8), w, Math.floor(h * 0.2)).data;
  const avg = (d) => {
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  };
  const colours = new Set();
  const full = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < full.length; i += 4 * 7) colours.add((full[i] << 16) | (full[i + 1] << 8) | full[i + 2]);
  return { w, h, top: avg(top), bot: avg(bot), colours: colours.size };
});
check('world canvas has many colours', canvasStats.colours > 25, canvasStats.colours + ' unique');
check(
  'sky differs from ground band',
  Math.abs(canvasStats.top[0] - canvasStats.bot[0]) + Math.abs(canvasStats.top[2] - canvasStats.bot[2]) > 20,
  JSON.stringify(canvasStats.top) + ' vs ' + JSON.stringify(canvasStats.bot),
);
check('canvas resolution is chunky (low-res upscale)', canvasStats.w < 700, canvasStats.w + 'x' + canvasStats.h);

// parallax: canvas must change as the page scrolls
const before = await page.evaluate(() => document.getElementById('world').toDataURL().slice(-2000));
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(700);
const after = await page.evaluate(() => document.getElementById('world').toDataURL().slice(-2000));
check('world parallax reacts to scroll', before !== after);

// reveals fire on scroll
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
await page.waitForTimeout(1000);
const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);
const totalReveal = await page.evaluate(() => document.querySelectorAll('.reveal').length);
check('scroll reveals activate', revealed > 0, revealed + '/' + totalReveal);

// xp accrues from reading
const xp = await page.evaluate(() => JSON.parse(localStorage.getItem('pv:save') || '{}').xp ?? 0);
check('xp accumulates', xp > 0, xp + ' xp');

// no horizontal overflow on desktop
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (1440)', overflow <= 1, overflow + 'px');

// theme toggle changes canvas + dataset
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
const canvasBefore = await page.evaluate(() => document.getElementById('world').toDataURL().length);
await page.click('#ctl-theme');
await page.waitForTimeout(600);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
const canvasAfter = await page.evaluate(() => document.getElementById('world').toDataURL().length);
check('theme toggle switches dataset', themeBefore !== themeAfter, themeBefore + ' → ' + themeAfter);
check('world palette follows theme', canvasBefore !== canvasAfter);
await page.screenshot({ path: 'shots/theme-day.png' });

// terminal interaction
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1700);
await page.evaluate(() => document.getElementById('terminal').scrollIntoView({ block: 'center' }));
await page.click('.term__input');
await page.keyboard.type('whoami');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const termText = await page.locator('.term__out').first().innerText();
check('terminal responds to whoami', termText.includes('VENTAOO'));
await page.keyboard.type('neofetch');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const termText2 = await page.locator('.term__out').first().innerText();
check('terminal neofetch renders a card', termText2.includes('Pixelverse'));
await page.screenshot({ path: 'shots/terminal.png' });

// blog tag filter + search
await page.goto(base + '/blog', { waitUntil: 'load' });
await page.waitForTimeout(900);
const rowsAll = await page.evaluate(() => [...document.querySelectorAll('.post-row')].filter((e) => !e.hidden).length);
await page.click('.chip[data-tag]:not([data-tag=""])');
await page.waitForTimeout(400);
const rowsTag = await page.evaluate(() => [...document.querySelectorAll('.post-row')].filter((e) => !e.hidden).length);
check('tag filter narrows the list', rowsTag > 0 && rowsTag <= rowsAll, rowsTag + '/' + rowsAll);
await page.click('.chip[data-tag=""]');
await page.fill('#post-search', 'canvas');
await page.waitForTimeout(400);
const rowsSearch = await page.evaluate(() => [...document.querySelectorAll('.post-row')].filter((e) => !e.hidden).length);
check('search filters the list', rowsSearch > 0 && rowsSearch < rowsAll, rowsSearch + '/' + rowsAll);

// 404 route
await page.goto(base + '/definitely-not-a-page', { waitUntil: 'load' });
await page.waitForTimeout(1200);
const notFound = await page.locator('.empty__code').innerText().catch(() => '');
check('unknown route renders 404 view', notFound.trim() === '404');

// konami code → party mode
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1700);
for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
  await page.keyboard.press(k);
}
await page.waitForTimeout(500);
const party = await page.evaluate(() => document.documentElement.dataset.party);
check('konami code activates party mode', party === 'on', String(party));
for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
  await page.keyboard.press(k);
}
await page.waitForTimeout(300);

// nav via data-link
await page.click('a[data-nav="blog"]');
await page.waitForTimeout(700);
check('client-side nav updates URL', page.url().endsWith('/blog'), page.url());
const h1 = await page.locator('h1').first().innerText();
check('blog page heading renders', h1.includes('日志归档'), h1);

// achievements persisted
const ach = await page.evaluate(() => JSON.parse(localStorage.getItem('pv:save') || '{}').achievements ?? []);
check('achievements unlock', ach.length >= 3, ach.join(','));

// token-level contrast in both themes
for (const theme of ['night', 'day']) {
  await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
  await page.waitForTimeout(120);
  const contrast = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    // custom properties keep their authored token (e.g. "#ffd23f"), so resolve
    // them through a throwaway element to get a real rgb() triple.
    const probeEl = document.createElement('span');
    document.body.appendChild(probeEl);
    const parse = (name) => {
      probeEl.style.color = 'var(' + name + ')';
      const resolved = getComputedStyle(probeEl).color;
      probeEl.removeAttribute('style');
      probeEl.style.color = resolved;
      return getComputedStyle(probeEl).color.match(/\d+/g).slice(0, 3).map(Number);
    };
    const raw = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const text = raw(cs.color);
    const bg = parse('--bg');
    const dim = parse('--text-dim');
    const acc = parse('--a1');
    probeEl.remove();
    return { body: +ratio(text, bg).toFixed(2), dim: +ratio(dim, bg).toFixed(2), accent: +ratio(acc, bg).toFixed(2) };
  });
  check('contrast body text (' + theme + ')', contrast.body >= 7, 'ratio ' + contrast.body);
  check('contrast dim text (' + theme + ')', contrast.dim >= 4.5, 'ratio ' + contrast.dim);
  check('contrast accent (' + theme + ')', contrast.accent >= 3, 'ratio ' + contrast.accent);
}

// mobile layout
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on('pageerror', (e) => mobileErrors.push(e.message));
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(1600);
const mOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (390)', mOverflow <= 1, mOverflow + 'px');
await mobile.screenshot({ path: 'shots/mobile-home.png' });
const mMap = await ascii(await mobile.screenshot(), 54);
console.log('\n═══ mobile / ═══');
console.log(mMap);
check('mobile has no page errors', mobileErrors.length === 0, mobileErrors.join(' | '));
await mobile.click('#ctl-menu');
await mobile.waitForTimeout(500);
await mobile.click('a[data-nav="projects"]');
await mobile.waitForTimeout(800);
check('mobile nav works', mobile.url().endsWith('/projects'), mobile.url());

await browser.close();

console.log('\n══════════════ RESULTS ══════════════');
console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL'));
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
if (errors.length) {
  console.log('\n--- CONSOLE/PAGE ERRORS (' + errors.length + ') ---');
  console.log([...new Set(errors)].slice(0, 25).join('\n'));
}
process.exitCode = failed.length || errors.length ? 1 : 0;
