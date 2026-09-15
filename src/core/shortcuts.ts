/** Global keyboard shortcuts, the help modal, and the Konami code. */
import { $ } from './dom';
import { chip } from './audio';
import { settings, setSetting, PALETTES, PALETTE_LABEL, type Theme, type Palette } from './store';
import { toast } from './toast';
import { rain } from '../fx/confetti';
import { navigate } from './router';

export const HELP: { keys: string; desc: string }[] = [
  { keys: 'T', desc: '切换昼夜 —— 也可以直接点天上的太阳' },
  { keys: 'P', desc: '换一套配色' },
  { keys: 'C', desc: '开关显像管滤镜' },
  { keys: 'M / B', desc: '开关音效 / 背景音乐' },
  { keys: 'G B', desc: '跳到博客' },
  { keys: '/', desc: '在博客页聚焦搜索框' },
  { keys: '?', desc: '打开这个面板' },
];

let partyOn = false;

export function toggleTheme(): void {
  const next: Theme = settings.theme === 'night' ? 'day' : 'night';
  setSetting('theme', next);
  chip.power();
  toast(next === 'night' ? '夜幕降临' : '天亮了', next === 'night' ? '城市的灯一盏盏亮起来' : '阳光穿过像素云层');
}

export function cyclePalette(): void {
  const next = PALETTES[(PALETTES.indexOf(settings.palette) + 1) % PALETTES.length] as Palette;
  setSetting('palette', next);
  chip.select();
  toast('配色 · ' + PALETTE_LABEL[next], '按 P 继续切换');
}

export function toggleParty(): void {
  partyOn = !partyOn;
  document.documentElement.dataset.party = partyOn ? 'on' : 'off';
  if (partyOn) {
    rain(120);
    chip.jingle();
    toast('PARTY MODE', '按 Esc 冷静一下');
  } else {
    toast('恢复常规配色');
  }
}

export function openModal(html: string): void {
  const modal = $('#modal');
  const body = $('#modal-body');
  if (!modal || !body) return;
  body.innerHTML = html;
  modal.hidden = false;
  chip.select();
  $<HTMLElement>('#modal-close')?.focus();
}

export function closeModal(): void {
  const modal = $('#modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  chip.back();
}

export function showHelp(): void {
  openModal(`<h2 class="modal__h">快捷键</h2>
    <div class="keys">
      ${HELP.map(
        (h) => `<div class="keys__row"><span class="keys__desc">${h.desc}</span><span>${h.keys
          .split(' ')
          .map((k) => `<kbd>${k}</kbd>`)
          .join(' ')}</span></div>`,
      ).join('')}
    </div>
    <p class="muted modal__foot">还有一串古老的秘技藏在这里 —— 八个方向，两个按钮。</p>`);
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIdx = 0;

export function initShortcuts(): void {
  let gPending = false;
  let gTimer: number | undefined;

  window.addEventListener('keydown', (ev) => {
    const target = ev.target as HTMLElement | null;
    const typing = !!target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;

    // the Konami code works even while typing
    if (k === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        toggleParty();
      }
    } else {
      konamiIdx = k === KONAMI[0] ? 1 : 0;
    }

    if (ev.key === 'Escape') {
      closeModal();
      $('#nav')?.classList.remove('is-open');
      if (partyOn) toggleParty();
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
      case 'p': cyclePalette(); break;
      case 'c':
        setSetting('crt', !settings.crt);
        chip.select();
        toast('显像管滤镜 ' + (settings.crt ? '开启' : '关闭'));
        break;
      case 'm':
        toast('音效 ' + (chip.toggleSound() ? '开启' : '关闭'));
        window.dispatchEvent(new CustomEvent('pv:sync-controls'));
        break;
      case 'b':
        toast('背景音乐 ' + (chip.toggleMusic() ? '开启' : '关闭'));
        window.dispatchEvent(new CustomEvent('pv:sync-controls'));
        break;
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
    chip.blip();
    $('#nav')?.classList.toggle('is-open');
  });
}
