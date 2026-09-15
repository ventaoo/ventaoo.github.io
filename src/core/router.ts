/** History-API router with view mounting, teardown and a one-frame glitch transition. */
import { $, $$, on } from './dom';
import { chip } from './audio';
import { bindReveals } from '../fx/reveal';
import { bindParallax } from '../fx/parallax';
import { hydrateIcons } from './icons';
import { visitPage } from './gamification';

export interface View {
  title: string;
  html: string;
  /** Called after the HTML is in the DOM. May return a teardown function. */
  mount?: (root: HTMLElement) => void | (() => void);
  /** Called once the view has been painted and scrolled into place. */
  after?: () => void;
}

export interface Ctx {
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
}

type Handler = (ctx: Ctx) => View;

interface Route { pattern: string; keys: string[]; test: RegExp; handler: Handler; page: string }

const routes: Route[] = [];

export function route(pattern: string, handler: Handler, page = ''): void {
  const keys: string[] = [];
  const test = new RegExp(
    '^' +
      pattern
        .replace(/\/$/, '')
        .replace(/:([A-Za-z0-9_]+)/g, (_m, k: string) => {
          keys.push(k);
          return '([^/]+)';
        })
        .replace(/\*/g, '.*') +
      '/?$',
  );
  routes.push({ pattern, keys, test, handler, page });
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
let currentPage = '';

function match(path: string): { handler: Handler; params: Record<string, string>; page: string } | null {
  for (const r of routes) {
    const m = r.test.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? '')));
    return { handler: r.handler, params, page: r.page };
  }
  return null;
}

function setActiveNav(page: string): void {
  $$<HTMLAnchorElement>('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === page));
}

function glitch(): void {
  document.body.classList.add('glitching');
  window.setTimeout(() => document.body.classList.remove('glitching'), 430);
}

export function render(target?: string): void {
  const url = new URL(location.href);
  const path = normalize(target ?? url.pathname);
  const found = match(path);
  const viewEl = $('#view');
  if (!viewEl) return;

  teardown?.();
  teardown = null;

  const ctx: Ctx = { path, query: url.searchParams, params: found?.params ?? {} };
  const view: View = found ? found.handler(ctx) : notFound(path);

  viewEl.innerHTML = view.html;
  document.title = view.title;

  const page = found?.page ?? '404';
  if (page !== currentPage) {
    currentPage = page;
    setActiveNav(page);
    if (page !== '404') visitPage(page);
  }

  hydrateIcons(viewEl);
  bindReveals(viewEl);
  bindParallax(viewEl);
  const result = view.mount?.(viewEl);
  teardown = typeof result === 'function' ? result : null;

  // keep the HUD/footer counters honest
  document.dispatchEvent(new CustomEvent('pv:view'));

  requestAnimationFrame(() => {
    view.after?.();
    if (!ctx.query.has('keep-scroll')) window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function notFound(path: string): View {
  return {
    title: '404 · 信号丢失 — VENTAOO',
    html: `<div class="page"><div class="page__inner">
      <div class="empty">
        <div class="empty__code">404</div>
        <div class="empty__msg">这个坐标上没有东西</div>
        <p class="empty__hint">${path ? `找不到 <code>${path.replace(/[<>&]/g, '')}</code>` : '页面不存在'}</p>
        <a class="btn btn--primary" href="/" data-link>返回基地</a>
      </div>
    </div></div>`,
  };
}

export function navigate(to: string, opts: { replace?: boolean; silent?: boolean } = {}): void {
  const target = new URL(to, location.origin);
  const same = normalize(target.pathname) === normalize(location.pathname) && target.search === location.search;
  if (same) {
    render();
    return;
  }
  if (opts.replace) history.replaceState({}, '', target);
  else history.pushState({}, '', target);
  if (!opts.silent) chip.warp();
  glitch();
  render();
}

export function startRouter(): void {
  // Intercept in-site links.
  on(document, 'click', (ev: MouseEvent) => {
    const el = (ev.target as Element | null)?.closest?.('a');
    if (!el) return;
    const href = el.getAttribute('href');
    if (!href) return;
    if (el.hasAttribute('target') || el.hasAttribute('download') || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
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
    if (url.pathname.startsWith('/assets/') || /\.(xml|txt|png|jpe?g|svg|webp|ico|json|pdf)$/i.test(url.pathname)) return;
    ev.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', () => {
    chip.back();
    glitch();
    render();
  });

  // GitHub Pages 404 shim: pick the intended path back up after the redirect.
  try {
    const saved = sessionStorage.getItem('pv:redirect');
    if (saved) {
      sessionStorage.removeItem('pv:redirect');
      history.replaceState({}, '', saved);
    }
  } catch {
    /* ignore */
  }

  render();
}
