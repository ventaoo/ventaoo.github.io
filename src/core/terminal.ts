/** An interactive pixel terminal. The best part of any personal website. */
import { esc } from './dom';
import { chip } from './audio';
import { settings, setSetting, save, resetSave, type Palette } from './store';
import { xpState, ACHIEVEMENTS, unlock, addXp } from './gamification';
import { posts } from '../blog/posts';
import { profile, projects } from '../data/profile';
import { toast } from './toast';
import { rain, burst } from '../fx/confetti';
import { navigate } from './router';
import { toggleTheme, cyclePalette } from './shortcuts';

const FILES: Record<string, string> = {
  'about.txt': `${profile.name} — ${profile.title}
位置   ${profile.location}
邮件   ${profile.email}
简介   ${profile.bio}`,
  'skills.json': JSON.stringify(
    { languages: ['Python', 'TypeScript'], interests: ['像素艺术', '3DGS', 'CLI 工具', '表征学习'] },
    null,
    2,
  ),
  'contact.md': `# 联系方式

- GitHub: ${profile.github}
- Email:  ${profile.email}
- Site:   ${profile.site}`,
};

interface Line { text: string; cls?: string }

export class Terminal {
  private out: HTMLElement;
  private input: HTMLInputElement;
  private history: string[] = [];
  private hIdx = -1;
  private matrixTimer: number | null = null;

  constructor(root: HTMLElement) {
    const out = root.querySelector<HTMLElement>('.term__out');
    const input = root.querySelector<HTMLInputElement>('.term__input');
    if (!out || !input) throw new Error('terminal markup is missing');
    this.out = out;
    this.input = input;

    this.print(`PIXELVERSE SHELL v1.0.0  (c) ${new Date().getFullYear()} ${profile.name}`, 'dim');
    this.print('输入 "help" 查看可用命令。', 'dim');
    this.print('');

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        const value = input.value.trim();
        input.value = '';
        if (!value) return;
        this.history.push(value);
        this.hIdx = this.history.length;
        this.echo(value);
        this.run(value);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (this.hIdx > 0) input.value = this.history[--this.hIdx] ?? '';
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (this.hIdx < this.history.length - 1) input.value = this.history[++this.hIdx] ?? '';
        else {
          this.hIdx = this.history.length;
          input.value = '';
        }
      }
    });

    // clicking anywhere in the panel focuses the prompt
    root.addEventListener('click', (ev) => {
      if (window.getSelection()?.toString()) return;
      if ((ev.target as HTMLElement).closest('a')) return;
      input.focus();
    });
  }

  private write(text: string, cls = ''): void {
    const el = document.createElement('div');
    if (cls) el.className = cls;
    el.textContent = text;
    this.out.appendChild(el);
  }

  private print(text = '', cls = ''): void {
    this.write(text, cls);
    this.out.scrollTop = this.out.scrollHeight;
  }

  private echo(cmd: string): void {
    const row = document.createElement('div');
    row.innerHTML = `<span class="hl">visitor@pixelverse</span><span class="dim">:~$ </span>${esc(cmd)}`;
    this.out.appendChild(row);
  }

  private html(markup: string): void {
    const el = document.createElement('div');
    el.innerHTML = markup;
    this.out.appendChild(el);
    this.out.scrollTop = this.out.scrollHeight;
  }

  private table(rows: [string, string][]): void {
    const width = Math.max(...rows.map((r) => r[0].length));
    for (const [k, v] of rows) this.print(`${k.padEnd(width + 2)}${v}`);
  }

  private run(raw: string): void {
    const [cmd = '', ...args] = raw.split(/\s+/);
    const arg = args.join(' ');
    chip.blip();
    unlock('hacker');
    addXp(2, true);

    switch (cmd.toLowerCase()) {
      case 'help':
        this.print('可用命令：', 'warn');
        this.table([
          ['help', '显示这份帮助'],
          ['whoami', '我是谁'],
          ['neofetch', '系统信息'],
          ['ls', '列出可用文件'],
          ['cat <file>', '查看文件内容'],
          ['blog [slug]', '列出文章 / 打开某篇'],
          ['projects', '列出项目'],
          ['goto <page>', '跳转 home|blog|projects|lab|about'],
          ['theme <day|night>', '切换昼夜'],
          ['palette <name>', 'dusk|gameboy|vapor|amber'],
          ['crt <on|off>', '显像管滤镜'],
          ['sound <on|off>', '音效开关'],
          ['xp', '查看等级与经验'],
          ['achievements', '查看成就'],
          ['matrix', '进入矩阵'],
          ['coffee', '给自己泡杯咖啡'],
          ['sudo <cmd>', '你猜'],
          ['clear', '清屏'],
        ]);
        break;

      case 'whoami':
        this.print(`${profile.name} — ${profile.title} @ ${profile.location}`);
        this.print(profile.bio, 'dim');
        break;

      case 'neofetch': {
        const { level, into, need } = xpState();
        this.html(
          `<pre style="color:var(--a1);line-height:1.15">   ▄▄▄▄▄   <span style="color:var(--text-dim)">visitor@${profile.handle}</span>
  █ ▀▀▀ █  <span style="color:var(--text-dim)">-----------------</span>
  █ ▄▄▄ █  <span style="color:var(--text-dim)">OS</span>      Pixelverse 1.0
  ▀▀▀▀▀▀▀  <span style="color:var(--text-dim)">Shell</span>   pvsh
           <span style="color:var(--text-dim)">Theme</span>   ${settings.theme} / ${settings.palette}
           <span style="color:var(--text-dim)">Level</span>   ${level} (${into}/${need} XP)
           <span style="color:var(--text-dim)">Posts</span>   ${posts.length}
           <span style="color:var(--text-dim)">Achv</span>    ${save.achievements.length}/${ACHIEVEMENTS.length}</pre>`,
        );
        break;
      }

      case 'ls':
        this.print(Object.keys(FILES).join('   '), 'ok');
        break;

      case 'cat': {
        if (!arg) {
          this.print('cat: 缺少文件名。先试试 ls', 'err');
          break;
        }
        const file = FILES[arg];
        if (!file) {
          this.print(`cat: ${arg}: 没有这个文件`, 'err');
          break;
        }
        this.print(file);
        break;
      }

      case 'blog': {
        if (!arg) {
          this.print(`共 ${posts.length} 篇日志：`, 'warn');
          posts.forEach((p, i) => this.print(`  ${String(i + 1).padStart(2, '0')}  ${p.date}  ${p.slug.padEnd(24)} ${p.title}`));
          this.print('用 "blog <slug>" 打开某一篇。', 'dim');
          break;
        }
        const post = posts.find((p) => p.slug === arg || p.slug.includes(arg));
        if (!post) {
          this.print(`blog: 找不到 "${arg}"`, 'err');
          break;
        }
        this.print('正在跃迁到 ' + post.title + ' …', 'ok');
        window.setTimeout(() => navigate('/blog/' + post.slug), 320);
        break;
      }

      case 'projects':
        this.print('项目档案：', 'warn');
        projects.forEach((p) => this.print(`  ${p.name.padEnd(20)} ${p.lang.padEnd(12)} ${p.desc.slice(0, 40)}…`));
        this.print('完整列表见 "goto projects"。', 'dim');
        break;

      case 'goto': {
        const map: Record<string, string> = { home: '/', blog: '/blog', projects: '/projects', lab: '/lab', about: '/about' };
        const to = map[arg.toLowerCase()];
        if (!to) {
          this.print('用法：goto home|blog|projects|lab|about', 'err');
          break;
        }
        this.print('跃迁中 …', 'ok');
        window.setTimeout(() => navigate(to), 260);
        break;
      }

      case 'theme':
        if (arg === 'day' || arg === 'night') {
          if (settings.theme !== arg) toggleTheme();
          this.print('主题已设为 ' + arg, 'ok');
        } else {
          this.print('用法：theme day|night', 'err');
        }
        break;

      case 'palette': {
        const list: Palette[] = ['dusk', 'gameboy', 'vapor', 'amber'];
        if (list.includes(arg as Palette)) {
          let guard = 0;
          while (settings.palette !== arg && guard++ < 6) cyclePalette();
          this.print('配色已设为 ' + arg, 'ok');
        } else {
          this.print('用法：palette ' + list.join('|'), 'err');
        }
        break;
      }

      case 'crt':
        setSetting('crt', arg !== 'off');
        this.print('显像管滤镜 ' + (settings.crt ? 'on' : 'off'), 'ok');
        document.dispatchEvent(new CustomEvent('pv:sync-controls'));
        break;

      case 'sound':
        setSetting('sound', arg !== 'off');
        this.print('音效 ' + (settings.sound ? 'on' : 'off'), 'ok');
        document.dispatchEvent(new CustomEvent('pv:sync-controls'));
        break;

      case 'xp': {
        const { level, into, need } = xpState();
        this.print(`LV ${level} — ${into} / ${need} XP (总计 ${save.xp})`, 'ok');
        const pct = Math.round((into / need) * 100);
        const filled = Math.round(pct / 5);
        this.print('[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + `] ${pct}%`);
        break;
      }

      case 'achievements':
      case 'ach': {
        this.print(`成就 ${save.achievements.length}/${ACHIEVEMENTS.length}`, 'warn');
        for (const a of ACHIEVEMENTS) {
          const got = save.achievements.includes(a.id);
          this.print(`  [${got ? '✓' : ' '}] ${got ? a.title : '???'}  ${got ? a.desc : ''}`, got ? 'ok' : 'dim');
        }
        break;
      }

      case 'matrix':
        this.startMatrix();
        break;

      case 'coffee':
        this.html(
          `<pre style="color:var(--a6)">      ( (
   ) )  ) )
  ..........
  |        |]
  \\      /
   \\____/</pre>`,
        );
        this.print('☕ 咖啡已就绪。记得偶尔离开屏幕。', 'warn');
        break;

      case 'sudo':
        this.print('visitor 不在 sudoers 文件中。此事将被记录。', 'err');
        window.setTimeout(() => this.print('…开玩笑的，这里是像素世界。', 'dim'), 700);
        break;

      case 'rm':
        if (arg.includes('-rf') || arg === '-rf /') {
          this.print('拒绝执行。这个宇宙还要再跑一会儿。', 'err');
          chip.error();
          break;
        }
        this.print('rm: 用法不对。', 'err');
        break;

      case 'reset':
        resetSave();
        this.print('存档已重置。', 'ok');
        break;

      case 'clear':
        this.out.innerHTML = '';
        break;

      case 'exit':
        this.print('没有出口 —— 只有一个返回按钮。', 'warn');
        break;

      case 'konami':
        this.print('↑ ↑ ↓ ↓ ← → ← → B A', 'hl');
        break;

      default:
        this.print(`pvsh: 未找到命令 "${cmd}"。输入 help 看看有什么。`, 'err');
        chip.error();
    }
  }

  private startMatrix(): void {
    if (this.matrixTimer !== null) {
      clearInterval(this.matrixTimer);
      this.matrixTimer = null;
      this.print('退出矩阵。', 'dim');
      return;
    }
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01';
    this.print('进入矩阵 … 再输一次 matrix 退出。', 'ok');
    rain(60);
    let frames = 0;
    this.matrixTimer = window.setInterval(() => {
      const line = Array.from({ length: 52 }, () => chars[(Math.random() * chars.length) | 0]).join('');
      this.print(line, Math.random() > 0.7 ? 'ok' : 'dim');
      if (++frames > 90) {
        clearInterval(this.matrixTimer!);
        this.matrixTimer = null;
        this.print('矩阵稳定下来了。', 'dim');
      }
    }, 70);
  }

  focus(): void {
    this.input.focus();
  }
}

export function terminalMarkup(): string {
  return `<div class="term" id="terminal">
    <div class="term__bar"><span>pvsh — visitor@pixelverse</span></div>
    <div class="term__out"></div>
    <div class="term__input-row">
      <span class="term__prompt">visitor@pixelverse:~$</span>
      <input class="term__input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="终端输入" placeholder="输入 help 开始 …" />
    </div>
  </div>`;
}

export function initTerminals(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.term').forEach((el) => {
    if (el.dataset.ready === '1') return;
    el.dataset.ready = '1';
    try {
      new Terminal(el);
    } catch (err) {
      console.error('[terminal]', err);
    }
  });
}

export { toast, burst };
