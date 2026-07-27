import { marked, type Token, type Tokens } from 'marked';

/**
 * Converts a markdown string into a pdfmake document definition.
 *
 * Pure JS, no Chromium. We walk `marked.lexer()` block tokens and emit
 * pdfmake content nodes for headings, paragraphs, lists, code, blockquote,
 * hr, and inline bold/italic/code/link.
 *
 * Trade-off vs the HTML export: tables render as plain rows joined by ` | `
 * and images render as a `[image: <alt>]` placeholder. Fixing those would
 * require pulling images server-side and a real table layout walker. The
 * marketers we're targeting overwhelmingly export prose articles, so this
 * lossy fallback is the right shape until someone reports an issue with it.
 */

type PdfInline = string | { text: string; bold?: boolean; italics?: boolean; link?: string; color?: string; style?: string };

type PdfContent =
  | string
  | { text: string | PdfInline[]; style?: string; margin?: [number, number, number, number] }
  | { stack: PdfContent[] }
  | { ul: PdfContent[] }
  | { ol: PdfContent[] }
  | { canvas: Array<{ type: 'line'; x1: number; y1: number; x2: number; y2: number; lineWidth: number; lineColor: string }>; margin?: [number, number, number, number] };

export type PdfDocDefinition = {
  info?: { title?: string };
  content: PdfContent[];
  styles: Record<string, Record<string, unknown>>;
  defaultStyle: { font: string; fontSize: number; lineHeight: number };
};

const HEADING_STYLES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

function inlineFromTokens(tokens: Token[] | undefined, fallback: string): PdfInline[] {
  if (!tokens || tokens.length === 0) return [fallback];
  const out: PdfInline[] = [];
  for (const t of tokens) {
    out.push(...renderInline(t));
  }
  return out;
}

function renderInline(token: Token): PdfInline[] {
  switch (token.type) {
    case 'text': {
      const t = token as Tokens.Text;
      if (t.tokens && t.tokens.length > 0) {
        return t.tokens.flatMap(renderInline);
      }
      return [t.text];
    }
    case 'strong': {
      const t = token as Tokens.Strong;
      return inlineFromTokens(t.tokens, t.text).map((node) =>
        typeof node === 'string' ? { text: node, bold: true } : { ...node, bold: true }
      );
    }
    case 'em': {
      const t = token as Tokens.Em;
      return inlineFromTokens(t.tokens, t.text).map((node) =>
        typeof node === 'string' ? { text: node, italics: true } : { ...node, italics: true }
      );
    }
    case 'codespan': {
      const t = token as Tokens.Codespan;
      return [{ text: t.text, style: 'code' }];
    }
    case 'link': {
      const t = token as Tokens.Link;
      const inner = inlineFromTokens(t.tokens, t.text);
      return inner.map((node) => {
        const base = typeof node === 'string' ? { text: node } : node;
        return { ...base, link: t.href, color: '#1d4ed8' };
      });
    }
    case 'br':
      return ['\n'];
    case 'del': {
      const t = token as Tokens.Del;
      return inlineFromTokens(t.tokens, t.text);
    }
    case 'image': {
      const t = token as Tokens.Image;
      return [`[image: ${t.text || t.href}]`];
    }
    case 'html': {
      const t = token as Tokens.HTML;
      return [t.text];
    }
    case 'escape': {
      const t = token as Tokens.Escape;
      return [t.text];
    }
    default: {
      const t = token as { raw?: string; text?: string };
      return [t.text ?? t.raw ?? ''];
    }
  }
}

function renderListItemContent(item: Tokens.ListItem): PdfContent {
  // Tight list items wrap their content in a `text` token whose `tokens` are
  // inline. Loose list items wrap each block (paragraph, sub-list...) directly.
  // We collapse to a single inline text node when possible to avoid extra
  // paragraph spacing on bullet rows.
  const inlineOnly = item.tokens.every((t) => t.type === 'text');
  if (inlineOnly) {
    const inline: PdfInline[] = [];
    for (const t of item.tokens) {
      const text = t as Tokens.Text;
      inline.push(...inlineFromTokens(text.tokens, text.text));
    }
    return { text: inline };
  }
  const blocks: PdfContent[] = [];
  for (const child of item.tokens) {
    blocks.push(...renderBlock(child));
  }
  if (blocks.length === 1) return blocks[0]!;
  if (blocks.length === 0) return item.text;
  return { stack: blocks };
}

function renderBlock(token: Token): PdfContent[] {
  switch (token.type) {
    case 'heading': {
      const t = token as Tokens.Heading;
      const depth = Math.min(Math.max(t.depth, 1), 6);
      return [{ text: inlineFromTokens(t.tokens, t.text), style: HEADING_STYLES[depth - 1] }];
    }
    case 'paragraph': {
      const t = token as Tokens.Paragraph;
      return [{ text: inlineFromTokens(t.tokens, t.text), style: 'paragraph' }];
    }
    case 'list': {
      const t = token as Tokens.List;
      const items = t.items.map(renderListItemContent);
      return [t.ordered ? { ol: items } : { ul: items }];
    }
    case 'code': {
      const t = token as Tokens.Code;
      return [{ text: t.text, style: 'codeBlock' }];
    }
    case 'blockquote': {
      const t = token as Tokens.Blockquote;
      const inner: PdfContent[] = [];
      for (const child of t.tokens) {
        inner.push(...renderBlock(child));
      }
      // Flatten blockquote children into a single styled block. pdfmake doesn't
      // have first-class blockquote markup; we lean on left-margin + italics.
      const flat = inner
        .map((c) => {
          if (typeof c === 'string') return c;
          if ('text' in c) {
            const text = c.text;
            if (typeof text === 'string') return text;
            return text.map((n) => (typeof n === 'string' ? n : n.text)).join('');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
      return [{ text: flat, style: 'blockquote' }];
    }
    case 'hr':
      return [
        {
          canvas: [
            { type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: '#cbd5e1' },
          ],
          margin: [0, 6, 0, 12],
        },
      ];
    case 'space':
      return [];
    case 'html': {
      const t = token as Tokens.HTML;
      const trimmed = t.text.trim();
      if (!trimmed) return [];
      return [{ text: trimmed, style: 'paragraph' }];
    }
    case 'table': {
      const t = token as Tokens.Table;
      const rows: string[] = [];
      const headerCells = t.header.map((c) =>
        c.tokens
          ? inlineFromTokens(c.tokens, c.text)
              .map((n) => (typeof n === 'string' ? n : n.text))
              .join('')
          : c.text
      );
      rows.push(headerCells.join(' | '));
      for (const row of t.rows) {
        rows.push(
          row
            .map((c) =>
              c.tokens
                ? inlineFromTokens(c.tokens, c.text)
                    .map((n) => (typeof n === 'string' ? n : n.text))
                    .join('')
                : c.text
            )
            .join(' | ')
        );
      }
      return [{ text: rows.join('\n'), style: 'paragraph' }];
    }
    default: {
      const t = token as { text?: string; raw?: string };
      const text = (t.text ?? t.raw ?? '').trim();
      if (!text) return [];
      return [{ text, style: 'paragraph' }];
    }
  }
}

export function markdownToPdfmakeDoc(markdown: string, title: string): PdfDocDefinition {
  const tokens = marked.lexer(markdown);
  const content: PdfContent[] = [];
  for (const token of tokens) {
    content.push(...renderBlock(token));
  }
  return {
    info: { title },
    content,
    defaultStyle: { font: 'Helvetica', fontSize: 11, lineHeight: 1.4 },
    styles: {
      h1: { fontSize: 24, bold: true, margin: [0, 12, 0, 8] },
      h2: { fontSize: 19, bold: true, margin: [0, 10, 0, 6] },
      h3: { fontSize: 16, bold: true, margin: [0, 8, 0, 4] },
      h4: { fontSize: 14, bold: true, margin: [0, 6, 0, 4] },
      h5: { fontSize: 12, bold: true, margin: [0, 6, 0, 4] },
      h6: { fontSize: 11, bold: true, margin: [0, 6, 0, 4] },
      paragraph: { margin: [0, 0, 0, 8] },
      code: { font: 'Courier', fontSize: 10, color: '#9333ea' },
      codeBlock: {
        font: 'Courier',
        fontSize: 10,
        color: '#0f172a',
        background: '#f1f5f9',
        margin: [0, 4, 0, 10],
      },
      blockquote: { italics: true, color: '#475569', margin: [12, 4, 0, 10] },
    },
  };
}
