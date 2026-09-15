import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const exe = [process.env.CHROME_PATH,
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
].filter(Boolean).find((p) => existsSync(p));

const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const route = process.argv[3] ?? '/';
const sel = process.argv[4] ?? '.post-row';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + '/', { waitUntil: 'load' });
await page.evaluate(() => sessionStorage.setItem('pv:booted', '1'));
await page.goto(base + route, { waitUntil: 'load' });
await page.waitForTimeout(1800);

const data = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)];
  return els.map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 2).join('.'),
      x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height),
      fs: cs.fontSize, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''),
      color: cs.color, disp: cs.display,
      text: (el.textContent || '').trim().slice(0, 26),
    };
  });
}, sel);
console.log(JSON.stringify(data, null, 0).replace(/},/g, '},\n'));
await browser.close();
