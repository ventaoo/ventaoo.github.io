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
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => existsSync(p));
if (!exe) { console.error('No Chromium found'); process.exit(1); }

const cfg = readFileSync('site.config.ts', 'utf8');
const introBlock = /intro:\s*\[([\s\S]*?)\n  \]/.exec(cfg)?.[1] || "";
const CONFIG_INTRO = [...introBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const BRAND = /name:\s*'([^']+)'/.exec(cfg)?.[1] || "";
const PHOTO_SRCS = [...cfg.matchAll(/src:\s*'(\/images\/[^']+)'/g)].map((m) => m[1]);

const base = process.argv[2] || 'http://127.0.0.1:4173';
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
    const len = Number(res.headers()['content-length'] || 0);
    fontBytes += len || (await res.body()).length;
  } catch {}
});

async function ascii(buffer, cols = 92) {
  return blank.evaluate(async ({ b64, cols, ramp, aspect }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const rows = Math.max(8, Math.round((cols * img.height * aspect) / img.width));
    const c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, cols, rows);
    const d = ctx.getImageData(0, 0, cols, rows).data;
    const lums = [];
    for (let i = 0; i < d.length; i += 4) lums.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
    const lo = Math.min.apply(null, lums);
    const span = Math.max(0.02, Math.max.apply(null, lums) - lo);
    let out = "";
    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const v = (lums[y * cols + x] - lo) / span;
        line += ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))];
      }
      out += line + "\n";
    }
    return out;
  }, { b64: buffer.toString("base64"), cols, ramp: RAMP, aspect: 0.5 });
}

const results = [];
const check = (name, ok, detail) => {
  results.push((ok ? "PASS " : "FAIL ") + name + (detail ? " — " + detail : ""));
  return ok;
};

/* 1. every route */
for (const r of ["/", "/blog", "/blog/hello-world"]) {
  await page.goto(base + r, { waitUntil: "load" });
  await page.waitForTimeout(1800);
  console.log("\n=== " + r + " ===");
  console.log(await ascii(await page.screenshot()));
}

/* 2. type */
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(1400);
const type = await page.evaluate(() => {
  const g = (s) => document.querySelector(s);
  const fs = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
  const all = Array.from(document.querySelectorAll("h1,h2,h3,p,a,span,time")).filter((e) => e.offsetParent !== null && !e.classList.contains("sr-only"));
  let max = 0;
  for (const e of all) max = Math.max(max, parseFloat(getComputedStyle(e).fontSize));
  return {
    body: getComputedStyle(document.body).fontFamily,
    display: getComputedStyle(g(".page-head__title") || g(".wrow__title") || document.body).fontFamily,
    labelSize: fs(g(".label")),
    bodySize: parseFloat(getComputedStyle(document.body).fontSize),
    maxVisible: max,
  };
});
check("text face is EB Garamond", /EB Garamond/i.test(type.body), type.body.split(",")[0]);
check("display face is Space Grotesk", /Space Grotesk/i.test(type.display), type.display.split(",")[0]);
check("CJK falls through to a serif", /Songti|Noto Serif|Source Han Serif/.test(type.body), type.body.split(",").slice(1, 3).join(",").trim());
check("no legacy fonts remain", !/Fraunces|Newsreader|Archivo|Inter Variable|Press Start/i.test(type.body + type.display));
check("labels stay small", type.labelSize <= 12, type.labelSize + "px");
check("no oversized display type left", type.maxVisible <= 60, "largest visible " + type.maxVisible + "px");

/* 3. intro paragraphs come from config */
const intro = await page.evaluate(() => {
  const ps = Array.from(document.querySelectorAll(".intro p"));
  return { count: ps.length, texts: ps.map((p) => p.textContent.trim()), sizes: ps.map((p) => parseFloat(getComputedStyle(p).fontSize)) };
});
check("intro paragraph count matches site.config", intro.count === CONFIG_INTRO.length, intro.count + " of " + CONFIG_INTRO.length);
check("intro text comes from site.config", intro.texts.every((t, i) => t === CONFIG_INTRO[i]), String(intro.texts[0] || "").slice(0, 24));
check("every intro paragraph is the same size", new Set(intro.sizes).size === 1, intro.sizes.join(" / ") + "px");

/* 4. the spread: main column + photo rail */
const spread = await page.evaluate(() => {
  const grid = document.querySelector(".spread");
  const main = document.querySelector(".spread__main");
  const rail = document.querySelector(".rail");
  const cs = (el) => (el ? getComputedStyle(el) : null);
  return {
    tracks: grid ? cs(grid).gridTemplateColumns.split(" ").length : 0,
    mainCol: cs(main) ? cs(main).gridColumnStart : "",
    railCol: cs(rail) ? cs(rail).gridColumnStart : "",
    railInsideMain: !!(rail && main && main.contains(rail)),
    railLeft: rail ? Math.round(rail.getBoundingClientRect().left) : 0,
    mainRight: main ? Math.round(main.getBoundingClientRect().right) : 0,
  };
});
check("spread is a 12-column grid", spread.tracks === 12, spread.tracks + " tracks");
check("main column and rail are separate columns", spread.mainCol === "1" && spread.railCol === "10", spread.mainCol + " / " + spread.railCol);
check("the rail is not nested inside the running text", spread.railInsideMain === false);
check("the rail sits clear of the main column", spread.railLeft >= spread.mainRight, spread.railLeft + " vs " + spread.mainRight);

/* 5. photographs live in the rail, on home AND archive */
const railPhotos = await page.evaluate(() => {
  const figs = Array.from(document.querySelectorAll(".rail .rail__fig"));
  const loaded = figs.filter((f) => { const i = f.querySelector("img"); return i && i.complete && i.naturalWidth > 0; });
  return { count: figs.length, loaded: loaded.length };
});
check("home shows every configured photo in the rail", railPhotos.count === PHOTO_SRCS.length, railPhotos.count + " of " + PHOTO_SRCS.length);
check("every rail photo loads", railPhotos.loaded === railPhotos.count, railPhotos.loaded + "/" + railPhotos.count);
await page.goto(base + "/blog", { waitUntil: "load" });
await page.waitForTimeout(900);
const railOnBlog = await page.locator(".rail .rail__fig").count();
check("the archive has the same photo rail", railOnBlog === PHOTO_SRCS.length, railOnBlog + " figures");
const photosInBody = await page.locator(".spread__main .rail__fig, .prose .rail__fig").count();
check("no photographs inside the running text", photosInBody === 0, photosInBody + " found");

/* 6. archive table */
const table = await page.evaluate(() => {
  const head = document.querySelector(".whead");
  const rows = Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden);
  const cols = (el) => (el ? getComputedStyle(el).gridTemplateColumns : "");
  const xs = (sel) => rows.map((r) => { const el = r.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().left) : -1; });
  const uniq = (a) => Array.from(new Set(a));
  const dateEl = rows[0] ? rows[0].querySelector(".wrow__date") : null;
  return {
    hasHead: !!head,
    headLabels: head ? Array.from(head.querySelectorAll(".label")).map((l) => l.textContent.trim()) : [],
    rows: rows.length,
    headCols: cols(head), rowCols: cols(rows[0]),
    nX: uniq(xs(".wrow__n")), dateX: uniq(xs(".wrow__date")), tagX: uniq(xs(".wrow__tags")),
    date: dateEl ? dateEl.textContent.trim() : "",
  };
});
check("the table has a header row", table.hasHead && table.headLabels.length === 4, table.headLabels.join(" / "));
check("header and body share one column template", table.headCols === table.rowCols, table.headCols);
check("columns align across rows", table.nX.length <= 1 && table.dateX.length <= 1 && table.tagX.length <= 1, "n=" + table.nX + " date=" + table.dateX + " tags=" + table.tagX);
check("dates are full and tabular", /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/.test(table.date), table.date);

/* 7. config-driven copy */
const brand = await page.locator("#brand-name").innerText();
check("brand comes from site.config", brand === BRAND, brand + " vs " + BRAND);
check("no pixel references left in the copy", !/\u50cf\u7d20/.test(cfg), /\u50cf\u7d20/.test(cfg) ? "site.config.ts still says it" : "clean");
const running = (await page.locator("#runninghead").innerText()).trim();
check("running head tracks the section", running === "\u65e5\u5fd7", running);
check("colour picker is gone", (await page.locator(".scheme, .swatch").count()) === 0);

/* 8. controls */
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click("#ctl-theme");
await page.waitForTimeout(400);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check("theme toggle switches theme", themeBefore !== themeAfter, themeBefore + " -> " + themeAfter);
await page.screenshot({ path: "shots/home-dark.png" });
await page.keyboard.press("?");
await page.waitForTimeout(300);
check("? opens the help panel", !(await page.locator("#modal").isHidden().catch(() => true)));
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
check("Esc closes the help panel", await page.locator("#modal").isHidden());

/* 9. archive behaviour */
await page.goto(base + "/blog", { waitUntil: "load" });
await page.waitForTimeout(800);
const rowsAll = await page.evaluate(() => Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden).length);
check("archive lists at least one post", rowsAll >= 1, rowsAll + " rows");
await page.fill("#post-search", "zzzz-no-match");
await page.waitForTimeout(300);
const rowsNone = await page.evaluate(() => Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden).length);
const emptyShown = await page.evaluate(() => !document.getElementById("post-empty").hidden);
check("search filters the table", rowsNone === 0 && emptyShown, rowsNone + " rows");
await page.fill("#post-search", "");
await page.waitForTimeout(300);
const tagBtns = await page.locator('.chip[data-tag]:not([data-tag=""])').count();
if (tagBtns > 0) {
  await page.click('.chip[data-tag]:not([data-tag=""])');
  await page.waitForTimeout(300);
  const rowsTag = await page.evaluate(() => Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden).length);
  check("tag filter narrows the table", rowsTag > 0 && rowsTag <= rowsAll, rowsTag + "/" + rowsAll);
} else check("tag filter present", false, "no chips");

/* 10. article */
await page.goto(base + "/blog/hello-world", { waitUntil: "load" });
await page.waitForTimeout(800);
const art = await page.evaluate(() => {
  const body = document.querySelector(".post-body");
  const toc = document.querySelector(".post-toc");
  const shell = document.querySelector(".post-head .mag");
  return {
    proseLeft: body ? Math.round(body.getBoundingClientRect().left) : 0,
    shellLeft: shell ? Math.round(shell.getBoundingClientRect().left) : 0,
    tocCol: toc ? getComputedStyle(toc).gridColumnStart : "",
  };
});
check("article body is indented off the margin", art.proseLeft > art.shellLeft + 60, art.proseLeft + " vs " + art.shellLeft);
check("marginalia sits in the right columns", art.tocCol === "10", "col " + art.tocCol);

/* 11. 404 + nav */
await page.goto(base + "/definitely-not-a-page", { waitUntil: "load" });
await page.waitForTimeout(1000);
const nf = await page.locator(".empty__code").innerText().catch(() => "");
check("unknown route renders 404", nf.trim() === "404");
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(1000);
await page.click('a[data-nav="blog"]');
await page.waitForTimeout(600);
check("client-side nav updates the URL", page.url().endsWith("/blog"), page.url());

/* 12. contrast */
for (const theme of ["light", "dark"]) {
  await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
  await page.waitForTimeout(90);
  const c = await page.evaluate(() => {
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    const toRGB = (str) => {
      const nums = (str.match(/-?[0-9.]+(?:e-?[0-9]+)?/gi) || []).map(Number);
      return /^color\(/.test(str) ? [nums[0] * 255, nums[1] * 255, nums[2] * 255] : nums.slice(0, 3);
    };
    const parse = (name) => {
      probe.style.color = "var(" + name + ")";
      const resolved = getComputedStyle(probe).color;
      probe.removeAttribute("style");
      probe.style.color = resolved;
      return toRGB(getComputedStyle(probe).color);
    };
    const lum = (rgb) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    };
    const ratio = (a, b) => { const s = [lum(a), lum(b)].sort((m, n) => n - m); return (s[0] + 0.05) / (s[1] + 0.05); };
    const paper = parse("--paper");
    const out = {};
    for (const name of ["--ink", "--ink-2", "--ink-3", "--c1", "--c2", "--c3"]) out[name] = +ratio(parse(name), paper).toFixed(2);
    probe.remove();
    return out;
  });
  let worst = ["", 99];
  for (const k of Object.keys(c)) if (c[k] < worst[1]) worst = [k, c[k]];
  check("contrast · " + theme, worst[1] >= 4.5, "min " + worst[1] + " (" + worst[0] + ")");
}
await page.evaluate(() => (document.documentElement.dataset.theme = "light"));

/* 13. overflow + mobile */
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("no horizontal overflow (1440)", overflow <= 1, overflow + "px");
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on("pageerror", (e) => mobileErrors.push(e.message));
await mobile.goto(base + "/", { waitUntil: "load" });
await mobile.waitForTimeout(1600);
const mOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("no horizontal overflow (390)", mOverflow <= 1, mOverflow + "px");
const mRail = await mobile.locator(".rail .rail__fig").count();
check("the rail reflows on mobile", mRail === PHOTO_SRCS.length, mRail + " figures");
await mobile.screenshot({ path: "shots/mobile-home.png", fullPage: false });
console.log("\n=== mobile / ===");
console.log(await ascii(await mobile.screenshot(), 46));
check("mobile has no page errors", mobileErrors.length === 0, mobileErrors.join(" | "));
await mobile.click("#ctl-menu");
await mobile.waitForTimeout(400);
await mobile.click('a[data-nav="blog"]');
await mobile.waitForTimeout(700);
check("mobile nav works", mobile.url().endsWith("/blog"), mobile.url());

await browser.close();

console.log("\n========== RESULTS ==========");
console.log(results.join("\n"));
const failed = results.filter((r) => r.indexOf("FAIL") === 0);
console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
console.log("font bytes transferred: " + (fontBytes / 1024).toFixed(1) + " KB - " + Array.from(fontUrls).join(", "));
if (errors.length) {
  console.log("\n--- CONSOLE ERRORS (" + errors.length + ") ---");
  console.log(Array.from(new Set(errors)).slice(0, 20).join("\n"));
}
process.exitCode = failed.length || errors.length ? 1 : 0;
