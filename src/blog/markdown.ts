/**
 * Markdown → HTML：语法高亮 + 目录收集。
 * 这个模块只在文章页被动态 import —— marked 与 highlight.js 不会拖慢首屏。
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
import { icon } from '../core/icons';
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
      .replace(/[^\w一-龥\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'section'
  );
}

function highlight(code: string, lang: string): string {
  const language = hljs.getLanguage(lang) ? lang : '';
  try {
    if (language) return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    return esc(code); // 未注册的语言原样输出，不猜
  } catch {
    return esc(code);
  }
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
    code({ text, lang }: Tokens.Code): string {
      const language = (lang || '').split(/\s+/)[0] || '';
      return [
        '<div class="codeblock">',
        `<div class="codeblock__bar"><span>${esc(language || 'text')}</span>`,
        `<button class="codeblock__copy" type="button" data-copy>${icon('copy', 12)}<span>复制</span></button></div>`,
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
      return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    },
  },
});

export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  collected = [];
  usedIds.clear();
  const html = marked.parse(md, { async: false }) as string;
  return { html, headings: collected.slice() };
}
