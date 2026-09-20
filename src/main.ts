/** 入口：填充配置、装好主题、注册路由、启动。 */
import './styles/index.css';

import { esc } from './core/dom';
import { hydrateIcons } from './core/icons';
import { route, startRouter } from './core/router';
import { initTheme } from './core/theme';
import { LOCALE, site } from '../site.config';
import { aboutPage } from './pages/about';
import { blogPage } from './pages/blog';
import { homePage } from './pages/home';
import { postPage } from './pages/post';
import { travelPage } from './pages/travel';
import { tripPage } from './pages/trip';

/** 按链接类型选一个小图标。 */
function linkIcon(href: string): string {
  if (href.startsWith('mailto:')) return 'mail';
  if (href.startsWith('http')) return 'github';
  return 'rss';
}

/** 把 index.html 里带 id 的空位填上配置文案。 */
function applyConfig(): void {
  document.documentElement.lang = LOCALE;
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('brand-name', site.name);
  set('brand-tagline', site.tagline);
  set('footer-name', site.name);
  set('footer-note', site.footerNote);
  set('year', String(new Date().getFullYear()));

  const links = document.getElementById('footer-links');
  if (links) {
    links.innerHTML = site.links
      .map(
        (l) =>
          `<a href="${esc(l.href)}"${l.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>` +
          `<span data-icon="${linkIcon(l.href)}" data-icon-size="15"></span>${esc(l.label)}</a>`,
      )
      .join('');
  }
}

function registerRoutes(): void {
  route('/', homePage, 'home');
  route('/index.html', homePage, 'home');
  route('/blog', blogPage, 'blog');
  route('/blog/:slug', postPage, 'blog');
  route('/travel', travelPage, 'travel');
  route('/travel/:slug', tripPage, 'travel');
  route('/about', aboutPage, 'about');
}

function main(): void {
  applyConfig();
  initTheme();
  hydrateIcons(document);
  registerRoutes();
  startRouter();
}

main();
