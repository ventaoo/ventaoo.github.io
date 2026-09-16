/** Global keyboard shortcuts and the help dialog. */
import { $ } from './dom';
import { navigate } from './router';

export const HELP: { keys: string; desc: string }[] = [
  { keys: 'G B', desc: '跳到日志' },
  { keys: '/', desc: '在日志页聚焦搜索框' },
  { keys: '?', desc: '打开这个面板' },
];

/** Whatever had focus before the dialog opened, so it can be handed back. */
let restoreFocus: HTMLElement | null = null;

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function openModal(html: string): void {
  const modal = $('#modal');
  const body = $('#modal-body');
  if (!modal || !body) return;
  restoreFocus = document.activeElement as HTMLElement | null;
  body.innerHTML = html;
  modal.hidden = false;
  const first = modal.querySelector<HTMLElement>(FOCUSABLE);
  first?.focus();
}

export function closeModal(): void {
  const modal = $('#modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  // put the caret back where it was, so the keyboard does not lose its place
  restoreFocus?.focus?.();
  restoreFocus = null;
}

/** Keep Tab inside the dialog while it is open. */
function trapTab(ev: KeyboardEvent): void {
  const modal = $('#modal');
  if (!modal || modal.hidden || ev.key !== 'Tab') return;
  const items = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (ev.shiftKey && (active === first || !modal.contains(active))) {
    ev.preventDefault();
    last.focus();
  } else if (!ev.shiftKey && active === last) {
    ev.preventDefault();
    first.focus();
  }
}

export function showHelp(): void {
  openModal(`<h2 class="modal__h" id="help-title">快捷键</h2>
    <div class="keys">
      ${HELP.map(
        (h) => `<div class="keys__row"><span class="keys__desc">${h.desc}</span><span class="keys__keys">${h.keys
          .split(' ')
          .map((k) => `<kbd>${k}</kbd>`)
          .join('')}</span></div>`,
      ).join('')}
    </div>`);
}

const GO: Record<string, string> = { b: '/blog', h: '/' };

export function initShortcuts(): void {
  let gPending = false;
  let gTimer: number | undefined;

  window.addEventListener('keydown', (ev) => {
    const target = ev.target as HTMLElement | null;
    const typing = !!target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;

    if (ev.key === 'Escape') {
      closeModal();
      $('#nav')?.classList.remove('is-open');
      return;
    }

    trapTab(ev);

    if (typing) return;

    if (gPending) {
      gPending = false;
      clearTimeout(gTimer);
      const to = GO[k];
      if (to) {
        ev.preventDefault();
        navigate(to);
        return;
      }
    }

    switch (k) {
      case '/': {
        const box = document.getElementById('post-search') as HTMLInputElement | null;
        if (box) {
          ev.preventDefault();
          box.focus();
        }
        break;
      }
      case '?': showHelp(); break;
      case 'g':
        gPending = true;
        gTimer = window.setTimeout(() => (gPending = false), 1200);
        break;
      default: break;
    }
  });

  $('#modal-close')?.addEventListener('click', closeModal);
  $('#modal')?.addEventListener('click', (ev) => {
    if (ev.target === $('#modal')) closeModal();
  });
  $('#ctl-menu')?.addEventListener('click', () => {
    $('#nav')?.classList.toggle('is-open');
  });
}
