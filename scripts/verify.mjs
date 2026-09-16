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

async function ascii(buffer, cols) {
  cols = cols || 92;
  return blank.evaluate(async (a) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + a.b64;
    await img.decode();
    const rows = Math.max(8, Math.round((a.cols * img.height * 0.5) / img.width));
    const c = document.createElement('canvas');
    c.width = a.cols; c.height = rows;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, a.cols, rows);
    const d = ctx.getImageData(0, 0, a.cols, rows).data;
    const lums = [];
    for (let i = 0; i < d.length; i += 4) lums.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
    const lo = Math.min.apply(null, lums);
    const span = Math.max(0.02, Math.max.apply(null, lums) - lo);
    let out = "";
    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < a.cols; x++) {
        const v = (lums[y * a.cols + x] - lo) / span;
        line += a.ramp[Math.min(a.ramp.length - 1, Math.floor(v * a.ramp.length))];
      }
      out += line + "\n";
    }
    return out;
  }, { b64: buffer.toString("base64"), cols, ramp: RAMP });
}

const results = [];
const check = (name, ok, detail) => {
  results.push((ok ? "PASS " : "FAIL ") + name + (detail ? " - " + detail : ""));
  return ok;
};

/* 1. every route */
for (const r of ["/", "/blog", "/photos", "/blog/hello-world"]) {
  await page.goto(base + r, { waitUntil: "load" });
  await page.waitForTimeout(1600);
  console.log("\n=== " + r + " ===");
  console.log(await ascii(await page.screenshot()));
}

/* 2. type */
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(1300);
const type = await page.evaluate(() => {
  const g = (s) => document.querySelector(s);
  const fs = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
  const all = Array.from(document.querySelectorAll("h1,h2,h3,p,a,span,time")).filter((e) => e.offsetParent !== null && !e.classList.contains("sr-only"));
  let max = 0;
  for (const e of all) max = Math.max(max, parseFloat(getComputedStyle(e).fontSize));
  return {
    body: getComputedStyle(document.body).fontFamily,
    display: getComputedStyle(g(".page-head__title") || g(".wrow__title") || document.body).fontFamily,
    label: fs(g(".label")),
    max: max,
  };
});
check("text face is EB Garamond", /EB Garamond/i.test(type.body), type.body.split(",")[0]);
check("display face is Space Grotesk", /Space Grotesk/i.test(type.display), type.display.split(",")[0]);
check("CJK falls through to a serif", /Songti|Noto Serif|Source Han Serif/.test(type.body), type.body.split(",").slice(1, 3).join(",").trim());
check("no legacy fonts remain", !/Fraunces|Newsreader|Archivo|Inter Variable|Press Start/i.test(type.body + type.display));
check("labels stay small", type.label <= 12, type.label + "px");
check("no oversized display type", type.max <= 60, "largest visible " + type.max + "px");

/* 3. intro from config */
const intro = await page.evaluate(() => {
  const ps = Array.from(document.querySelectorAll(".home__intro p"));
  return { count: ps.length, texts: ps.map((p) => p.textContent.trim()), sizes: ps.map((p) => parseFloat(getComputedStyle(p).fontSize)) };
});
check("intro paragraph count matches site.config", intro.count === CONFIG_INTRO.length, intro.count + " of " + CONFIG_INTRO.length);
check("intro text comes from site.config", intro.texts.every((t, i) => t === CONFIG_INTRO[i]), String(intro.texts[0] || "").slice(0, 22));
check("every intro paragraph is the same size", new Set(intro.sizes).size === 1, intro.sizes.join(" / ") + "px");

/* 4. photographs live on their own page and nowhere else */
const homeImgs = await page.locator("img").count();
check("the home page shows no images", homeImgs === 0, homeImgs + " found");
await page.goto(base + "/blog", { waitUntil: "load" });
await page.waitForTimeout(700);
const blogImgs = await page.locator("img").count();
check("the archive shows no images", blogImgs === 0, blogImgs + " found");

await page.goto(base + "/photos", { waitUntil: "load" });
await page.waitForTimeout(900);
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += window.innerHeight) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 260));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(900);
const gallery = await page.evaluate(() => {
  const figs = Array.from(document.querySelectorAll(".gallery__fig"));
  const loaded = figs.filter((f) => { const i = f.querySelector("img"); return i && i.complete && i.naturalWidth > 0; });
  const uniq = (a) => Array.from(new Set(a));
  return {
    count: figs.length,
    loaded: loaded.length,
    widths: uniq(figs.map((f) => Math.round(f.getBoundingClientRect().width))),
    tops: uniq(figs.slice(0, 4).map((f) => Math.round(f.getBoundingClientRect().top + scrollY))),
  };
});
check("the photo page renders every configured photo", gallery.count === PHOTO_SRCS.length, gallery.count + " of " + PHOTO_SRCS.length);
check("every photo loads", gallery.loaded === gallery.count, gallery.loaded + "/" + gallery.count);
check("the gallery has an irregular rhythm", gallery.widths.length >= 3, "widths " + gallery.widths.join(", "));
check("gallery items are staggered", gallery.tops.length >= 3, "tops " + gallery.tops.join(", "));

/* 5. navigation */
const nav = await page.evaluate(() => Array.from(document.querySelectorAll("[data-nav]")).map((a) => a.getAttribute("data-nav")));
check("the header has three sections", nav.length === 3 && nav.indexOf("photos") >= 0, nav.join(" / "));
check("the photo section is marked active", (await page.locator('[data-nav="photos"].is-active').count()) === 1);
const running = (await page.locator("#runninghead").innerText()).trim();
check("running head tracks the section", running === "\u7167\u7247", running);

/* 6. settings and toasts are gone */
check("no toast container", (await page.locator("#toasts, .toast, .toasts").count()) === 0);
check("no theme control", (await page.locator("#ctl-theme, .swatch, .scheme").count()) === 0);
const rootAttrs = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme || null }));
check("no persisted settings on <html>", rootAttrs.theme === null, String(rootAttrs.theme));
const cssText = await page.evaluate(async () => {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  let out = "";
  for (const l of links) out += await (await fetch(l.href)).text();
  return out;
});
check("no toast styles shipped", cssText.indexOf(".toast") < 0);

/* 7. archive table */
await page.goto(base + "/blog", { waitUntil: "load" });
await page.waitForTimeout(800);
const table = await page.evaluate(() => {
  const head = document.querySelector(".whead");
  const rows = Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden);
  const cols = (el) => (el ? getComputedStyle(el).gridTemplateColumns : "");
  const xs = (sel) => rows.map((r) => { const el = r.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().left) : -1; });
  const uniq = (a) => Array.from(new Set(a));
  const d = rows[0] ? rows[0].querySelector(".wrow__date") : null;
  return {
    hasHead: !!head,
    labels: head ? Array.from(head.querySelectorAll(".label")).map((l) => l.textContent.trim()) : [],
    headCols: cols(head), rowCols: cols(rows[0]),
    nX: uniq(xs(".wrow__n")), dateX: uniq(xs(".wrow__date")), tagX: uniq(xs(".wrow__tags")),
    date: d ? d.textContent.trim() : "",
    rows: rows.length,
  };
});
check("the table has a header row", table.hasHead && table.labels.length === 4, table.labels.join(" / "));
check("header and body share one column template", table.headCols === table.rowCols, table.headCols);
check("columns align across rows", table.nX.length <= 1 && table.dateX.length <= 1 && table.tagX.length <= 1, "n=" + table.nX + " date=" + table.dateX + " tags=" + table.tagX);
check("dates are full and tabular", /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/.test(table.date), table.date);

await page.fill("#post-search", "zzzz-no-match");
await page.waitForTimeout(300);
const none = await page.evaluate(() => Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden).length);
const emptyShown = await page.evaluate(() => !document.getElementById("post-empty").hidden);
check("search filters the table", none === 0 && emptyShown, none + " rows");
await page.fill("#post-search", "");
await page.waitForTimeout(300);
const tagBtns = await page.locator('.chip[data-tag]:not([data-tag=""])').count();
if (tagBtns > 0) {
  await page.click('.chip[data-tag]:not([data-tag=""])');
  await page.waitForTimeout(300);
  const tagged = await page.evaluate(() => Array.from(document.querySelectorAll(".wrow")).filter((e) => !e.hidden).length);
  check("tag filter narrows the table", tagged > 0 && tagged <= table.rows, tagged + "/" + table.rows);
} else check("tag filter present", false, "no chips");

/* 8. article */
await page.goto(base + "/blog/hello-world", { waitUntil: "load" });
await page.waitForTimeout(800);
const art = await page.evaluate(() => {
  const body = document.querySelector(".post-body");
  const toc = document.querySelector(".post-toc");
  const shell = document.querySelector(".post-head");
  return {
    proseLeft: body ? Math.round(body.getBoundingClientRect().left) : 0,
    shellLeft: shell ? Math.round(shell.getBoundingClientRect().left) : 0,
    tocCol: toc ? getComputedStyle(toc).gridColumnStart : "",
  };
});
check("article body is indented off the margin", art.proseLeft > art.shellLeft + 60, art.proseLeft + " vs " + art.shellLeft);
check("marginalia sits in the right columns", art.tocCol === "10", "col " + art.tocCol);
/* the sample post doubles as the documentation, so its code must render */
const code = await page.evaluate(() => {
  const BROKEN = String.fromCharCode(96) + '@';
  const prose = document.querySelector(".prose") || document.body;
  return {
    blocks: document.querySelectorAll(".codeblock").length,
    copies: document.querySelectorAll("[data-copy]").length,
    highlighted: document.querySelectorAll(".codeblock code.hljs").length,
    stray: prose.textContent.indexOf(BROKEN) >= 0,
  };
});
check("the article renders real code blocks", code.blocks >= 1 && code.copies === code.blocks, code.blocks + " blocks, " + code.copies + " copy buttons");
check("code blocks are syntax-highlighted", code.highlighted === code.blocks, code.highlighted + "/" + code.blocks);
check("no malformed code fences in the copy", !code.stray);
const copyWorks = await page.evaluate(async () => {
  const btn = document.querySelector("[data-copy]");
  if (!btn) return null;
  btn.click();
  await new Promise((r) => setTimeout(r, 300));
  return btn.textContent.trim();
});
check("the copy button reports its own state", copyWorks !== null && copyWorks.length > 0, String(copyWorks));

/* 9. 404 + client-side nav */
await page.goto(base + "/definitely-not-a-page", { waitUntil: "load" });
await page.waitForTimeout(1000);
const nf = await page.locator(".empty__code").innerText().catch(() => "");
check("unknown route renders 404", nf.trim() === "404");
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(1000);
await page.click('[data-nav="blog"]');
await page.waitForTimeout(600);
check("client-side nav updates the URL", page.url().endsWith("/blog"), page.url());

/* 10. contrast */
const contrast = await page.evaluate(() => {
  const probe = document.createElement("span");
  document.body.appendChild(probe);
  const parse = (name) => {
    probe.style.color = "var(" + name + ")";
    const r = getComputedStyle(probe).color;
    probe.removeAttribute("style");
    const n = (r.match(/[0-9]+/g) || []).slice(0, 3).map(Number);
    return n;
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => { const s = [lum(a), lum(b)].sort((m, n) => n - m); return (s[0] + 0.05) / (s[1] + 0.05); };
  const paper = parse("--paper");
  const out = {};
  for (const name of ["--ink", "--ink-2", "--ink-3", "--c1", "--c2", "--c3"]) out[name] = +ratio(parse(name), paper).toFixed(2);
  probe.remove();
  return out;
});
let worst = ["", 99];
for (const k of Object.keys(contrast)) if (contrast[k] < worst[1]) worst = [k, contrast[k]];
check("contrast on paper", worst[1] >= 4.5, "min " + worst[1] + " (" + worst[0] + ")");

/* 11. overflow + mobile */
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("no horizontal overflow (1440)", overflow <= 1, overflow + "px");
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobile.on("pageerror", (e) => mobileErrors.push(e.message));
await mobile.goto(base + "/photos", { waitUntil: "load" });
await mobile.waitForTimeout(1500);
const mOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("no horizontal overflow (390)", mOverflow <= 1, mOverflow + "px");
const mGallery = await mobile.locator(".gallery__fig").count();
check("the gallery reflows on mobile", mGallery === PHOTO_SRCS.length, mGallery + " figures");
await mobile.screenshot({ path: "shots/mobile-photos.png" });
check("mobile has no page errors", mobileErrors.length === 0, mobileErrors.join(" | "));
await mobile.click("#ctl-menu");
await mobile.waitForTimeout(400);
await mobile.click('[data-nav="blog"]');
await mobile.waitForTimeout(700);
check("mobile nav works", mobile.url().endsWith("/blog"), mobile.url());

await browser.close();

console.log("\n========== RESULTS ==========");
console.log(results.join("\n"));
const failed = results.filter((r) => r.indexOf("FAIL") === 0);
console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
console.log("font bytes: " + (fontBytes / 1024).toFixed(1) + " KB - " + Array.from(fontUrls).join(", "));
if (errors.length) {
  console.log("\n--- CONSOLE ERRORS (" + errors.length + ") ---");
  console.log(Array.from(new Set(errors)).slice(0, 20).join("\n"));
}
process.exitCode = failed.length || errors.length ? 1 : 0;
