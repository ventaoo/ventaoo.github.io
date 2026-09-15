/**
 * PIXELVERSE — entry point.
 * Boots the world renderer, wires the chrome, registers routes and starts the router.
 */
import './styles/index.css';

import { $, $$, on } from './core/dom';
import { applyBootState, settings, setSetting, save, resetSave, subscribe } from './core/store';
import { chip } from './core/audio';
import { icon, hydrateIcons } from './core/icons';
import { initWorld } from './fx/world';
import { initCursor } from './fx/cursor';
import { route, startRouter, navigate } from './core/router';
import { initShortcuts, showHelp, toggleTheme, cyclePalette } from './core/shortcuts';
import { xpState, titleFor, ACHIEVEMENTS, unlock, addXp } from './core/gamification';
import { toast } from './core/toast';
import { drawAvatar, drawHudAvatar } from './core/avatar';
import { homePage } from './pages/home';
import { blogPage } from './pages/blog';
import { postPage } from './pages/post';
import { projectsPage } from './pages/projects';
import { labPage } from './pages/lab';
import { aboutPage } from './pages/about';
import { posts } from './blog/posts';
import { addTick } from './core/ticker';

/* ────────────────────────────── boot sequence ───────────────────────────── */
const BOOT_LINES = [
  'PIXELVERSE BIOS v1.0.0 — (c) VENTAOO',
  'CPU ..... 8-BIT @ 1.79 MHz ............ OK',
  'MEM ..... 640K CONVENTIONAL ........... OK',
  'VIDEO ... 320x200 / 16 COLORS ......... OK',
  'AUDIO ... SQUARE / TRIANGLE / NOISE ... OK',
  'MOUNT ... /dev/pixels ................. OK',
  'LOAD .... WORLD.DAT ................... OK',
  'SPAWN ... HERO, CAT, 9 PARALLAX LAYERS  OK',
  '',
  'SYSTEM READY.',
];

function runBoot(): Promise<void> {
  return new Promise((resolve) => {
    const boot = $('#boot');
    const log = $('#boot-log');
    const bar = $('#boot-bar') as HTMLElement | null;
    const already = sessionStorage.getItem('pv:booted') === '1';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!boot || already || reduced) {
      boot?.classList.add('is-done');
      window.setTimeout(() => boot?.remove(), 200);
      resolve();
      return;
    }
    sessionStorage.setItem('pv:booted', '1');

    let i = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (bar) bar.style.width = '100%';
      boot.classList.add('is-done');
      window.setTimeout(() => boot.remove(), 460);
      resolve();
    };

    const next = () => {
      if (finished) return;
      if (i >= BOOT_LINES.length) {
        window.setTimeout(finish, 420);
        return;
      }
      const line = document.createElement('div');
      line.textContent = BOOT_LINES[i];
      if (i === BOOT_LINES.length - 1) line.style.color = 'var(--a1)';
      log?.appendChild(line);
      i++;
      if (bar) bar.style.width = Math.round((i / BOOT_LINES.length) * 100) + '%';
      window.setTimeout(next, 78 + Math.random() * 70);
    };

    const skip = () => {
      window.removeEventListener('keydown', skip);
      boot.removeEventListener('click', skip);
      finish();
    };
    window.addEventListener('keydown', skip);
    boot.addEventListener('click', skip);

    window.setTimeout(next, 180);
  });
}

/* ────────────────────────────── chrome wiring ───────────────────────────── */
function syncControls(): void {
  const theme = $('#ctl-theme .ctl__face');
  if (theme) theme.dataset.icon = settings.theme === 'night' ? 'moon' : 'sun';
  $('#ctl-crt')?.classList.toggle('is-on', settings.crt);
  $('#ctl-sound')?.classList.toggle('is-on', settings.sound);
  const soundFace = $('#ctl-sound .ctl__face');
  if (soundFace) soundFace.dataset.icon = settings.sound ? 'volume-3' : 'volume-x-solid';
  hydrateIcons(document);
}

function renderHud(): void {
  const { level, into, need } = xpState();
  const fill = $('#hud-xp');
  if (fill) fill.style.width = Math.round((into / need) * 100) + '%';
  const text = $('#hud-xp-text');
  if (text) text.textContent = `${into} / ${need} XP`;
  const lvl = $('#hud-level');
  if (lvl) lvl.textContent = String(level);
  const ach = $('#hud-ach');
  if (ach) ach.textContent = `${save.achievements.length}/${ACHIEVEMENTS.length}`;
  const title = $('#hud-title');
  if (title) title.textContent = titleFor(level);
}

function renderFooter(): void {
  const set = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set('stat-visited', String(save.visits));
  set('stat-posts', String(posts.length));
  set('stat-level', String(xpState().level));
  set('year', String(new Date().getFullYear()));
}

function wireControls(): void {
  on($('#ctl-theme'), 'click', toggleTheme);
  on($('#ctl-crt'), 'click', () => {
    setSetting('crt', !settings.crt);
    chip.select();
    toast('显像管滤镜 ' + (settings.crt ? '开启' : '关闭'), settings.crt ? '感受那些扫描线' : '画面干净了');
    syncControls();
  });
  on($('#ctl-sound'), 'click', () => {
    const on = chip.toggleSound();
    toast('音效 ' + (on ? '开启' : '关闭'), on ? '按 M 也可以切换' : '世界安静了');
    syncControls();
  });
  on($('#hud-toggle'), 'click', () => {
    $('#hud')?.classList.toggle('is-collapsed');
    chip.blip();
  });
  on($('#btn-reset'), 'click', () => {
    resetSave();
    renderHud();
    renderFooter();
    chip.back();
    toast('存档已重置', '经验、成就与足迹都清空了');
  });

  window.addEventListener('pv:toggle-theme', () => toggleTheme());
  window.addEventListener('pv:sync-controls', () => syncControls());
  document.addEventListener('pv:view', () => {
    renderHud();
    renderFooter();
  });
  document.addEventListener('keydown', (ev) => {
    const el = ev.target as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    if (ev.key === '?') {
      ev.preventDefault();
      showHelp();
    }
  });
}

/* ────────────────────────────── scroll chrome ───────────────────────────── */
function wireScroll(): void {
  let lastY = window.scrollY;
  const bar = $('#scroll-fill');

  addTick((_dt, _t, y) => {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - innerHeight);
    if (bar) bar.style.height = ((y / max) * 100).toFixed(2) + '%';

    const topbar = $('#topbar');
    if (topbar) {
      const goingDown = y > lastY + 6;
      const goingUp = y < lastY - 6;
      if (y > 220 && goingDown) topbar.classList.add('is-hidden');
      else if (goingUp || y < 120) topbar.classList.remove('is-hidden');
      topbar.classList.toggle('is-stuck', y > 20);
    }
    lastY = y;
  });
}

/* ────────────────────────────── routes ───────────────────────────── */
function registerRoutes(): void {
  route('/', () => homePage(), 'home');
  route('/index.html', () => homePage(), 'home');
  route('/blog', (ctx) => blogPage(ctx), 'blog');
  route('/blog/:slug', (ctx) => postPage(ctx), 'blog');
  route('/projects', () => projectsPage(), 'projects');
  route('/lab', () => labPage(), 'lab');
  route('/about', () => aboutPage(), 'about');
}

/* ────────────────────────────── go ───────────────────────────── */
async function main(): Promise<void> {
  applyBootState();
  hydrateIcons(document);
  syncControls();
  renderHud();
  renderFooter();

  wireControls();
  wireScroll();
  registerRoutes();
  initShortcuts();

  const bootPromise = runBoot();

  try {
    initWorld();
  } catch (err) {
    console.error('[main] world failed', err);
  }
  initCursor();

  await bootPromise;

  startRouter();

  const unlockAudio = () => {
    chip.unlock();
    if (settings.music) chip.startMusic();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  if (!save.achievements.includes('boot')) {
    window.setTimeout(() => {
      unlock('boot');
      addXp(10, true);
      toast('欢迎来到像素空间站', '滚动可以赚经验，去发现 8 个成就吧', 'ach', 6000);
    }, 900);
  }

  subscribe(() => {
    renderHud();
    renderFooter();
  });

  window.addEventListener('resize', renderFooter);

  void $$;
  void icon;
  void navigate;
  void cyclePalette;
  void drawAvatar;
  void drawHudAvatar;
}

void main();
