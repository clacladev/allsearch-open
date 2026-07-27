import { PageHeading } from '@/libs/utils/urlAnalysis';
import { SourceHeadingsList } from '@/app/(private)/project/[projectId]/sources/components/SourceHeadingsList';

const SAMPLE_HEADINGS: PageHeading[] = [
  { tag: 'h1', text: 'Best Flip Flops' },
  { tag: 'h2', text: 'Comparison Table of Best Flip Flops' },
  { tag: 'h2', text: 'The Best Flip Flops' },
  { tag: 'h2', text: 'Flip Flops Features' },
  { tag: 'h3', text: 'Activities' },
  { tag: 'h3', text: 'Materials' },
  { tag: 'h4', text: 'Leather' },
  { tag: 'h4', text: 'Synthetic Leather' },
  { tag: 'h3', text: 'Footbed' },
  { tag: 'h3', text: 'Outsole' },
  { tag: 'h2', text: 'How to Buy Flip Flops' },
  { tag: 'h3', text: 'Online Retailers vs Real Stores' },
  { tag: 'h3', text: 'Used Flip Flops vs New Flip Flops' },
  { tag: 'h3', text: 'Future of the Flop' },
];

export const SourceHeadingsIllustration = () => (
  <SourceHeadingsList headings={SAMPLE_HEADINGS} className="max-h-70 overflow-y-auto shadow-xs" />
);
