/**
 * Markdown → HTML：语法高亮、标题目录、图片成组。
 * 只在文章页与旅途故事页动态 import —— marked 与 highlight.js 不会拖慢首屏。
 */
import { Marked, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import java from 'highlight.js/lib/languages/java';
import diff from 'highlight.js/lib/languages/diff';
import ini from 'highlight.js/lib/languages/ini';
import { esc } from '../core/dom';

const LANGS = { javascript, typescript, python, bash, json, css, xml, markdown, yaml, go, rust, sql, cpp, c, java, diff, ini };
for (const [name, def] of Object.entries(LANGS)) hljs.registerLanguage(name, def);
hljs.registerAliases(['js', 'jsx', 'mjs'], { languageName: 'javascript' });
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' });
hljs.registerAliases(['py'], { languageName: 'python' });
hljs.registerAliases(['sh', 'shell', 'zsh', 'console'], { languageName: 'bash' });
hljs.registerAliases(['html', 'svg'], { languageName: 'xml' });
hljs.registerAliases(['md'], { languageName: 'markdown' });
hljs.registerAliases(['yml'], { languageName: 'yaml' });
hljs.registerAliases(['golang'], { languageName: 'go' });
hljs.registerAliases(['rs'], { languageName: 'rust' });
hljs.registerAliases(['c++', 'hpp', 'cc'], { languageName: 'cpp' });

export interface Heading { id: string; text: string; depth: number }

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'section'
  );
}

function highlight(code: string, lang: string): string {
  const language = hljs.getLanguage(lang) ? lang : '';
  try {
    if (language) return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    return esc(code); // 没注册的语言原样输出，不猜
  } catch {
    return esc(code);
  }
}

/** 一张图就是一个 figure，alt 当作图注。 */
function figure(href: string, alt: string, title: string | null | undefined, wide: boolean): string {
  const caption = title || alt;
  return `<figure class="figure${wide ? ' figure--wide' : ''}">
  <img src="${esc(href)}" alt="${esc(alt)}" loading="lazy" decoding="async" />
  ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}
</figure>`;
}

const marked = new Marked({ gfm: true, breaks: false });
let collected: Heading[] = [];
const usedIds = new Map<string, number>();

marked.use({
  renderer: {
    heading({ tokens, depth }: Tokens.Heading): string {
      const inline = this.parser.parseInline(tokens);
      const plain = tokens.map((t) => ('text' in t ? String(t.text) : '')).join('');
      let id = slugify(plain);
      const seen = usedIds.get(id) ?? 0;
      usedIds.set(id, seen + 1);
      if (seen) id = `${id}-${seen}`;
      if (depth === 2 || depth === 3) collected.push({ id, text: plain, depth });
      return `<h${depth} id="${id}"><a class="anchor" href="#${id}" tabindex="-1" aria-hidden="true">#</a>${inline}</h${depth}>`;
    },

    /* 整段只有图片时合并成图组：单独一张铺满，两三张并排。 */
    paragraph({ tokens }: Tokens.Paragraph): string {
      const images = tokens.filter((t): t is Tokens.Image => t.type === 'image');
      const rest = tokens.filter(
        (t) => t.type !== 'image' && !(t.type === 'text' && !String(t.text).trim()),
      );
      if (images.length && !rest.length) {
        const shots = images
          .map((im) => figure(im.href, im.text ?? '', im.title, images.length === 1))
          .join('');
        const cls = images.length > 1 ? `shots shots--${Math.min(images.length, 3)}` : 'shots';
        return `<div class="${cls}">${shots}</div>`;
      }
      return `<p>${this.parser.parseInline(tokens)}</p>`;
    },

    image({ href, title, text }: Tokens.Image): string {
      return figure(href, text ?? '', title, false);
    },

    code({ text, lang }: Tokens.Code): string {
      const language = (lang || '').split(/\s+/)[0] || '';
      return [
        '<div class="codeblock">',
        `<div class="codeblock__bar"><span>${esc(language || 'text')}</span>`,
        `<button class="codeblock__copy" type="button" data-copy><span>复制</span></button></div>`,
        `<pre><code class="hljs language-${esc(language || 'text')}">${highlight(text, language)}</code></pre>`,
        '</div>',
      ].join('');
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      return `<blockquote>${this.parser.parse(tokens)}</blockquote>`;
    },

    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href) && !href.includes('ventaoo.github.io');
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${attrs}>${text}${external ? ' ↗' : ''}</a>`;
    },

    table(token: Tokens.Table): string {
      const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
      const rows = token.rows
        .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`)
        .join('');
      return `<div class="tablewrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
    },
  },
});

/**
 * 把「连续几段只有一张图」合并成一段，好让它们排成图组。
 * 写内容时图片之间空不空行都能成组 —— 空行更符合直觉。
 */
function groupImages(md: string): string {
  return md.replace(/(!\[[^\]]*\]\([^)]*\))[ \t]*\n[ \t]*\n(?=!\[)/g, '$1\n');
}

export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  collected = [];
  usedIds.clear();
  const html = marked.parse(groupImages(md), { async: false }) as string;
  return { html, headings: collected.slice() };
}

/** 代码块的「复制」按钮 —— 页面挂载时调用一次。 */
export function bindCopy(root: ParentNode): void {
  root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.closest('.codeblock')?.querySelector('code')?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        const label = btn.querySelector('span');
        if (label) {
          const before = label.textContent;
          label.textContent = '已复制';
          window.setTimeout(() => (label.textContent = before), 1400);
        }
      } catch {
        /* 剪贴板不可用就什么也不做 */
      }
    });
  });
}
