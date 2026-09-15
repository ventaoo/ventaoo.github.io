import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const exe = [
  process.env.CHROME_PATH,
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
].filter(Boolean).find((p) => existsSync(p));

const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const route = process.argv[3] ?? '/';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(base + route, { waitUntil: 'load' });
await page.waitForTimeout(2200);

const info = await page.evaluate(() => {
  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel,
      top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
      opacity: cs.opacity, color: cs.color, bg: cs.backgroundColor,
      clip: cs.clipPath === 'none' ? 'none' : 'clipped',
      visible: r.width > 0 && r.height > 0 && cs.opacity !== '0' && cs.visibility !== 'hidden',
    };
  };
  const reveals = [...document.querySelectorAll('.reveal')].map((el) => {
    const r = el.getBoundingClientRect();
    return { cls: el.className.split(' ').slice(0, 3).join('.'), top: Math.round(r.top), h: Math.round(r.height), in: el.classList.contains('in') };
  });
  return {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    docH: document.documentElement.scrollHeight,
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
    key: ['.hero__title', '.hero__lead', '.topbar', '.hud', '#world', '.panel', '.card', '.term', '.post-head__title'].map(rect),
    reveals,
    revealInCount: reveals.filter((r) => r.in).length,
    revealAboveFold: reveals.filter((r) => r.top < window.innerHeight).length,
  };
});
console.log(JSON.stringify(info, null, 1));
if (errs.length) console.log('ERRORS:', [...new Set(errs)].join(' | '));
await browser.close();
