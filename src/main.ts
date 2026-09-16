/**
 * Entry point: wire the masthead, register the routes, start the router.
 */
import './styles/index.css';

import { $, $$, on } from './core/dom';
import { applyBootState, settings, setSetting, subscribe, SCHEMES, SCHEME_LABEL, type Scheme } from './core/store';
import { hydrateIcons } from './core/icons';
import { route, startRouter } from './core/router';
import { initShortcuts, toggleTheme, cycleScheme } from './core/shortcuts';
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
  $$<HTMLElement>('.scheme').forEach((s) => s.classList.toggle('is-active', s.dataset.scheme === settings.scheme));
  hydrateIcons(document);
}

function wireControls(): void {
  on($('#ctl-theme'), 'click', toggleTheme);

  $$<HTMLButtonElement>('.scheme').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scheme = btn.dataset.scheme as Scheme | undefined;
      if (!scheme || !SCHEMES.includes(scheme)) return;
      setSetting('scheme', scheme);
      toast('配色 · ' + SCHEME_LABEL[scheme]);
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
  set('runningmeta', site.status);
  set('year', String(new Date().getFullYear()));
}

/** The running head shows where you are. */
const RUNNING_HEAD: Record<string, string> = { home: '首页', blog: '日志' };
function setRunningHead(section: string, title?: string): void {
  const el = document.getElementById('runninghead');
  if (!el) return;
  el.textContent = title ? title : (RUNNING_HEAD[section] ?? section);
}

function wireScroll(): void {
  const bar = $('#scroll-fill');
  addTick((_dt, _t, y) => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (bar) bar.style.width = ((y / max) * 100).toFixed(2) + '%';
    const top = $('#btn-top');
    if (top) top.classList.toggle('is-on', y > 700);
  });
}

function registerRoutes(): void {
  route('/', () => {
    setRunningHead('home');
    return homePage();
  }, 'home');
  route('/index.html', () => {
    setRunningHead('home');
    return homePage();
  }, 'home');
  route('/blog', (ctx) => {
    setRunningHead('blog');
    return blogPage(ctx);
  }, 'blog');
  route('/blog/:slug', (ctx) => {
    const view = postPage(ctx);
    const el = document.createElement('div');
    el.innerHTML = view.html;
    setRunningHead('blog', el.querySelector('.post-head__title')?.textContent ?? '日志');
    return view;
  }, 'blog');
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
  startRouter();

  void cycleScheme;
}

main();
