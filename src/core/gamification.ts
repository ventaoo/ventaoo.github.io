/**
 * A tiny RPG layer: scrolling earns XP, exploring unlocks achievements.
 * It exists purely because "levelling up" makes reading a blog more fun.
 */
import { save, saveGame, notify } from './store';
import { chip } from './audio';
import { toast } from './toast';
import { burst } from '../fx/confetti';
import { posts } from '../blog/posts';

export interface Achievement { id: string; title: string; desc: string; icon: string }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'boot', title: '系统启动', desc: '第一次点亮像素空间站', icon: 'power' },
  { id: 'explorer', title: '全域漫游', desc: '走遍站点的每一个角落', icon: 'map-pin' },
  { id: 'reader', title: '阅读者', desc: '读完了三篇日志', icon: 'book-open' },
  { id: 'scholar', title: '博览群书', desc: '读完了所有日志', icon: 'star' },
  { id: 'hacker', title: '入侵终端', desc: '在终端里敲下第一条命令', icon: 'terminal' },
  { id: 'konami', title: '古老秘技', desc: '输入了那串传说中的方向键', icon: 'gamepad' },
  { id: 'cycler', title: '昼夜循环', desc: '手动改变了世界的时刻', icon: 'sun' },
  { id: 'archivist', title: '档案管理员', desc: '用标签筛选了文章', icon: 'bookmark' },
];

const PAGE_KEYS = ['home', 'blog', 'projects', 'lab', 'about'];

export function xpState(xp = save.xp): { level: number; into: number; need: number } {
  let level = 1;
  let need = 100;
  let spent = 0;
  while (xp >= spent + need && level < 99) {
    spent += need;
    level += 1;
    need = Math.round(need * 1.35);
  }
  return { level, into: xp - spent, need };
}

export function addXp(amount: number, silent = false): void {
  const before = xpState().level;
  save.xp += Math.max(0, Math.round(amount));
  const after = xpState();
  if (after.level > before) {
    save.level = after.level;
    chip.levelUp();
    burst(90, innerWidth - 180, innerHeight - 140);
    toast(`升级！LV ${after.level}`, `获得称号「${titleFor(after.level)}」`, 'ach', 5000);
    document.getElementById('hud')?.classList.add('is-levelup');
    window.setTimeout(() => document.getElementById('hud')?.classList.remove('is-levelup'), 760);
  } else if (!silent) {
    chip.coin();
  }
  saveGame();
  notify();
}

export function titleFor(level: number): string {
  if (level >= 12) return '像素之神';
  if (level >= 9) return '宇宙建筑师';
  if (level >= 6) return '星轨领航员';
  if (level >= 3) return '像素工匠';
  return '像素漫游者';
}

export function unlock(id: string): void {
  if (save.achievements.includes(id)) return;
  const meta = ACHIEVEMENTS.find((a) => a.id === id);
  if (!meta) return;
  save.achievements.push(id);
  saveGame();
  notify();
  chip.achievement();
  toast(`成就解锁 · ${meta.title}`, meta.desc, 'ach', 5200);
}

export function has(id: string): boolean {
  return save.achievements.includes(id);
}

export function visitPage(page: string): void {
  if (!PAGE_KEYS.includes(page)) return;
  if (!save.pagesSeen.includes(page)) save.pagesSeen.push(page);
  saveGame();
  notify();
  if (PAGE_KEYS.every((p) => save.pagesSeen.includes(p))) unlock('explorer');
}

export function markPostRead(slug: string): void {
  if (!save.postsRead.includes(slug)) save.postsRead.push(slug);
  saveGame();
  notify();
  if (save.postsRead.length >= 3) unlock('reader');
  if (posts.length && posts.every((p) => save.postsRead.includes(p.slug))) unlock('scholar');
}
