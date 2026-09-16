/**
 * Entry point: wire the masthead, register the routes, start the router.
 */
import './styles/index.css';

import { $, on } from './core/dom';
import { hydrateIcons } from './core/icons';
import { route, startRouter } from './core/router';
import { initShortcuts } from './core/shortcuts';
import { homePage } from './pages/home';
import { blogPage } from './pages/blog';
import { postPage } from './pages/post';
import { addTick } from './core/ticker';
import { site, LOCALE } from '../site.config';

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

const RUNNING_HEAD: Record<string, string> = { home: '首页', blog: '日志' };
function setRunningHead(section: string, title?: string): void {
  const el = document.getElementById('runninghead');
  if (el) el.textContent = title || RUNNING_HEAD[section] || section;
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
  const home = () => {
    setRunningHead('home');
    return homePage();
  };
  route('/', home, 'home');
  route('/index.html', home, 'home');
  route('/blog', (ctx) => {
    setRunningHead('blog');
    return blogPage(ctx);
  }, 'blog');
  route('/blog/:slug', (ctx) => {
    const view = postPage(ctx);
    const probe = document.createElement('div');
    probe.innerHTML = view.html;
    setRunningHead('blog', probe.querySelector('.post-head__title')?.textContent ?? '日志');
    return view;
  }, 'blog');
}

function main(): void {
  applyConfig();
  hydrateIcons(document);
  on($('#btn-top'), 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  wireScroll();
  registerRoutes();
  initShortcuts();
  startRouter();
}

main();
