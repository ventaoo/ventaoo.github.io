/** 入口：注册路由，启动。 */
import './styles/index.css';

import { hydrateIcons } from './core/icons';
import { route, startRouter } from './core/router';
import { LOCALE } from '../site.config';
import { aboutPage } from './pages/about';
import { homePage } from './pages/home';
import { postPage } from './pages/post';

function registerRoutes(): void {
  document.documentElement.lang = LOCALE;
  route('/', homePage, 'home');
  route('/index.html', homePage, 'home');
  // 首页就是目录，/blog 指向同一页，老链接不会断
  route('/blog', homePage, 'home');
  route('/blog/:slug', postPage, 'home');
  route('/about', aboutPage, 'about');
}

function main(): void {
  registerRoutes();
  hydrateIcons(document);
  startRouter();
}

main();
