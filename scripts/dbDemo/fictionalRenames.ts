/**
 * Fictional name pools used by `buildDemoFixture` when redacting the live DB into
 * the committed demo fixture. The point is to keep the *shape* of the live data
 * (one project, N competitors, M topics, K prompts) but swap every brand-like
 * identifier for an obviously fictional placeholder, so nothing resembling real
 * client work sits in git history — see `.context/attachments/.../session-
 * transcript-…md` Q12.
 *
 * `.example` is the IANA-reserved TLD for documentation/examples (RFC 6761), so
 * any URL built on it is non-resolvable and obviously fake even at a glance. No
 * hypothetical real-world domain collides with `cinderfoot.example` &c.
 */

export const DEMO_ORGANIZATION = {
  name: 'Atlas Studio',
  url: 'atlasstudio.example',
  type: 'agency' as const,
};

export const DEMO_PROJECT = {
  name: 'Meridian Run Co.',
  url: 'https://meridianrun.example',
  hostname: 'meridianrun.example',
};

/** Ordered pool — the n-th competitor becomes the n-th entry here. Index-safe:
 * once the pool runs out the caller falls back to `demo-competitor-N.example`,
 * so a live DB with more competitors than pool entries still produces a valid
 * (if more thinly sketched) fixture rather than throwing. */
export const DEMO_COMPETITORS: { name: string; hostname: string }[] = [
  { name: 'Cinderfoot', hostname: 'cinderfoot.example' },
  { name: 'Summit Stride', hostname: 'summitstride.example' },
  { name: 'Pinecrest Athletics', hostname: 'pinecrest.example' },
  { name: 'Tundra Tracks', hostname: 'tundratracks.example' },
  { name: 'Wildwood Footwear', hostname: 'wildwoodfootwear.example' },
  { name: 'Brightpath Sports', hostname: 'brightpath.example' },
  { name: 'Kestrel Footwear', hostname: 'kestrel.example' },
  { name: 'Granite Run', hostname: 'graniterun.example' },
  { name: 'Driftwood Athletics', hostname: 'driftwood.example' },
  { name: 'Highpine Co.', hostname: 'highpine.example' },
];

/** Running-themed fictional *topic* names (Q12 asks for fictional topic-name
 * replacements; these keep the demo coherent — Meridian Run Co. sells running
 * shoes — while avoiding every live topic prompt's exact phrasing). Pool-by-
 * index + fallback keeps the demo stable regardless of how many topics the live
 * DB currently has. */
export const DEMO_TOPICS: string[] = [
  'Daily Trainers',
  'Race Day Footwear',
  'Lightweight Trainers',
  'Cushioned Trainers',
  'Technical Trail Shoes',
  'Road Race Day Shoes',
];

/** Running-themed fictional *prompt* names. These are the search queries the
 * demo dashboard assumes are sent to the chatbots — they are deliberately
 * shorter than the live prompts and use different phrasings so no live-DB text
 * leaks verbatim into the committed fixture. */
export const DEMO_PROMPTS: string[] = [
  'Best everyday running shoes for daily training',
  'Top rated race-day shoes for marathons',
  'Best lightweight shoes for long runs',
  'Most comfortable daily trainers for high mileage',
  'Best trail shoes for technical terrain and steep descents',
  'Grippy trail shoes for slick and uneven paths',
  'Best value road running shoes for beginners',
  'Top recommended running shoes this year',
];

export function demoCompetitor(index: number): { name: string; hostname: string } {
  return (
    DEMO_COMPETITORS[index] ?? {
      name: `Demo Competitor ${index + 1}`,
      hostname: `demo-competitor-${index + 1}.example`,
    }
  );
}

export function demoTopicName(index: number): string {
  return DEMO_TOPICS[index] ?? `Demo Topic ${index + 1}`;
}

export function demoPromptName(index: number): string {
  return DEMO_PROMPTS[index] ?? `Demo Prompt ${index + 1}`;
}

/** Placeholder/invalid provider keys. `status: 'unverified'` keeps the dashboard's
 * "needs key" UX honest — a tester wanting live collection overwrites the key via
 * `/keys`. The keys are obviously fake (`demo-invalid-…-replace-me`). */
export const DEMO_PROVIDER_KEYS = {
  openai: {
    key: 'demo-invalid-openai-key-replace-me',
    status: 'unverified' as const,
    validatedAt: '2026-01-01T00:00:00.000Z',
  },
  google: {
    key: 'demo-invalid-google-key-replace-me',
    status: 'unverified' as const,
    validatedAt: '2026-01-01T00:00:00.000Z',
  },
  perplexity: {
    key: 'demo-invalid-perplexity-key-replace-me',
    status: 'unverified' as const,
    validatedAt: '2026-01-01T00:00:00.000Z',
  },
};