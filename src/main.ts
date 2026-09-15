/**
 * Entry point: boot the pixel world, wire the chrome, register the two routes.
 */
import './styles/index.css';

import { $, on } from './core/dom';
import { applyBootState, settings } from './core/store';
import { chip } from './core/audio';
import { hydrateIcons } from './core/icons';
import { initWorld } from './fx/world';
import { initCursor } from './fx/cursor';
import { route, startRouter } from './core/router';
import { initShortcuts, toggleTheme, cyclePalette } from './core/shortcuts';
import { toast } from './core/toast';
import { homePage } from './pages/home';
import { blogPage } from './pages/blog';
import { postPage } from './pages/post';
import { addTick } from './core/ticker';
import { site, SITE_URL, LOCALE } from '../site.config';

/* ────────────────────────────── boot ────────────────────────────── */
const BOOT_LINES = ['PIXELVERSE BIOS v1.1', 'VIDEO 320x200 / 16 COLORS ... OK', 'AUDIO SQUARE / NOISE ....... OK', 'SYSTEM READY.'];

function runBoot(): Promise<void> {
  return new Promise((resolve) => {
    const boot = $<HTMLElement>('#boot');
    const log = $('#boot-log');
    const bar = $<HTMLElement>('#boot-bar');
    const skipIt =
      sessionStorage.getItem('pv:booted') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!boot || skipIt) {
      boot?.remove();
      resolve();
      return;
    }
    sessionStorage.setItem('pv:booted', '1');

    let i = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (bar) bar.style.width = '100%';
      boot.classList.add('is-done');
      window.setTimeout(() => boot.remove(), 380);
      resolve();
    };

    const next = () => {
      if (done) return;
      if (i >= BOOT_LINES.length) {
        window.setTimeout(finish, 260);
        return;
      }
      const line = document.createElement('div');
      line.textContent = BOOT_LINES[i];
      if (i === BOOT_LINES.length - 1) line.style.color = 'var(--a1)';
      log?.appendChild(line);
      i++;
      if (bar) bar.style.width = Math.round((i / BOOT_LINES.length) * 100) + '%';
      window.setTimeout(next, 90);
    };

    const skip = () => {
      window.removeEventListener('keydown', skip);
      boot.removeEventListener('click', skip);
      finish();
    };
    window.addEventListener('keydown', skip);
    boot.addEventListener('click', skip);

    window.setTimeout(next, 120);
  });
}

/* ────────────────────────────── chrome ────────────────────────────── */
function syncControls(): void {
  const theme = $('#ctl-theme [data-icon]');
  if (theme) theme.dataset.icon = settings.theme === 'night' ? 'moon' : 'sun';
  const sound = $('#ctl-sound [data-icon]');
  if (sound) sound.dataset.icon = settings.sound ? 'volume-3' : 'volume-x-solid';
  $('#ctl-crt')?.classList.toggle('is-on', settings.crt);
  $('#ctl-sound')?.classList.toggle('is-on', settings.sound);
  hydrateIcons(document);
}

function wireControls(): void {
  on($('#ctl-theme'), 'click', toggleTheme);
  on($('#ctl-palette'), 'click', cyclePalette);
  on($('#ctl-sound'), 'click', () => {
    toast('音效 ' + (chip.toggleSound() ? '开启' : '关闭'), '按 M 也可以切换');
    syncControls();
  });
  on($('#btn-top'), 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('pv:sync-controls', syncControls);
}

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
  set('year', String(new Date().getFullYear()));
  document.querySelectorAll<HTMLAnchorElement>('a[data-site-link]').forEach((a) => {
    a.href = SITE_URL;
  });
}

function wireScroll(): void {
  let lastY = window.scrollY;
  const bar = $('#scroll-fill');
  addTick((_dt, _t, y) => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (bar) bar.style.height = ((y / max) * 100).toFixed(2) + '%';

    const topbar = $('#topbar');
    if (topbar) {
      const down = y > lastY + 6;
      const up = y < lastY - 6;
      if (y > 200 && down) topbar.classList.add('is-hidden');
      else if (up || y < 100) topbar.classList.remove('is-hidden');
      topbar.classList.toggle('is-stuck', y > 12);
    }
    const toTop = $('#btn-top');
    if (toTop) toTop.classList.toggle('is-on', y > 700);
    lastY = y;
  });
}

function registerRoutes(): void {
  route('/', () => homePage(), 'home');
  route('/index.html', () => homePage(), 'home');
  route('/blog', (ctx) => blogPage(ctx), 'blog');
  route('/blog/:slug', (ctx) => postPage(ctx), 'blog');
}

/* ────────────────────────────── go ────────────────────────────── */
async function main(): Promise<void> {
  applyBootState();
  applyConfig();
  hydrateIcons(document);
  syncControls();
  wireControls();
  wireScroll();
  registerRoutes();
  initShortcuts();

  const boot = runBoot();
  try {
    initWorld();
  } catch (err) {
    console.error('[main] world failed to start', err);
  }
  initCursor();
  await boot;
  startRouter();

  // browsers only allow audio after a real interaction
  const unlock = () => {
    chip.unlock();
    if (settings.music) chip.startMusic();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // a nudge toward the hidden shortcuts, once per session
  if (!sessionStorage.getItem('pv:hinted')) {
    sessionStorage.setItem('pv:hinted', '1');
    window.setTimeout(() => toast('按 ? 查看快捷键', '按 P 换配色 · 点太阳切换昼夜', 4200), 1400);
  }

}

void main();
