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

// read the config so we can prove the page really renders from it
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

let fontBytes = 0;
const fontUrls = new Set();
page.on('response', async (res) => {
  const url = res.url();
  if (!/\.woff2?($|\?)/.test(url)) return;
  const name = url.split('/').pop();
  if (fontUrls.has(name)) return; // count each file once, not once per navigation
  fontUrls.add(name);
  try {
    const len = Number(res.headers()['content-length'] ?? 0);
    fontBytes += len || (await res.body()).length;
  } catch {
    /* ignore */
  }
});

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
for (const r of ['/', '/blog', '/blog/hello-world']) {
  await page.goto(base + r, { waitUntil: 'load' });
  await page.waitForTimeout(2400);
  console.log('\n═══ ' + r + ' ═══');
  console.log(await ascii(await page.screenshot()));
}

/* ── 2. behaviour ──────────────────────────────────────────────────── */
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1400);

// the ink wash is painted, and it breathes
const paint = await page.evaluate(() => {
  const c = document.getElementById('atmosphere');
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let painted = 0;
  const seen = new Set();
  for (let i = 0; i < d.length; i += 4 * 97) {
    if (d[i + 3] > 2) painted++;
    seen.add((d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3));
  }
  return { w: c.width, h: c.height, painted, sampled: Math.floor(d.length / (4 * 97)), tones: seen.size };
});
check('ink wash canvas is painted', paint.painted / paint.sampled > 0.6, paint.painted + '/' + paint.sampled + ' samples');
check('ink wash has tonal range', paint.tones > 8, paint.tones + ' tones');
check('canvas renders at device resolution', paint.w >= 1400, paint.w + 'x' + paint.h);
const frameA = await page.evaluate(() => document.getElementById('atmosphere').toDataURL().slice(-1500));
await page.waitForTimeout(1200);
const frameB = await page.evaluate(() => document.getElementById('atmosphere').toDataURL().slice(-1500));
check('ink wash drifts over time', frameA !== frameB);

// config-driven copy
const brand = await page.locator('#brand-name').innerText();
check('brand comes from site.config', brand === BRAND, brand + ' vs ' + BRAND);
const typed = (await page.locator('#hero-line').innerText()).trim();
check(
  'hero line comes from site.config',
  CONFIG_LINES.some((l) => l.startsWith(typed) && typed.length >= 2),
  JSON.stringify(typed),
);

// typography is actually applied
const type = await page.evaluate(() => {
  const name = document.querySelector('.hero__name');
  const bio = document.querySelector('.hero__lead');
  return {
    nameFont: name ? getComputedStyle(name).fontFamily : '',
    nameSize: name ? parseFloat(getComputedStyle(name).fontSize) : 0,
    bioFont: bio ? getComputedStyle(bio).fontFamily : '',
    bodyFont: getComputedStyle(document.body).fontFamily,
  };
});
check('display face is Cormorant Garamond', /Cormorant/i.test(type.nameFont), type.nameFont.split(',')[0]);
check('body face is EB Garamond', /EB Garamond/i.test(type.bodyFont), type.bodyFont.split(',')[0]);
check('hero name is display-sized', type.nameSize >= 38, type.nameSize + 'px');
check('no legacy fonts remain', !/Fraunces|Newsreader|Press Start|VT323/i.test(type.bodyFont + type.nameFont));

// reveals
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(900);
const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);
check('scroll reveals activate', revealed > 0, revealed + ' revealed');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (1440)', overflow <= 1, overflow + 'px');

// theme + accent
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
const canvasBefore = await page.evaluate(() => document.getElementById('atmosphere').toDataURL().length);
await page.click('#ctl-theme');
await page.waitForTimeout(800);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
const canvasAfter = await page.evaluate(() => document.getElementById('atmosphere').toDataURL().length);
check('theme toggle switches theme', themeBefore !== themeAfter, themeBefore + ' → ' + themeAfter);
check('ink wash follows the theme', canvasBefore !== canvasAfter);
await page.screenshot({ path: 'shots/home-dark.png' });

const accentBefore = await page.evaluate(() => document.documentElement.dataset.ink);
await page.click('.swatch[data-swatch="indigo"]');
await page.waitForTimeout(350);
const accentAfter = await page.evaluate(() => document.documentElement.dataset.ink);
check('accent swatch switches ink', accentBefore !== accentAfter, accentBefore + ' → ' + accentAfter);
check('swatch marks the active ink', await page.locator('.swatch[data-swatch="indigo"].is-active').count() === 1);

// help panel
await page.keyboard.press('?');
await page.waitForTimeout(350);
check('? opens the help panel', !(await page.locator('#modal').isHidden().catch(() => true)));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Esc closes the help panel', await page.locator('#modal').isHidden());

/* ── 3. archive ────────────────────────────────────────────────────── */
await page.goto(base + '/blog', { waitUntil: 'load' });
await page.waitForTimeout(900);
const rowsAll = await page.evaluate(() => [...document.querySelectorAll('.entry')].filter((e) => !e.hidden).length);
check('archive lists at least one post', rowsAll >= 1, rowsAll + ' entries');
check('archive groups entries by year', (await page.locator('.index__year').count()) >= 1);
await page.fill('#post-search', 'zzzz-no-match');
await page.waitForTimeout(300);
const rowsNone = await page.evaluate(() => [...document.querySelectorAll('.entry')].filter((e) => !e.hidden).length);
const emptyShown = await page.evaluate(() => !document.getElementById('post-empty').hidden);
check('search filters the index', rowsNone === 0 && emptyShown, rowsNone + ' entries, empty note ' + emptyShown);
await page.fill('#post-search', '');
await page.waitForTimeout(300);
const tagBtns = await page.locator('.chip[data-tag]:not([data-tag=""])').count();
if (tagBtns > 0) {
  await page.click('.chip[data-tag]:not([data-tag=""])');
  await page.waitForTimeout(300);
  const rowsTag = await page.evaluate(() => [...document.querySelectorAll('.entry')].filter((e) => !e.hidden).length);
  check('tag filter narrows the index', rowsTag > 0 && rowsTag <= rowsAll, rowsTag + '/' + rowsAll);
} else {
  check('tag filter present', false, 'no tag chips rendered');
}

// 404 + client-side nav
await page.goto(base + '/definitely-not-a-page', { waitUntil: 'load' });
await page.waitForTimeout(1200);
check('unknown route renders 404', (await page.locator('.empty__code').innerText().catch(() => '')).trim() === '404');
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.click('a[data-nav="blog"]');
await page.waitForTimeout(700);
check('client-side nav updates the URL', page.url().endsWith('/blog'), page.url());

/* ── 4. contrast across every ink × theme ──────────────────────────── */
const ACCENTS = ['vermillion', 'indigo', 'moss', 'ochre'];
for (const theme of ['light', 'dark']) {
  for (const accent of ACCENTS) {
    await page.evaluate(
      ({ t, a }) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.dataset.ink = a;
      },
      { t: theme, a: accent },
    );
    await page.waitForTimeout(110);
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
      const paper = parse('--bg');
      const out = {};
      for (const name of ['--ink', '--ink-2', '--ink-3', '--accent']) {
        out[name] = +ratio(parse(name), paper).toFixed(2);
      }
      probe.remove();
      return out;
    });
    const worst = Object.entries(c).reduce((a, b) => (b[1] < a[1] ? b : a));
    check(`contrast · ${accent} / ${theme}`, worst[1] >= 4.5, 'min ' + worst[1] + ' (' + worst[0] + ')');
  }
}
await page.evaluate(() => {
  document.documentElement.dataset.theme = 'light';
  document.documentElement.dataset.ink = 'vermillion';
});

/* ── 5. mobile ─────────────────────────────────────────────────────── */
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on('pageerror', (e) => mobileErrors.push(e.message));
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(1600);
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
console.log('font bytes transferred: ' + (fontBytes / 1024).toFixed(1) + ' KB — ' + [...fontUrls].join(', '));
if (errors.length) {
  console.log('\n--- CONSOLE ERRORS (' + errors.length + ') ---');
  console.log([...new Set(errors)].slice(0, 20).join('\n'));
}
process.exitCode = failed.length || errors.length ? 1 : 0;
