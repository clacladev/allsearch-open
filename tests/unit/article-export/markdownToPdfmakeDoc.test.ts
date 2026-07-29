import { describe, expect, it } from 'bun:test';
import { markdownToPdfmakeDoc } from '@/libs/article-export/markdownToPdfmakeDoc';

function findStyles(content: unknown[], style: string): unknown[] {
  const out: unknown[] = [];
  const visit = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (n.style === style) out.push(n);
    if (Array.isArray(n.text)) (n.text as unknown[]).forEach(visit);
    if (Array.isArray(n.stack)) (n.stack as unknown[]).forEach(visit);
    if (Array.isArray(n.ul)) (n.ul as unknown[]).forEach(visit);
    if (Array.isArray(n.ol)) (n.ol as unknown[]).forEach(visit);
  };
  content.forEach(visit);
  return out;
}

function flattenText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (typeof n.text === 'string') return n.text;
    if (Array.isArray(n.text)) return n.text.map(flattenText).join('');
    if (Array.isArray(n.stack)) return (n.stack as unknown[]).map(flattenText).join('\n');
  }
  return '';
}

describe('markdownToPdfmakeDoc', () => {
  it('returns an empty content array for empty markdown', () => {
    const doc = markdownToPdfmakeDoc('', 'Empty');
    expect(doc.content).toEqual([]);
    expect(doc.info?.title).toBe('Empty');
  });

  it('emits heading nodes with h1..h6 styles', () => {
    const doc = markdownToPdfmakeDoc(
      '# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six\n',
      'T'
    );
    expect(findStyles(doc.content, 'h1')).toHaveLength(1);
    expect(findStyles(doc.content, 'h2')).toHaveLength(1);
    expect(findStyles(doc.content, 'h3')).toHaveLength(1);
    expect(findStyles(doc.content, 'h4')).toHaveLength(1);
    expect(findStyles(doc.content, 'h5')).toHaveLength(1);
    expect(findStyles(doc.content, 'h6')).toHaveLength(1);
  });

  it('renders unordered and ordered lists', () => {
    const doc = markdownToPdfmakeDoc('- a\n- b\n\n1. one\n2. two\n', 'T');
    const ul = doc.content.find((c) => typeof c === 'object' && 'ul' in c) as { ul: unknown[] };
    const ol = doc.content.find((c) => typeof c === 'object' && 'ol' in c) as { ol: unknown[] };
    expect(ul.ul).toHaveLength(2);
    expect(ol.ol).toHaveLength(2);
    expect(flattenText(ul.ul[0])).toBe('a');
    expect(flattenText(ol.ol[1])).toBe('two');
  });

  it('preserves bold, italic, and inline code', () => {
    const doc = markdownToPdfmakeDoc('A **bold** and *italic* and `code` line.\n', 'T');
    const para = doc.content[0] as { text: Array<Record<string, unknown>> };
    const text = para.text;
    expect(text.some((t) => t.bold === true && t.text === 'bold')).toBe(true);
    expect(text.some((t) => t.italics === true && t.text === 'italic')).toBe(true);
    expect(text.some((t) => t.style === 'code' && t.text === 'code')).toBe(true);
  });

  it('renders links with href and color', () => {
    const doc = markdownToPdfmakeDoc('[click](https://example.com)\n', 'T');
    const para = doc.content[0] as { text: Array<Record<string, unknown>> };
    const link = para.text.find((t) => t.link);
    expect(link).toBeDefined();
    expect(link?.link).toBe('https://example.com');
    expect(link?.text).toBe('click');
  });

  it('renders fenced code blocks with codeBlock style', () => {
    const doc = markdownToPdfmakeDoc('```\nlet x = 1;\n```\n', 'T');
    const code = findStyles(doc.content, 'codeBlock');
    expect(code).toHaveLength(1);
    expect((code[0] as { text: string }).text).toContain('let x = 1;');
  });

  it('renders horizontal rules as a canvas line', () => {
    const doc = markdownToPdfmakeDoc('above\n\n---\n\nbelow\n', 'T');
    const hr = doc.content.find((c) => typeof c === 'object' && 'canvas' in c);
    expect(hr).toBeDefined();
  });

  it('renders blockquotes with the blockquote style', () => {
    const doc = markdownToPdfmakeDoc('> quoted\n', 'T');
    const bq = findStyles(doc.content, 'blockquote');
    expect(bq).toHaveLength(1);
    expect(flattenText(bq[0])).toContain('quoted');
  });
});
