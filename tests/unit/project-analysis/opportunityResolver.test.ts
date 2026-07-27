import { describe, expect, it } from 'bun:test';
import {
  filterEligibleSources,
  findOpportunity,
  normalizeOpportunityForGeneration,
} from '@/libs/utils/project-analysis/opportunityResolver';
import type {
  Opportunity,
  ProjectSourceNeedsImprovementOpportunity,
  ProjectSourceNotCitedOpportunity,
  ProjectSourceNotFoundOpportunity,
  SourceItemCounter,
} from '@/libs/utils/project-analysis/types';
import type { SourceItem } from '@/libs/database/Sources/types';

function makeSource(overrides: Partial<SourceItem> = {}): SourceItem {
  return {
    isCited: true,
    url: 'https://competitor.com/page',
    cleanUrl: 'competitor.com/page',
    hostname: 'competitor.com',
    ...overrides,
  };
}

function makeSourceCounter(overrides: Partial<SourceItemCounter> = {}): SourceItemCounter {
  return {
    ...makeSource(),
    citationCount: 1,
    ...overrides,
  };
}

function makeProjectSource(
  overrides: Partial<Omit<SourceItem, 'isCited' | 'brandIdsRanking'>> = {}
): Omit<SourceItem, 'isCited' | 'brandIdsRanking'> {
  return {
    url: 'https://me.com/post',
    cleanUrl: 'me.com/post',
    hostname: 'me.com',
    title: 'Old post',
    headings: [],
    ...overrides,
  };
}

function makeNotFoundOpp(
  overrides: Partial<ProjectSourceNotFoundOpportunity> = {}
): ProjectSourceNotFoundOpportunity {
  return {
    type: 'ProjectSourceNotFoundOpportunity',
    id: 'opp-nf-1',
    promptId: 'prompt-1',
    inspirationSources: [makeSourceCounter()],
    promptResponseIds: ['resp-1'],
    priorityScore: 1,
    ...overrides,
  };
}

function makeImproveOpp(
  overrides: Partial<ProjectSourceNeedsImprovementOpportunity> = {}
): ProjectSourceNeedsImprovementOpportunity {
  return {
    type: 'ProjectSourceNeedsImprovementOpportunity',
    id: 'opp-imp-1',
    priorityScore: 1,
    projectSource: makeProjectSource(),
    promptsBasedInspiration: {
      'prompt-1': {
        sources: [makeSource()],
        promptResponseIds: ['resp-2'],
      },
    },
    ...overrides,
  };
}

function makeNotCitedOpp(
  overrides: Partial<ProjectSourceNotCitedOpportunity> = {}
): ProjectSourceNotCitedOpportunity {
  return {
    type: 'ProjectSourceNotCitedOpportunity',
    id: 'opp-nc-1',
    priorityScore: 1,
    projectSource: makeProjectSource({ cleanUrl: 'me.com/another', title: 'Another' }),
    promptsBasedInspiration: {
      'prompt-1': {
        sources: [makeSource()],
        promptResponseIds: ['resp-3'],
      },
    },
    ...overrides,
  };
}

describe('findOpportunity', () => {
  it('matches NotFound by promptId only', () => {
    const opp = makeNotFoundOpp();
    const found = findOpportunity(
      [opp],
      'prompt-1',
      'ProjectSourceNotFoundOpportunity',
      null
    );
    expect(found).toBe(opp);
  });

  it('does not match NotFound when promptId differs', () => {
    const opp = makeNotFoundOpp({ promptId: 'prompt-2' });
    const found = findOpportunity(
      [opp],
      'prompt-1',
      'ProjectSourceNotFoundOpportunity',
      null
    );
    expect(found).toBeUndefined();
  });

  it('matches Improve by prompt + projectSource cleanUrl', () => {
    const opp = makeImproveOpp();
    const found = findOpportunity(
      [opp],
      'prompt-1',
      'ProjectSourceNeedsImprovementOpportunity',
      'me.com/post'
    );
    expect(found).toBe(opp);
  });

  it('does not match Improve when targetSourceCleanUrl differs', () => {
    const opp = makeImproveOpp();
    const found = findOpportunity(
      [opp],
      'prompt-1',
      'ProjectSourceNeedsImprovementOpportunity',
      'me.com/different'
    );
    expect(found).toBeUndefined();
  });

  it('matches NotCited by prompt + projectSource cleanUrl', () => {
    const opp = makeNotCitedOpp();
    const found = findOpportunity(
      [opp],
      'prompt-1',
      'ProjectSourceNotCitedOpportunity',
      'me.com/another'
    );
    expect(found).toBe(opp);
  });

  it('does not cross-match types', () => {
    const opp = makeImproveOpp();
    const found = findOpportunity(
      [opp],
      'prompt-1',
      'ProjectSourceNotCitedOpportunity',
      'me.com/post'
    );
    expect(found).toBeUndefined();
  });

  it('returns undefined when no opportunity matches', () => {
    const found = findOpportunity(
      [],
      'prompt-1',
      'ProjectSourceNotFoundOpportunity',
      null
    );
    expect(found).toBeUndefined();
  });
});

describe('normalizeOpportunityForGeneration', () => {
  it('returns inspirationSources for NotFound (no ourSource)', () => {
    const opp = makeNotFoundOpp();
    const result = normalizeOpportunityForGeneration(opp, 'prompt-1');
    expect(result?.ourSource).toBeUndefined();
    expect(result?.sourcesToInspireFrom).toHaveLength(1);
  });

  it('returns ourSource + promptsBasedInspiration sources for Improve', () => {
    const opp = makeImproveOpp();
    const result = normalizeOpportunityForGeneration(opp, 'prompt-1');
    expect(result?.ourSource).toBeDefined();
    expect(result?.ourSource?.cleanUrl).toBe('me.com/post');
    expect(result?.sourcesToInspireFrom).toHaveLength(1);
  });

  it('returns ourSource + sources for NotCited', () => {
    const opp = makeNotCitedOpp();
    const result = normalizeOpportunityForGeneration(opp, 'prompt-1');
    expect(result?.ourSource?.cleanUrl).toBe('me.com/another');
    expect(result?.sourcesToInspireFrom).toHaveLength(1);
  });

  it('returns null for unsupported opportunity types', () => {
    const opp = { type: 'UnsupportedType' } as unknown as Opportunity;
    const result = normalizeOpportunityForGeneration(opp, 'prompt-1');
    expect(result).toBeNull();
  });

  it('falls back to empty sources when promptsBasedInspiration is missing the prompt', () => {
    const opp = makeImproveOpp({ promptsBasedInspiration: {} });
    const result = normalizeOpportunityForGeneration(opp, 'prompt-1');
    expect(result?.sourcesToInspireFrom).toHaveLength(0);
  });
});

describe('filterEligibleSources', () => {
  it('keeps sources with non-empty headings', () => {
    const eligible = makeSource({
      headings: [{ tag: 'h1', text: 'Real heading' }],
    });
    const ineligible = makeSource({ headings: [] });
    expect(filterEligibleSources([eligible, ineligible])).toHaveLength(1);
  });
});
