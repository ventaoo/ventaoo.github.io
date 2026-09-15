import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const exe = [process.env.CHROME_PATH,
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
].filter(Boolean).find((p) => existsSync(p));

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
await page.waitForTimeout(1800);

for (const theme of ['night', 'day']) {
  await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
  await page.waitForTimeout(150);
  const out = await page.evaluate(() => {
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
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const bg = parse('--bg');
    const rows = {};
    for (const name of ['--text', '--text-dim', '--text-mute', '--a1i', '--a2i', '--a3i', '--a4i', '--a5i', '--a6i']) {
      const rgb = parse(name);
      rows[name] = { css: rgb.map((n) => Math.round(n)).join(','), ratio: +ratio(rgb, bg).toFixed(2) };
    }
    probe.remove();
    return rows;
  });
  console.log('--- ' + theme + ' (bg ' + out['--text'].css + ' ...) ---');
  for (const [k, v] of Object.entries(out)) {
    const ok = v.ratio >= 4.5 ? 'PASS' : v.ratio >= 3 ? 'warn' : 'FAIL';
    console.log('  ' + ok + '  ' + k.padEnd(12) + ' rgb(' + v.css + ')  ratio ' + v.ratio);
  }
}
await browser.close();
