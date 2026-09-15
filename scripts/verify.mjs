/**
 * Headless verification: renders every route, prints an ASCII luminance map of
 * each, and asserts behaviour, accessibility and layout.
 *
 *   node scripts/verify.mjs [baseUrl]
 */
import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const exe = [
  process.env.CHROME_PATH,
  path.join(
    os.homedir(),
    'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  ),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => existsSync(p));
if (!exe) {
  console.error('No Chromium found');
  process.exit(1);
}

// read the config so we can prove the home page really renders from it
const cfg = readFileSync('site.config.ts', 'utf8');
const block = /lines:\s*\[([\s\S]*?)\]/.exec(cfg)?.[1] ?? '';
const CONFIG_LINES = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const BRAND = /name:\s*'([^']+)'/.exec(cfg)?.[1] ?? '';

const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const RAMP = ' .:-=+*#%@';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const blank = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push('[console] ' + m.text()));
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

async function ascii(buffer, cols = 92) {
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
      const lo = Math.min(...lums);
      const span = Math.max(0.02, Math.max(...lums) - lo);
      let out = '';
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < cols; x++) {
          line += ramp[Math.min(ramp.length - 1, Math.floor(((lums[y * cols + x] - lo) / span) * ramp.length))];
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

/* ── 1. render every route ─────────────────────────────────────────── */
await page.goto(base + '/', { waitUntil: 'load' });
await page.evaluate(() => sessionStorage.setItem('pv:booted', '1'));

for (const r of ['/', '/blog', '/blog/hello-world']) {
  await page.goto(base + r, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  console.log('\n═══ ' + r + ' ═══');
  console.log(await ascii(await page.screenshot()));
}

/* ── 2. behaviour ──────────────────────────────────────────────────── */
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1600);

check('boot overlay dismissed', (await page.locator('#boot').count()) === 0);

const canvasStats = await page.evaluate(() => {
  const c = document.getElementById('world');
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  const band = (y) => {
    const d = ctx.getImageData(0, y, w, Math.max(1, Math.floor(h * 0.18))).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  };
  const full = ctx.getImageData(0, 0, w, h).data;
  const colours = new Set();
  for (let i = 0; i < full.length; i += 4 * 7) colours.add((full[i] << 16) | (full[i + 1] << 8) | full[i + 2]);
  return { w, h, top: band(0), bot: band(Math.floor(h * 0.8)), colours: colours.size };
});
check('world canvas is painted', canvasStats.colours > 25, canvasStats.colours + ' colours');
check('canvas is chunky (low-res upscale)', canvasStats.w < 700, canvasStats.w + 'x' + canvasStats.h);
check(
  'sky band differs from ground band',
  Math.abs(canvasStats.top[0] - canvasStats.bot[0]) + Math.abs(canvasStats.top[2] - canvasStats.bot[2]) > 15,
  JSON.stringify(canvasStats.top) + ' vs ' + JSON.stringify(canvasStats.bot),
);

// config-driven home copy
const brand = await page.locator('#brand-name').innerText();
check('brand comes from site.config', brand === BRAND, brand + ' vs ' + BRAND);
const typed = (await page.locator('#hero-typed').innerText()).trim();
check(
  'typed line comes from site.config',
  CONFIG_LINES.some((l) => l.startsWith(typed) && typed.length >= 3),
  JSON.stringify(typed),
);

// parallax
const before = await page.evaluate(() => document.getElementById('world').toDataURL().slice(-2000));
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(700);
const after = await page.evaluate(() => document.getElementById('world').toDataURL().slice(-2000));
check('world parallax reacts to scroll', before !== after);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);
check('scroll reveals activate', revealed > 0, revealed + ' revealed');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (1440)', overflow <= 1, overflow + 'px');

// controls
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
const canvasBefore = await page.evaluate(() => document.getElementById('world').toDataURL().length);
await page.click('#ctl-theme');
await page.waitForTimeout(600);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
const canvasAfter = await page.evaluate(() => document.getElementById('world').toDataURL().length);
check('theme toggle switches theme', themeBefore !== themeAfter, themeBefore + ' → ' + themeAfter);
check('world palette follows theme', canvasBefore !== canvasAfter);
await page.screenshot({ path: 'shots/home-day.png' });

const palBefore = await page.evaluate(() => document.documentElement.dataset.palette);
await page.click('#ctl-palette');
await page.waitForTimeout(350);
const palAfter = await page.evaluate(() => document.documentElement.dataset.palette);
check('palette control cycles', palBefore !== palAfter, palBefore + ' → ' + palAfter);

// help modal
await page.keyboard.press('?');
await page.waitForTimeout(350);
check('? opens the help modal', !(await page.locator('#modal').isHidden().catch(() => true)));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Esc closes the help modal', await page.locator('#modal').isHidden());

// blog: search + tag filter
await page.goto(base + '/blog', { waitUntil: 'load' });
await page.waitForTimeout(900);
const rowsAll = await page.evaluate(() => [...document.querySelectorAll('.post-row')].filter((e) => !e.hidden).length);
check('blog lists at least one post', rowsAll >= 1, rowsAll + ' rows');
await page.fill('#post-search', 'zzzz-no-match');
await page.waitForTimeout(300);
const rowsNone = await page.evaluate(() => [...document.querySelectorAll('.post-row')].filter((e) => !e.hidden).length);
const emptyShown = await page.evaluate(() => !document.getElementById('post-empty').hidden);
check('search filters the list', rowsNone === 0 && emptyShown, rowsNone + ' rows, empty hint ' + emptyShown);
await page.fill('#post-search', '');
await page.waitForTimeout(300);
const tagBtns = await page.locator('.chip[data-tag]:not([data-tag=""])').count();
if (tagBtns > 0) {
  await page.click('.chip[data-tag]:not([data-tag=""])');
  await page.waitForTimeout(300);
  const rowsTag = await page.evaluate(() => [...document.querySelectorAll('.post-row')].filter((e) => !e.hidden).length);
  check('tag filter narrows the list', rowsTag > 0 && rowsTag <= rowsAll, rowsTag + '/' + rowsAll);
} else {
  check('tag filter present', false, 'no tag chips rendered');
}

// 404
await page.goto(base + '/definitely-not-a-page', { waitUntil: 'load' });
await page.waitForTimeout(1400);
check('unknown route renders 404', (await page.locator('.empty__code').innerText().catch(() => '')).trim() === '404');

// client-side navigation + konami
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1600);
await page.click('a[data-nav="blog"]');
await page.waitForTimeout(700);
check('client-side nav updates the URL', page.url().endsWith('/blog'), page.url());
for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
  await page.keyboard.press(k);
}
await page.waitForTimeout(400);
check('konami code activates party mode', (await page.evaluate(() => document.documentElement.dataset.party)) === 'on');
// leave party mode again — otherwise it leaks into the contrast checks below
for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
  await page.keyboard.press(k);
}
await page.waitForTimeout(400);
check(
  'konami code toggles party mode back off',
  (await page.evaluate(() => document.documentElement.dataset.party)) === 'off',
  await page.evaluate(() => document.documentElement.dataset.party || 'unset'),
);

/* ── 3. contrast (WCAG AA) across every palette × theme ─────────────── */
const PALETTES = ['dusk', 'gameboy', 'vapor', 'amber'];
for (const theme of ['night', 'day']) {
  for (const pal of PALETTES) {
    await page.evaluate(
      ({ t, p }) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.dataset.palette = p;
      },
      { t: theme, p: pal },
    );
    await page.waitForTimeout(120);
    const c = await page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.appendChild(probe);
      const toRGB = (str) => {
        const nums = (str.match(/-?[\d.]+(?:e-?\d+)?/gi) || []).map(Number);
        return /^color\(/.test(str) ? [nums[0] * 255, nums[1] * 255, nums[2] * 255] : nums.slice(0, 3);
      };
      const parse = (name) => {
        probe.style.color = 'var(' + name + ')';
        const resolved = getComputedStyle(probe).color;
        probe.removeAttribute('style');
        probe.style.color = resolved;
        return toRGB(getComputedStyle(probe).color);
      };
      const lum = ([r, g, b]) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      const bg = parse('--bg');
      const out = {};
      for (const name of ['--text', '--text-dim', '--text-mute', '--a1i', '--a2i', '--a3i', '--a4i', '--a5i', '--a6i']) {
        out[name] = +ratio(parse(name), bg).toFixed(2);
      }
      probe.remove();
      return out;
    });
    const entries = Object.entries(c);
    const worst = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
    check(
      `contrast · ${pal} / ${theme}`,
      worst[1] >= 4.5,
      'min ' + worst[1] + ' (' + worst[0] + ')',
    );
  }
}
await page.evaluate(() => {
  document.documentElement.dataset.theme = 'night';
  document.documentElement.dataset.palette = 'dusk';
});

/* ── 4. mobile ─────────────────────────────────────────────────────── */
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on('pageerror', (e) => mobileErrors.push(e.message));
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(1800);
const mOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (390)', mOverflow <= 1, mOverflow + 'px');
await mobile.screenshot({ path: 'shots/mobile-home.png' });
console.log('\n═══ mobile / ═══');
console.log(await ascii(await mobile.screenshot(), 50));
check('mobile has no page errors', mobileErrors.length === 0, mobileErrors.join(' | '));
await mobile.click('#ctl-menu');
await mobile.waitForTimeout(450);
await mobile.click('a[data-nav="blog"]');
await mobile.waitForTimeout(800);
check('mobile nav works', mobile.url().endsWith('/blog'), mobile.url());

await browser.close();

console.log('\n══════════════ RESULTS ══════════════');
console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL'));
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
if (errors.length) {
  console.log('\n--- CONSOLE ERRORS (' + errors.length + ') ---');
  console.log([...new Set(errors)].slice(0, 20).join('\n'));
}
process.exitCode = failed.length || errors.length ? 1 : 0;