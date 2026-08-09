import { describe, expect, it } from 'bun:test';
import { getCollectionRunCoverageText } from '@/app/(private)/project/[projectId]/overview/components/CollectionRunCoverageBanner';

describe('getCollectionRunCoverageText', () => {
  it('reads as collecting, not "No data", for zero runs', () => {
    const text = getCollectionRunCoverageText(0);
    expect(text).not.toContain('No data');
  });

  it('reads as collecting, not "No data", and mentions the next run for one run', () => {
    const text = getCollectionRunCoverageText(1);
    expect(text).not.toContain('No data');
    expect(text).toContain('next run');
  });

  it('states the count and "Collection Runs" for two runs', () => {
    const text = getCollectionRunCoverageText(2);
    expect(text).toContain('2');
    expect(text).toContain('Collection Runs');
  });

  it('states the count and "Collection Runs" for five runs', () => {
    const text = getCollectionRunCoverageText(5);
    expect(text).toContain('5');
    expect(text).toContain('Collection Runs');
  });
});
