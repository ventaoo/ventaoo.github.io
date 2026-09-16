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
  if (fontUrls.has(name)) return;
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
  await page.waitForTimeout(1800);
  console.log('\n═══ ' + r + ' ═══');
  console.log(await ascii(await page.screenshot()));
}

/* ── 2. type + grid ────────────────────────────────────────────────── */
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1200);

const type = await page.evaluate(() => {
  const st = document.querySelector('.hero__statement');
  const lead = document.querySelector('.hero__lead');
  const body = getComputedStyle(document.body);
  return {
    display: st ? getComputedStyle(st).fontFamily : '',
    displaySize: st ? parseFloat(getComputedStyle(st).fontSize) : 0,
    displayStretch: st ? getComputedStyle(st).fontStretch : '',
    leadSize: lead ? parseFloat(getComputedStyle(lead).fontSize) : 0,
    body: body.fontFamily,
    bodySize: parseFloat(body.fontSize),
    weight: st ? getComputedStyle(st).fontWeight : '',
  };
});
check('display face is Archivo', /Archivo/i.test(type.display), type.display.split(',')[0]);
check('text face is Inter', /Inter/i.test(type.body), type.body.split(',')[0]);
check('statement is the largest thing on the page', type.displaySize >= 60, type.displaySize + 'px');
check('statement uses the width axis', /%/.test(type.displayStretch) && parseFloat(type.displayStretch) > 100, type.displayStretch);
check('scale contrast is real (mega vs body)', type.displaySize / type.bodySize >= 4, (type.displaySize / type.bodySize).toFixed(1) + 'x');
check('no legacy fonts remain', !/Garamond|Fraunces|Newsreader|Press Start/i.test(type.body + type.display));

const grid = await page.evaluate(() => {
  const g = document.querySelector('.hero__grid');
  const wide = g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0;
  const post = document.querySelector('.hero__main');
  return { wide, start: post ? getComputedStyle(post).gridColumnStart : '', span: post ? getComputedStyle(post).gridColumnEnd : '' };
});
check('layout is a 12-column grid', grid.wide === 12, grid.wide + ' tracks');
check('hero is asymmetric (meta left, statement across)', grid.start === '4', 'starts at column ' + grid.start);

check('running head renders', (await page.locator('#runninghead').innerText()).trim().length > 0, await page.locator('#runninghead').innerText());

/* ── 3. config-driven copy ─────────────────────────────────────────── */
const brand = await page.locator('#brand-name').innerText();
check('brand comes from site.config', brand === BRAND, brand + ' vs ' + BRAND);
const typed = (await page.locator('#hero-line').innerText()).trim();
check('statement comes from site.config', CONFIG_LINES.some((l) => l.startsWith(typed) && typed.length >= 2), JSON.stringify(typed));

await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(700);
const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);
check('scroll reveals activate', revealed > 0, revealed + ' revealed');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (1440)', overflow <= 1, overflow + 'px');

/* ── 4. controls ───────────────────────────────────────────────────── */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('#ctl-theme');
await page.waitForTimeout(400);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check('theme toggle switches theme', themeBefore !== themeAfter, themeBefore + ' → ' + themeAfter);
await page.screenshot({ path: 'shots/home-dark.png' });

const schemeBefore = await page.evaluate(() => document.documentElement.dataset.scheme);
await page.click('.scheme[data-scheme="riso"]');
await page.waitForTimeout(300);
const schemeAfter = await page.evaluate(() => document.documentElement.dataset.scheme);
check('colour system switches', schemeBefore !== schemeAfter, schemeBefore + ' → ' + schemeAfter);
check('active scheme is marked', (await page.locator('.scheme[data-scheme="riso"].is-active').count()) === 1);

await page.keyboard.press('?');
await page.waitForTimeout(300);
check('? opens the help panel', !(await page.locator('#modal').isHidden().catch(() => true)));
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
check('Esc closes the help panel', await page.locator('#modal').isHidden());

/* ── 5. archive ────────────────────────────────────────────────────── */
await page.goto(base + '/blog', { waitUntil: 'load' });
await page.waitForTimeout(700);
const rowsAll = await page.evaluate(() => [...document.querySelectorAll('.wrow')].filter((e) => !e.hidden).length);
check('archive lists at least one post', rowsAll >= 1, rowsAll + ' rows');
check('archive groups by year', (await page.locator('.wgroup__year').count()) >= 1);
check('rows are numbered', /^0?1$/.test((await page.locator('.wrow__n').first().innerText()).trim()), await page.locator('.wrow__n').first().innerText());
await page.fill('#post-search', 'zzzz-no-match');
await page.waitForTimeout(300);
const rowsNone = await page.evaluate(() => [...document.querySelectorAll('.wrow')].filter((e) => !e.hidden).length);
check('search filters the table', rowsNone === 0 && (await page.evaluate(() => !document.getElementById('post-empty').hidden)));
await page.fill('#post-search', '');
await page.waitForTimeout(300);
const tagBtns = await page.locator('.chip[data-tag]:not([data-tag=""])').count();
if (tagBtns > 0) {
  await page.click('.chip[data-tag]:not([data-tag=""])');
  await page.waitForTimeout(300);
  const rowsTag = await page.evaluate(() => [...document.querySelectorAll('.wrow')].filter((e) => !e.hidden).length);
  check('tag filter narrows the table', rowsTag > 0 && rowsTag <= rowsAll, rowsTag + '/' + rowsAll);
} else {
  check('tag filter present', false, 'no tag chips rendered');
}

/* ── 6. article layout ─────────────────────────────────────────────── */
await page.goto(base + '/blog/hello-world', { waitUntil: 'load' });
await page.waitForTimeout(800);
const art = await page.evaluate(() => {
  const body = document.querySelector('.post-body');
  const toc = document.querySelector('.post-toc');
  return {
    bodyStart: body ? getComputedStyle(body).gridColumnStart : '',
    tocStart: toc ? getComputedStyle(toc).gridColumnStart : '',
    proseLeft: body ? Math.round(body.getBoundingClientRect().left) : 0,
    shellLeft: Math.round(document.querySelector('.post-head__grid').getBoundingClientRect().left),
  };
});
check('article body is indented off the margin', art.proseLeft > art.shellLeft + 100, art.proseLeft + ' vs shell ' + art.shellLeft);
check('marginalia sits in the right columns', art.tocStart === '10', 'col ' + art.tocStart);

/* ── 7. 404 + nav ──────────────────────────────────────────────────── */
await page.goto(base + '/definitely-not-a-page', { waitUntil: 'load' });
await page.waitForTimeout(1000);
check('unknown route renders 404', (await page.locator('.empty__code').innerText().catch(() => '')).trim() === '404');
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.click('a[data-nav="blog"]');
await page.waitForTimeout(600);
check('client-side nav updates the URL', page.url().endsWith('/blog'), page.url());

/* ── 8. contrast across every scheme × theme ───────────────────────── */
for (const theme of ['light', 'dark']) {
  for (const scheme of ['signal', 'riso', 'mono', 'earth']) {
    await page.evaluate(
      ({ t, s }) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.dataset.scheme = s;
      },
      { t: theme, s: scheme },
    );
    await page.waitForTimeout(90);
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
      const paper = parse('--paper');
      const out = {};
      for (const name of ['--ink', '--ink-2', '--ink-3', '--c1', '--c2', '--c3']) {
        out[name] = +ratio(parse(name), paper).toFixed(2);
      }
      probe.remove();
      return out;
    });
    const worst = Object.entries(c).reduce((a, b) => (b[1] < a[1] ? b : a));
    check('contrast · ' + scheme + ' / ' + theme, worst[1] >= 4.5, 'min ' + worst[1] + ' (' + worst[0] + ')');
  }
}
await page.evaluate(() => {
  document.documentElement.dataset.theme = 'light';
  document.documentElement.dataset.scheme = 'signal';
});

/* ── 9. mobile ─────────────────────────────────────────────────────── */
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on('pageerror', (e) => mobileErrors.push(e.message));
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(1400);
const mOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (390)', mOverflow <= 1, mOverflow + 'px');
await mobile.screenshot({ path: 'shots/mobile-home.png' });
console.log('\n═══ mobile / ═══');
console.log(await ascii(await mobile.screenshot(), 50));
check('mobile has no page errors', mobileErrors.length === 0, mobileErrors.join(' | '));
await mobile.click('#ctl-menu');
await mobile.waitForTimeout(400);
await mobile.click('a[data-nav="blog"]');
await mobile.waitForTimeout(700);
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
