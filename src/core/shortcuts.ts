/** Global keyboard shortcuts and the help panel. */
import { $ } from './dom';
import { settings, setSetting, SCHEMES, SCHEME_LABEL, type Theme, type Scheme } from './store';
import { toast } from './toast';
import { navigate } from './router';

export const HELP: { keys: string; desc: string }[] = [
  { keys: 'T', desc: '切换深浅色' },
  { keys: 'S', desc: '换一套配色系统' },
  { keys: 'G B', desc: '跳到日志' },
  { keys: '/', desc: '在日志页聚焦搜索框' },
  { keys: '?', desc: '打开这个面板' },
];

export function toggleTheme(): void {
  const next: Theme = settings.theme === 'dark' ? 'light' : 'dark';
  setSetting('theme', next);
  toast(next === 'dark' ? '深色' : '浅色');
}

export function cycleScheme(): void {
  const next = SCHEMES[(SCHEMES.indexOf(settings.scheme) + 1) % SCHEMES.length] as Scheme;
  setSetting('scheme', next);
  toast('配色 · ' + SCHEME_LABEL[next], '按 S 继续切换');
}

export function openModal(html: string): void {
  const modal = $('#modal');
  const body = $('#modal-body');
  if (!modal || !body) return;
  body.innerHTML = html;
  modal.hidden = false;
  $<HTMLElement>('#modal-close')?.focus();
}

export function closeModal(): void {
  const modal = $('#modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
}

export function showHelp(): void {
  openModal(`<h2 class="modal__h">快捷键</h2>
    <div class="keys">
      ${HELP.map(
        (h) => `<div class="keys__row"><span class="keys__desc">${h.desc}</span><span class="keys__keys">${h.keys
          .split(' ')
          .map((k) => `<kbd>${k}</kbd>`)
          .join('')}</span></div>`,
      ).join('')}
    </div>
    <p class="modal__foot">页眉右上角的四个方块是四套配色系统，点一下就能换。</p>`);
}

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
    if (typing) return;

    if (gPending) {
      gPending = false;
      clearTimeout(gTimer);
      if (k === 'b') {
        ev.preventDefault();
        navigate('/blog');
        return;
      }
    }

    switch (k) {
      case 't': toggleTheme(); break;
      case 's': cycleScheme(); break;
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
