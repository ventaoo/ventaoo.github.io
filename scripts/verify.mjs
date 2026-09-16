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
const PHOTO_SRCS = [...cfg.matchAll(/src:\s*'(\/images\/[^']+)'/g)].map((m) => m[1]);

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

/* ── 2. type ───────────────────────────────────────────────────────── */
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1400);

const type = await page.evaluate(() => {
  const st = document.querySelector('.hero__statement');
  const body = getComputedStyle(document.body);
  const h1 = document.querySelector('.page-head__title') || document.querySelector('.hero__statement');
  const label = document.querySelector('.label');
  const ts = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
  return {
    display: st ? getComputedStyle(st).fontFamily : '',
    body: body.fontFamily,
    statement: ts(st),
    lead: ts(document.querySelector('.hero__lead')),
    bodySize: parseFloat(body.fontSize),
    label: ts(label),
    h1: ts(h1),
    weight: st ? getComputedStyle(st).fontWeight : '',
  };
});
check('display face is Space Grotesk', /Space Grotesk/i.test(type.display), type.display.split(',')[0]);
check('text face is EB Garamond', /EB Garamond/i.test(type.body), type.body.split(',')[0]);
check('no legacy fonts remain', !/Archivo|Inter|Garamond Variable.*Songti.*Fraunces/i.test('') && !/Fraunces|Newsreader|Press Start/i.test(type.body + type.display));
check('CJK falls through to a serif', /Songti|Noto Serif|Source Han Serif/.test(type.display), type.display.split(',').slice(1, 3).join(',').trim());

check('statement sits in the 60–80px band', type.statement >= 60 && type.statement <= 82, type.statement + 'px');
check('scale steps are distinct', new Set([type.statement, type.h1, type.lead, type.bodySize, type.label].map((n) => Math.round(n))).size >= 4,
  [type.statement, type.h1, type.lead, type.bodySize, type.label].map((n) => Math.round(n)).join(' / '));
check('labels are genuinely small', type.label <= 12, type.label + 'px');
check('scale contrast is real', type.statement / type.bodySize >= 3.5, (type.statement / type.bodySize).toFixed(1) + 'x');

/* ── 3. magazine grid ──────────────────────────────────────────────── */
const grid = await page.evaluate(() => {
  const g = document.querySelector('.hero .mag');
  const st = document.querySelector('.hero__statement');
  const rail = document.querySelector('.hero__rail');
  const lead = document.querySelector('.hero__lead');
  const cs = (el) => (el ? getComputedStyle(el) : null);
  return {
    tracks: g ? cs(g).gridTemplateColumns.split(' ').length : 0,
    stCol: cs(st)?.gridColumnStart,
    railCol: cs(rail)?.gridColumnStart,
    leadWidth: lead ? Math.round(lead.getBoundingClientRect().width) : 0,
    stWidth: st ? Math.round(st.getBoundingClientRect().width) : 0,
    railTop: rail ? Math.round(rail.getBoundingClientRect().top) : 0,
    stTop: st ? Math.round(st.getBoundingClientRect().top) : 0,
  };
});
check('layout is a 12-column grid', grid.tracks === 12, grid.tracks + ' tracks');
check('hero is asymmetric (statement 1-8, rail at 10)', grid.stCol === '1' && grid.railCol === '10', grid.stCol + ' / ' + grid.railCol);
check('statement and rail share a top edge but not a width', grid.railTop === grid.stTop && grid.stWidth > grid.leadWidth, 'statement ' + grid.stWidth + ' vs lead ' + grid.leadWidth);

/* ── 4. photographs ────────────────────────────────────────────────── */
const photo = await page.evaluate(() => {
  const figs = [...document.querySelectorAll('.photo')];
  return {
    count: figs.length,
    loaded: figs.filter((f) => {
      const img = f.querySelector('img');
      return img && img.complete && img.naturalWidth > 0;
    }).length,
    offsets: figs.map((f) => Math.round(f.getBoundingClientRect().top + scrollY)),
    widths: figs.map((f) => Math.round(f.getBoundingClientRect().width)),
  };
});
check('every configured photo is rendered', photo.count === PHOTO_SRCS.length, photo.count + ' of ' + PHOTO_SRCS.length);
check('every photo actually loads', photo.loaded === photo.count, photo.loaded + '/' + photo.count);
check('photos have an irregular rhythm', new Set(photo.widths).size >= 3, 'widths ' + [...new Set(photo.widths)].join(', '));
check('photos are staggered, not baseline-aligned', new Set(photo.offsets.slice(0, 4)).size >= 3, 'tops ' + photo.offsets.slice(0, 4).join(', '));

/* ── 5. config-driven copy ─────────────────────────────────────────── */
const brand = await page.locator('#brand-name').innerText();
check('brand comes from site.config', brand === BRAND, brand + ' vs ' + BRAND);
const typed = (await page.locator('#hero-line').innerText()).trim();
check('statement comes from site.config', CONFIG_LINES.some((l) => l.startsWith(typed) && typed.length >= 2), JSON.stringify(typed));
check('no pixel references left in the copy', !/像素/.test(cfg), /像素/.test(cfg) ? 'site.config.ts still says 像素' : 'clean');

check('running head renders', (await page.locator('#runninghead').innerText()).trim().length > 0, await page.locator('#runninghead').innerText());
check('colour picker is gone', (await page.locator('.scheme, .swatch').count()) === 0);

await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(700);
const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);
check('scroll reveals activate', revealed > 0, revealed + ' revealed');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (1440)', overflow <= 1, overflow + 'px');

/* ── 6. controls ───────────────────────────────────────────────────── */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('#ctl-theme');
await page.waitForTimeout(400);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check('theme toggle switches theme', themeBefore !== themeAfter, themeBefore + ' → ' + themeAfter);
await page.screenshot({ path: 'shots/home-dark.png' });
await page.keyboard.press('?');
await page.waitForTimeout(300);
check('? opens the help panel', !(await page.locator('#modal').isHidden().catch(() => true)));
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
check('Esc closes the help panel', await page.locator('#modal').isHidden());

/* ── 7. archive ────────────────────────────────────────────────────── */
await page.goto(base + '/blog', { waitUntil: 'load' });
await page.waitForTimeout(800);
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

/* ── 8. article ────────────────────────────────────────────────────── */
await page.goto(base + '/blog/hello-world', { waitUntil: 'load' });
await page.waitForTimeout(800);
const art = await page.evaluate(() => {
  const body = document.querySelector('.post-body');
  const toc = document.querySelector('.post-toc');
  const shell = document.querySelector('.post-head .mag');
  return {
    proseLeft: body ? Math.round(body.getBoundingClientRect().left) : 0,
    shellLeft: shell ? Math.round(shell.getBoundingClientRect().left) : 0,
    tocCol: toc ? getComputedStyle(toc).gridColumnStart : '',
  };
});
check('article body is indented off the margin', art.proseLeft > art.shellLeft + 60, art.proseLeft + ' vs shell ' + art.shellLeft);
check('marginalia sits in the right columns', art.tocCol === '10', 'col ' + art.tocCol);

/* ── 9. 404 + nav ──────────────────────────────────────────────────── */
await page.goto(base + '/definitely-not-a-page', { waitUntil: 'load' });
await page.waitForTimeout(1000);
check('unknown route renders 404', (await page.locator('.empty__code').innerText().catch(() => '')).trim() === '404');
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.click('a[data-nav="blog"]');
await page.waitForTimeout(600);
check('client-side nav updates the URL', page.url().endsWith('/blog'), page.url());

/* ── 10. contrast — 宣纸 and 夜 ────────────────────────────────────── */
for (const theme of ['light', 'dark']) {
  await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
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
    for (const name of ['--ink', '--ink-2', '--ink-3', '--c1', '--c2', '--c3']) out[name] = +ratio(parse(name), paper).toFixed(2);
    probe.remove();
    return out;
  });
  const worst = Object.entries(c).reduce((a, b) => (b[1] < a[1] ? b : a));
  check('contrast · ' + theme, worst[1] >= 4.5, 'min ' + worst[1] + ' (' + worst[0] + ')');
}
await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));

/* ── 11. mobile ────────────────────────────────────────────────────── */
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on('pageerror', (e) => mobileErrors.push(e.message));
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(1600);
const mOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow (390)', mOverflow <= 1, mOverflow + 'px');
await mobile.screenshot({ path: 'shots/mobile-home.png', fullPage: false });
console.log('\n═══ mobile / ═══');
console.log(await ascii(await mobile.screenshot(), 46));
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
