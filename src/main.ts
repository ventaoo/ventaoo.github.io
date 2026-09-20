/**
 * Entry point: wire the masthead, register the routes, start the router.
 */
import './styles/index.css';

import { hydrateIcons } from './core/icons';
import { route, startRouter } from './core/router';
import { initShortcuts } from './core/shortcuts';
import { initTheme } from './core/theme';
import { homePage } from './pages/home';
import { blogPage } from './pages/blog';
import { postPage } from './pages/post';
import { aboutPage } from './pages/about';
import { site, LOCALE } from '../site.config';

/** Fill every config-driven slot in the static shell. */
function applyConfig(): void {
  document.documentElement.lang = LOCALE;
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('brand-name', site.name);
  set('footer-name', site.name);
  set('footer-note', site.footerNote);
  set('colophon-note', site.tagline);
  set('year', String(new Date().getFullYear()));
}

const RUNNING_HEAD: Record<string, string> = { home: '卷首', blog: '随笔', about: '关于' };
function setRunningHead(section: string, title?: string): void {
  const el = document.getElementById('runninghead');
  if (el) el.textContent = title || RUNNING_HEAD[section] || section;
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
  route('/blog/:slug', async (ctx) => {
    const view = await postPage(ctx);
    const probe = document.createElement('div');
    probe.innerHTML = view.html;
    setRunningHead('blog', probe.querySelector('.post-head__title')?.textContent ?? '随笔');
    return view;
  }, 'blog');
  route('/about', () => {
    setRunningHead('about');
    return aboutPage();
  }, 'about');
}

function main(): void {
  applyConfig();
  initTheme();
  hydrateIcons(document);
  registerRoutes();
  initShortcuts();
  startRouter();
}

main();
