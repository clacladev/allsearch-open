import { expect, test } from 'bun:test';
import { getBrandsSourcesData } from '@/app/(private)/project/[projectId]/brands/helpers';
import type { ProjectRow } from '@/libs/database/Projects/types';
import type { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';

const project = {
  id: 'project-id',
  hostname: 'meridianrun.example',
} as ProjectRow;

const source = {
  cleanUrl: 'https://meridianrun.example/guides/daily-training',
} as SourceContent;

test('includes sources whose clean URL includes a scheme', () => {
  const result = getBrandsSourcesData(project, [], [source], []);

  expect(result.sources).toEqual([source]);
  expect(result.brandSourceCounts).toEqual({ 'project-id': 1 });
});
