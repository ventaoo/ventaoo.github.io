/**
 * History-API 路由：视图挂载、拆卸、滚动位置记忆。
 * handler 可以是异步的 —— 文章页借此懒加载 Markdown/高亮引擎。
 */
import { $, $$, on } from './dom';
import { bindReveals } from './reveal';
import { hydrateIcons } from './icons';
import { site } from '../../site.config';

export interface View {
  title: string;
  html: string;
  /** Called once the markup is in the DOM; may return a teardown function. */
  mount?: (root: HTMLElement) => void | (() => void);
}

export interface Ctx {
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
}

type Handler = (ctx: Ctx) => View | Promise<View>;

interface Route { keys: string[]; test: RegExp; handler: Handler; nav: string }

const routes: Route[] = [];

export function route(pattern: string, handler: Handler, nav = ''): void {
  const keys: string[] = [];
  const test = new RegExp(
    '^' +
      pattern
        .replace(/\/$/, '')
        .replace(/:([A-Za-z0-9_]+)/g, (_m, k: string) => {
          keys.push(k);
          return '([^/]+)';
        }) +
      '/?$',
  );
  routes.push({ keys, test, handler, nav });
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function normalize(pathname: string): string {
  let p = pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

let teardown: (() => void) | null = null;
let currentNav = '';

/* ── 滚动位置记忆：前进/后退时回到原位，主动跳转时回页首 ────────────── */
const scrollMemory = new Map<string, number>();
let scrollTimer: number | undefined;
window.addEventListener(
  'scroll',
  () => {
    clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      scrollMemory.set(location.pathname + location.search, window.scrollY);
    }, 120);
  },
  { passive: true },
);

function match(path: string): { handler: Handler; params: Record<string, string>; nav: string } | null {
  for (const r of routes) {
    const m = r.test.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? '')));
    return { handler: r.handler, params, nav: r.nav };
  }
  return null;
}

export async function render(target?: string, opts: { pop?: boolean } = {}): Promise<void> {
  const url = new URL(location.href);
  const path = normalize(target ?? url.pathname);
  const found = match(path);
  const viewEl = $('#view');
  if (!viewEl) return;

  teardown?.();
  teardown = null;

  const ctx: Ctx = { path, query: url.searchParams, params: found?.params ?? {} };
  const view: View = found ? await found.handler(ctx) : notFound();

  viewEl.innerHTML = view.html;
  document.title = view.title;

  const nav = found?.nav ?? '';
  if (nav !== currentNav) {
    currentNav = nav;
    $$<HTMLAnchorElement>('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === nav;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  hydrateIcons(viewEl);
  bindReveals(viewEl);
  const result = view.mount?.(viewEl);
  teardown = typeof result === 'function' ? result : null;

  // popstate 时恢复记忆位置；主动导航回页首
  const remembered = opts.pop ? scrollMemory.get(location.pathname + location.search) : undefined;
  requestAnimationFrame(() =>
    window.scrollTo({ top: remembered ?? 0, behavior: 'auto' }),
  );
}

function notFound(): View {
  return {
    title: `没有这一页 · ${site.name}`,
    html: `<div class="tocpage">
  <p class="book__by">没有这一页</p>
  <h1 class="book__title">这个地址上没有东西</h1>
  <p class="book__sub">可能链接抄错了一个字，也可能它已经不在了。</p>
  <p class="block__more"><a href="/" data-link>← 回到目录</a></p>
</div>`,
  };
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  const target = new URL(to, location.origin);
  if (normalize(target.pathname) === normalize(location.pathname) && target.search === location.search) {
    render();
    return;
  }
  if (opts.replace) history.replaceState({}, '', target);
  else history.pushState({}, '', target);
  render();
}

export function startRouter(): void {
  on(document, 'click', (ev: MouseEvent) => {
    const el = (ev.target as Element | null)?.closest?.('a');
    const href = el?.getAttribute('href');
    if (!el || !href) return;
    if (el.hasAttribute('target') || el.hasAttribute('download')) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        ev.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return;
    if (/^\/assets\//.test(url.pathname)) return;
    if (/\.(xml|txt|png|jpe?g|svg|webp|ico|json|pdf)$/i.test(url.pathname)) return;
    ev.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', () => render(undefined, { pop: true }));

  // GitHub Pages 404 shim: recover the intended path after the redirect.
  try {
    const saved = sessionStorage.getItem('vx:redirect');
    if (saved) {
      sessionStorage.removeItem('vx:redirect');
      history.replaceState({}, '', saved);
    }
  } catch {
    /* ignore */
  }

  render();
}
