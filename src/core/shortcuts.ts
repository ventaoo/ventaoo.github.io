/** Global keyboard shortcuts and the help panel. */
import { $ } from './dom';
import { settings, setSetting, ACCENTS, ACCENT_LABEL, type Theme, type Accent } from './store';
import { toast } from './toast';
import { navigate } from './router';

export const HELP: { keys: string; desc: string }[] = [
  { keys: 'T', desc: '切换深色 / 浅色' },
  { keys: 'A', desc: '换一种强调色' },
  { keys: 'G B', desc: '跳到日志' },
  { keys: '/', desc: '在日志页聚焦搜索框' },
  { keys: '?', desc: '打开这个面板' },
];

export function toggleTheme(): void {
  const next: Theme = settings.theme === 'dark' ? 'light' : 'dark';
  setSetting('theme', next);
  toast(next === 'dark' ? '墨色' : '纸色', next === 'dark' ? '夜深了' : '天亮了');
}

export function cycleAccent(): void {
  const next = ACCENTS[(ACCENTS.indexOf(settings.accent) + 1) % ACCENTS.length] as Accent;
  setSetting('accent', next);
  toast('强调色 · ' + ACCENT_LABEL[next], '按 A 继续切换');
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
    <p class="modal__foot">右上角的四个色点是四种墨色，点一下就能换。</p>`);
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
      case 'a': cycleAccent(); break;
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
