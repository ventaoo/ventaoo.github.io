/** Global keyboard shortcuts, the help modal, and the Konami code. */
import { $, $$ } from './dom';
import { chip } from './audio';
import { settings, setSetting, resetSave, type Theme, type Palette } from './store';
import { unlock, addXp } from './gamification';
import { toast } from './toast';
import { rain, burst } from '../fx/confetti';
import { icon } from './icons';
import { navigate } from './router';

export interface Action { id: string; keys: string[]; label: string; run: () => void }

export const HELP: { keys: string; desc: string }[] = [
  { keys: 'T', desc: '切换昼夜（也可以直接点天上的太阳）' },
  { keys: 'C', desc: '开关显像管滤镜' },
  { keys: 'M', desc: '开关音效' },
  { keys: 'B', desc: '开关背景芯片音乐' },
  { keys: 'P', desc: '循环切换配色方案' },
  { keys: 'R', desc: '随机传送一篇文章' },
  { keys: 'G 然后 H/B/P/L/A', desc: '跳转到 首页 / 博客 / 项目 / 实验室 / 关于' },
  { keys: '/', desc: '聚焦博客搜索框' },
  { keys: '?', desc: '打开这个帮助面板' },
  { keys: 'Esc', desc: '关闭弹窗 / 菜单' },
];

const PALETTES: Palette[] = ['dusk', 'gameboy', 'vapor', 'amber'];
const PALETTE_LABEL: Record<Palette, string> = { dusk: '暮色', gameboy: '掌机绿', vapor: '蒸汽波', amber: '琥珀终端' };

let partyOn = false;

export function toggleTheme(): void {
  const next: Theme = settings.theme === 'night' ? 'day' : 'night';
  setSetting('theme', next);
  chip.power();
  unlock('cycler');
  toast(next === 'night' ? '夜幕降临' : '天亮了', next === 'night' ? '城市的灯一盏盏亮起来' : '阳光穿过像素云层');
}

export function cyclePalette(): void {
  const i = PALETTES.indexOf(settings.palette);
  const next = PALETTES[(i + 1) % PALETTES.length];
  setSetting('palette', next);
  chip.select();
  toast('配色方案 · ' + PALETTE_LABEL[next], '按 P 继续切换');
}

export function toggleParty(): void {
  partyOn = !partyOn;
  document.documentElement.dataset.party = partyOn ? 'on' : 'off';
  if (partyOn) {
    rain(140);
    chip.levelUp();
    toast('PARTY MODE', '按 Esc 冷静一下', 'ach');
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
  $('#modal-close')?.focus();
}

export function closeModal(): void {
  const modal = $('#modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  chip.back();
}

export function showHelp(): void {
  openModal(`<h2 style="font-size:clamp(18px,2vw,24px);margin-bottom:6px">快捷键</h2>
    <p class="muted" style="margin-bottom:20px;font-size:var(--fs-sm)">键盘是这个空间站的第一公民。</p>
    <div class="keys">
      ${HELP.map(
        (h) => `<div class="keys__row"><span class="keys__desc">${h.desc}</span><span>${h.keys
          .split(' ')
          .map((k) => `<kbd>${k}</kbd>`)
          .join(' ')}</span></div>`,
      ).join('')}
    </div>
    <p class="muted" style="margin-top:22px;font-size:var(--fs-sm)">还有一串古老的秘技藏在某个地方 —— 八个方向，两个按钮。</p>`,
  );
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIdx = 0;

export function initShortcuts(): void {
  let gPending = false;
  let gTimer: number | undefined;

  window.addEventListener('keydown', (ev) => {
    const target = ev.target as HTMLElement | null;
    const typing = !!target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);

    // ── konami code works even while typing ──
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (k === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        unlock('konami');
        addXp(80, true);
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
      const map: Record<string, string> = { h: '/', b: '/blog', p: '/projects', l: '/lab', a: '/about' };
      const to = map[k];
      if (to) {
        ev.preventDefault();
        navigate(to);
        return;
      }
    }

    switch (k) {
      case 't': toggleTheme(); break;
      case 'c': {
        setSetting('crt', !settings.crt);
        chip.select();
        toast('显像管滤镜 ' + (settings.crt ? '开启' : '关闭'));
        break;
      }
      case 'm': {
        const on = chip.toggleSound();
        toast('音效 ' + (on ? '开启' : '关闭'));
        document.querySelector('[data-icon="volume-3"], [data-icon="volume-x-solid"]');
        document.dispatchEvent(new CustomEvent('pv:sync-controls'));
        break;
      }
      case 'b': {
        const on = chip.toggleMusic();
        toast('背景音乐 ' + (on ? '开启' : '关闭'));
        document.dispatchEvent(new CustomEvent('pv:sync-controls'));
        break;
      }
      case 'p': cyclePalette(); break;
      case '/': {
        ev.preventDefault();
        const box = document.getElementById('post-search') as HTMLInputElement | null;
        if (box) box.focus();
        else navigate('/blog');
        break;
      }
      case '?': showHelp(); break;
      case 'g':
        gPending = true;
        gTimer = window.setTimeout(() => (gPending = false), 1400);
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

  void burst;
  void rain;
  void icon;
  void $$;
}
