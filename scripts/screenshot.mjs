/**
 * Screenshot every route with the locally cached headless Chromium.
 *   node scripts/screenshot.mjs [baseUrl]
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  process.env.CHROME_PATH,
  path.join(
    os.homedir(),
    'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  ),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);

const executablePath = CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No Chromium binary found. Set CHROME_PATH.');
  process.exit(1);
}

const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const routes = [
  ['home', '/'],
  ['blog', '/blog'],
  ['post', '/blog/pixel-world-canvas'],
  ['projects', '/projects'],
  ['lab', '/lab'],
  ['about', '/about'],
];

await mkdir('shots', { recursive: true });

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('[console] ' + m.text());
});
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

for (const [name, route] of routes) {
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shots/' + name + '.png' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.42));
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/' + name + '-mid.png' });
  console.log('captured ' + name);
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(base + '/', { waitUntil: 'load' });
await mobile.waitForTimeout(1400);
await mobile.screenshot({ path: 'shots/mobile-home.png' });
console.log('captured mobile');

await browser.close();

if (errors.length) {
  console.log('\n--- PAGE ERRORS (' + errors.length + ') ---');
  console.log([...new Set(errors)].slice(0, 30).join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nno page errors');
}
