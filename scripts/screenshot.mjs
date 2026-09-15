/**
 * Screenshot the routes with the locally cached headless Chromium.
 *   node scripts/screenshot.mjs [baseUrl]
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
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
  console.error('No Chromium binary found. Set CHROME_PATH.');
  process.exit(1);
}

const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const routes = [
  ['home', '/'],
  ['blog', '/blog'],
  ['post', '/blog/hello-world'],
];

await mkdir('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push('[console] ' + m.text()));
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

for (const [name, route] of routes) {
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.evaluate(() => sessionStorage.setItem('pv:booted', '1'));
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'shots/' + name + '.png' });
  console.log('captured ' + name);
}

// day theme + mobile, for the record
await page.evaluate(() => (document.documentElement.dataset.theme = 'day'));
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1800);
await page.screenshot({ path: 'shots/home-day.png' });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(2400);
await mobile.screenshot({ path: 'shots/mobile-home.png' });
console.log('captured mobile');

await browser.close();
console.log(errors.length ? '\nPAGE ERRORS:\n' + [...new Set(errors)].join('\n') : '\nno page errors');
process.exitCode = errors.length ? 1 : 0;
