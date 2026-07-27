import { describe, expect, it } from 'bun:test';
import { outlineToMarkdown } from '@/libs/utils/articleOutlineMarkdown';
import { ARTICLE_OUTLINE_SCHEMA_VERSION } from '@/libs/database/PromptArticles/types';

describe('outlineToMarkdown', () => {
  it('returns empty string for empty headings', () => {
    expect(
      outlineToMarkdown({ version: ARTICLE_OUTLINE_SCHEMA_VERSION, headings: [] })
    ).toBe('');
  });

  it('renders h1/h2/h3 with correct hash-prefix depth', () => {
    const md = outlineToMarkdown({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { tag: 'h1', text: 'Article Title', keyPoint: 'Introduce the reader to the topic.' },
        { tag: 'h2', text: 'Section One', keyPoint: 'Cover the basics in detail.' },
        { tag: 'h3', text: 'Sub-section', keyPoint: 'Go deeper on a specific aspect.' },
      ],
    });
    expect(md).toContain('# Article Title');
    expect(md).toContain('## Section One');
    expect(md).toContain('### Sub-section');
  });

  it('renders keyPoint as a paragraph below each heading', () => {
    const md = outlineToMarkdown({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { tag: 'h2', text: 'Heading', keyPoint: 'Explain X clearly.' },
      ],
    });
    expect(md).toBe('## Heading\n\nExplain X clearly.');
  });

  it('preserves special characters in heading text', () => {
    const md = outlineToMarkdown({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { tag: 'h1', text: 'C++ vs. Rust: A practical guide', keyPoint: 'Compare head-to-head.' },
      ],
    });
    expect(md).toContain('# C++ vs. Rust: A practical guide');
  });

  it('joins multiple headings with a blank line between', () => {
    const md = outlineToMarkdown({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { tag: 'h2', text: 'First', keyPoint: 'First point.' },
        { tag: 'h2', text: 'Second', keyPoint: 'Second point.' },
      ],
    });
    // Two sections separated by a blank line.
    expect(md.split('\n\n').length).toBeGreaterThanOrEqual(3);
    expect(md).toContain('## First');
    expect(md).toContain('## Second');
  });
});
