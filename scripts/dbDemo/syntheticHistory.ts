import { ChatbotId } from '../../libs/database/shared/ChatbotId';
import type {
  CollectionRunStatus,
  DemoCollectionRunItemRow,
  DemoCollectionRunRow,
  DemoPromptResponseRow,
  DemoProjectRow,
  DemoSourceRow,
} from './types';

/**
 * Builds the synthetic weekly collection-run history that turns a freshly-seeded
 * checkout into a dashboard exercising this branch's cadence/trend/staleness
 * surfaces — the bit the live DB alone can't supply (it currently has zero
 * `collection_runs`). See `.context/attachments/.../session-transcript-…md` Q8.
 *
 * Six weekly slots going back from `anchor` (most recent Monday 09:00 UTC ≤ now):
 *
 * | week index | status     |
 * |-----------|------------|
 * |   0       | completed   | (most recent)
 * |   1       | completed   |
 * |   2       | — gap —     | (deliberate skip, exercises the stale banner when now pushes past it)
 * |   3       | failed      | (partial — items_completed < items_total, exercises the retry offer)
 * |   4       | completed   |
 * |   5       | completed   | (oldest)
 *
 * Each run seeds one `collection_run_items` row per (prompt × chatbot). Each
 * completed run additionally seeds one `prompt_responses` row per chatbot for a
 * rotating prompt (so chatbot-leading-by-week has something to render in the
 * Visibility chart), each with two `sources` (one cited, one used-but-not-cited).
 * The failed run has items but no responses — items attempted, response never
 * written — matching how the live Collection Run engine leaves the DB on abort.
 *
 * The result is ~25 KB of fixture content, enough to populate every cadence /
 * trend surface without ballooning the committed JSON.
 */

const CHATBOTS: ChatbotId[] = [ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview, ChatbotId.Perplexity];

// `null` = deliberate gap for that week. The remaining statuses mix completed (days
// since finished for the countdown/stale surfaces) with exactly one failed run (for
// the retry surface). Length controls how many weeks of history the chart sees.
const WEEK_STATUS: (CollectionRunStatus | null)[] = [
  'completed',
  'completed',
  null, // gap
  'failed',
  'completed',
  'completed',
];

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

export type LivePromptLite = {
  id: string;
  name: string;
};

export type LiveCompetitorLite = {
  id: string;
};

export type SyntheticHistoryInput = {
  project: Pick<DemoProjectRow, 'id' | 'name'>;
  prompts: LivePromptLite[];
  competitors: LiveCompetitorLite[];
  anchor: Date;
};

export type SyntheticHistory = {
  collection_runs: DemoCollectionRunRow[];
  collection_run_items: DemoCollectionRunItemRow[];
  prompt_responses: DemoPromptResponseRow[];
  sources: DemoSourceRow[];
};

export function buildSyntheticHistory(input: SyntheticHistoryInput): SyntheticHistory {
  const runs: DemoCollectionRunRow[] = [];
  const items: DemoCollectionRunItemRow[] = [];
  const responses: DemoPromptResponseRow[] = [];
  const sources: DemoSourceRow[] = [];

  // anchor is "week 0's start" — the most recent Monday 09:00 UTC ≤ now.
  const week0StartUTC = floorToMonday0900Utc(input.anchor);

  // `prompts.length * CHATBOTS.length` items per run when every prompt is collected.
  // For a failed run we mark the second half of prompts' items as failed.
  const itemsPerRun = input.prompts.length * CHATBOTS.length;

  WEEK_STATUS.forEach((status, weekIdx) => {
    if (status === null) return;
    const runId = crypto.randomUUID();
    const startedAt = new Date(week0StartUTC.getTime() - weekIdx * MS_PER_WEEK);
    const finishedAt =
      status === 'running'
        ? null
        : new Date(startedAt.getTime() + (status === 'failed' ? 4 : 5) * MS_PER_MINUTE);

    // Determine how many items completed vs failed for this run. A completed run
    // counts everything; a failed run counts only the first half (plus the rest
    // as failed) — mimics a partial run aborted mid-fan-out.
    let itemsCompleted = itemsPerRun;
    let itemsFailed = 0;
    if (status === 'failed') {
      const halfPrompts = Math.max(1, Math.floor(input.prompts.length / 2));
      itemsCompleted = halfPrompts * CHATBOTS.length;
      itemsFailed = itemsPerRun - itemsCompleted;
    }

    runs.push({
      id: runId,
      status,
      scope: 'all',
      started_at: startedAt.toISOString(),
      finished_at: finishedAt?.toISOString() ?? null,
      items_total: itemsPerRun,
      items_completed: itemsCompleted,
      items_failed: itemsFailed,
      error: status === 'failed' ? 'Aborted before completion — provider call timed out.' : null,
      created_at: startedAt.toISOString(),
    });

    // Generate one `collection_run_items` row per (prompt × chatbot). Item status
    // reflects the run's overall status; for a failed run, items for prompts past
    // `halfPrompts` are marked failed.
    const halfPrompts = status === 'failed' ? Math.max(1, Math.floor(input.prompts.length / 2)) : 0;
    for (let p = 0; p < input.prompts.length; p++) {
      for (let c = 0; c < CHATBOTS.length; c++) {
        const itemFailed = status === 'failed' && p >= halfPrompts;
        const itemStatus: CollectionRunStatus =
          status === 'completed' ? 'completed' : itemFailed ? 'failed' : 'completed';
        items.push({
          id: crypto.randomUUID(),
          run_id: runId,
          project_id: input.project.id,
          prompt_id: input.prompts[p].id,
          chatbot_id: CHATBOTS[c],
          status: itemStatus,
          attempts: 1,
          error: itemFailed ? 'Provider call timed out.' : null,
          started_at: startedAt.toISOString(),
          finished_at: new Date(startedAt.getTime() + 4 * MS_PER_MINUTE).toISOString(),
          created_at: startedAt.toISOString(),
        });
      }
    }

    // For each COMPLETED run, seed one prompt_response per chatbot for a rotating
    // prompt — gives the Visibility trend chart per-week across its six data
    // points without ballooning the fixture (3 responses × 2 sources/run).
    if (status !== 'completed') return;

    const respondingPrompt = input.prompts[weekIdx % input.prompts.length];
    for (const chatbot of CHATBOTS) {
      const responseId = crypto.randomUUID();
      const responseCreatedAt = new Date(startedAt.getTime() + MS_PER_MINUTE).toISOString();
      responses.push({
        id: responseId,
        created_at: responseCreatedAt,
        text: `Demo ${chatbot} response for "${respondingPrompt.name}" (week of ${startedAt
          .toISOString()
          .slice(0, 10)}).`,
        chatbot_id: chatbot,
        prompt_id: respondingPrompt.id,
        project_id: input.project.id,
        model_id: 'demo-model',
        brand_ids_ranking: [],
        // Spread sentiment ratings across half the competitors per response so the
        // Sentiment trend chart shows variation without committing to every
        // competitor every week (real data wouldn't — the LLM only ever mentions
        // some brands each run).
        sentiment: buildDemoSentiment(input.competitors, weekIdx),
        run_id: runId,
      });

      // Two sources per response: position 0 cited, position 1 used-but-not-cited.
      sources.push(makeDemoSource({ responseId, position: 0, isCited: true, startedAt, project: input.project, prompt: respondingPrompt }));
      sources.push(makeDemoSource({ responseId, position: 1, isCited: false, startedAt, project: input.project, prompt: respondingPrompt }));
    }
  });

  return { collection_runs: runs, collection_run_items: items, prompt_responses: responses, sources };
}

function buildDemoSentiment(
  competitors: { id: string }[],
  weekIdx: number
): Record<string, -2 | -1 | 0 | 1 | 2> {
  // Rotate the set of competitors with sentiment each week (half of them, offset
  // by week index) so the Sentiment chart has different shapes per week rather
  // than a single flat line. Values are spread across {-1, 0, 1} — enough variety
  // for the chart without making any brand unrecoverably bad-looking.
  const ratings: (-1 | 0 | 1)[] = [-1, 0, 1];
  const out: Record<string, -1 | 0 | 1> = {};
  for (let i = 0; i < competitors.length; i++) {
    if ((i + weekIdx) % 2 === 0) {
      out[competitors[i].id] = ratings[(weekIdx + i) % ratings.length];
    }
  }
  return out;
}

function makeDemoSource(args: {
  responseId: string;
  position: number;
  isCited: boolean;
  startedAt: Date;
  project: Pick<DemoProjectRow, 'id' | 'name'>;
  prompt: LivePromptLite;
}): DemoSourceRow {
  const demoId = crypto.randomUUID();
  const hostSuffix = args.isCited ? 'runningworld.example' : 'trailforum.example';
  const cleanUrl = `https://${hostSuffix}/posts/${args.position + 1}`;
  return {
    id: demoId,
    created_at: new Date(args.startedAt.getTime() + MS_PER_MINUTE).toISOString(),
    project_id: args.project.id,
    prompt_id: args.prompt.id,
    prompt_response_id: args.responseId,
    is_cited: args.isCited,
    position: args.position,
    clean_url: cleanUrl,
    url: cleanUrl,
    hostname: hostSuffix,
    raw_url: null,
    title: `Demo ${args.isCited ? 'cited' : 'used'} source #${args.position + 1} for "${args.project.name}"`,
    description: 'Placeholder description for the committed demo fixture — not real content.',
    headings: null,
    brand_ids_ranking: [],
  };
}

/** Floors `now` to the most recent Monday 09:00 UTC ≤ `now`. Monday is the 7-day
 * cadence the rest of the app assumes — anchoring weekly epochs here keeps the
 * synthetic runs aligned with how a real user would actually trigger them. The
 * `09:00` slot is arbitrary but realistic (matches a working-hours standup
 * cadence). */
export function floorToMonday0900Utc(now: Date): Date {
  const candidate = new Date(now);
  candidate.setUTCHours(9, 0, 0, 0);
  // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat
  const day = candidate.getUTCDay();
  const daysSinceMonday = (day + 6) % 7; // Mon→0, Tue→1, ..., Sun→6
  candidate.setUTCDate(candidate.getUTCDate() - daysSinceMonday);
  if (candidate.getTime() > now.getTime()) {
    // Edge case: `now` is before 09:00 UTC on the same Monday — back up one week
    // so the anchor is strictly ≤ now.
    candidate.setUTCDate(candidate.getUTCDate() - 7);
  }
  return candidate;
}