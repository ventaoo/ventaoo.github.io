/**
 * Entry point: paint the ink wash, wire the masthead, register the routes.
 */
import './styles/index.css';

import { $, $$, on } from './core/dom';
import { applyBootState, settings, setSetting, subscribe, ACCENTS, ACCENT_LABEL, type Theme, type Accent } from './core/store';
import { hydrateIcons } from './core/icons';
import { initAtmosphere } from './fx/atmosphere';
import { route, startRouter } from './core/router';
import { initShortcuts, toggleTheme, cycleAccent } from './core/shortcuts';
import { toast } from './core/toast';
import { homePage } from './pages/home';
import { blogPage } from './pages/blog';
import { postPage } from './pages/post';
import { addTick } from './core/ticker';
import { site, LOCALE } from '../site.config';

/* ── chrome ──────────────────────────────────────────────────────────── */
function syncControls(): void {
  const face = $('#ctl-theme [data-icon]');
  if (face) face.dataset.icon = settings.theme === 'dark' ? 'sun' : 'moon';
  $$<HTMLElement>('.swatch').forEach((s) => s.classList.toggle('is-active', s.dataset.accent === settings.accent));
  hydrateIcons(document);
}

function wireControls(): void {
  on($('#ctl-theme'), 'click', toggleTheme);

  $$<HTMLButtonElement>('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const accent = btn.dataset.accent as Accent | undefined;
      if (!accent || !ACCENTS.includes(accent)) return;
      setSetting('accent', accent);
      toast('强调色 · ' + ACCENT_LABEL[accent]);
    });
  });

  on($('#btn-top'), 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/** Fill every config-driven slot in the static shell. */
function applyConfig(): void {
  document.documentElement.lang = LOCALE;
  document.title = site.seo.title;
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('brand-name', site.name);
  set('brand-suffix', site.suffix);
  set('footer-name', site.name);
  set('footer-note', site.footerNote);
  set('colophon-note', site.colophon);
  set('year', String(new Date().getFullYear()));
}

function wireScroll(): void {
  let lastY = window.scrollY;
  const bar = $('#scroll-fill');
  addTick((_dt, _t, y) => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (bar) bar.style.width = ((y / max) * 100).toFixed(2) + '%';

    const head = $('#masthead');
    if (head) {
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      if (y > 260 && down) head.classList.add('is-hidden');
      else if (up || y < 120) head.classList.remove('is-hidden');
      head.classList.toggle('is-stuck', y > 10);
    }
    const top = $('#btn-top');
    if (top) top.classList.toggle('is-on', y > 800);
    lastY = y;
  });
}

function registerRoutes(): void {
  route('/', () => homePage(), 'home');
  route('/index.html', () => homePage(), 'home');
  route('/blog', (ctx) => blogPage(ctx), 'blog');
  route('/blog/:slug', (ctx) => postPage(ctx), 'blog');
}

/* ── go ──────────────────────────────────────────────────────────────── */
function main(): void {
  applyBootState();
  applyConfig();
  hydrateIcons(document);
  syncControls();
  wireControls();
  subscribe(syncControls);
  wireScroll();
  registerRoutes();
  initShortcuts();
  initAtmosphere();
  startRouter();

  void cycleAccent;
  void (settings.theme as Theme);
}

main();
