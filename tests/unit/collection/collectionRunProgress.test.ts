import { describe, expect, it } from 'bun:test';

import {
  buildCollectionRunProgress,
  formatCollectionRunProgressSummary,
  getCollectionRunProgressCountLabel,
} from '@/libs/collection/progress';
import type { CollectionRunItemProgressRow } from '@/libs/database/CollectionRunItems/queries';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { CollectionRunStatus } from '@/libs/database/CollectionRuns/types';
import { CollectionRunItemStatus } from '@/libs/database/CollectionRunItems/types';

function makeRow(
  overrides: Partial<CollectionRunItemProgressRow> & { status: CollectionRunItemStatus }
): CollectionRunItemProgressRow {
  return {
    projectId: 'project-1',
    projectName: 'Project 1',
    promptId: 'prompt-1',
    promptName: 'Prompt 1',
    chatbotId: ChatbotId.ChatGPT,
    ...overrides,
  };
}

describe('buildCollectionRunProgress', () => {
  it('groups rows by Project then Prompt, preserving input order, with per-group counts', () => {
    const rows: CollectionRunItemProgressRow[] = [
      makeRow({
        projectId: 'p2',
        projectName: 'Project Two',
        promptId: 'p2-prompt1',
        promptName: 'P2 Prompt 1',
        chatbotId: ChatbotId.ChatGPT,
        status: 'completed',
      }),
      makeRow({
        projectId: 'p1',
        projectName: 'Project One',
        promptId: 'p1-prompt1',
        promptName: 'P1 Prompt 1',
        chatbotId: ChatbotId.ChatGPT,
        status: 'completed',
      }),
      makeRow({
        projectId: 'p1',
        projectName: 'Project One',
        promptId: 'p1-prompt2',
        promptName: 'P1 Prompt 2',
        chatbotId: ChatbotId.Perplexity,
        status: 'failed',
      }),
    ];

    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'running' }, rows);

    // First-seen order is preserved: Project Two appeared first in the rows.
    expect(progress.projects.map((project) => project.projectId)).toEqual(['p2', 'p1']);

    const projectOne = progress.projects.find((project) => project.projectId === 'p1')!;
    expect(projectOne.promptsTotal).toBe(2);
    expect(projectOne.promptsCompleted).toBe(1);
    expect(projectOne.promptsFailed).toBe(1);
    expect(projectOne.promptsFinished).toBe(2);
    expect(projectOne.prompts.map((prompt) => prompt.promptId)).toEqual([
      'p1-prompt1',
      'p1-prompt2',
    ]);

    const projectTwo = progress.projects.find((project) => project.projectId === 'p2')!;
    expect(projectTwo.promptsTotal).toBe(1);
    expect(projectTwo.promptsCompleted).toBe(1);
  });

  it('derives prompt status by precedence: running > pending > completed > failed > cancelled', () => {
    const cases: { statuses: CollectionRunItemStatus[]; expected: CollectionRunItemStatus }[] = [
      { statuses: ['running', 'pending'], expected: 'running' },
      { statuses: ['pending', 'completed'], expected: 'pending' },
      { statuses: ['completed', 'failed'], expected: 'completed' },
      { statuses: ['failed', 'failed'], expected: 'failed' },
      { statuses: ['cancelled', 'cancelled'], expected: 'cancelled' },
    ];

    for (const { statuses, expected } of cases) {
      const rows = statuses.map((status, index) =>
        makeRow({ chatbotId: [ChatbotId.ChatGPT, ChatbotId.Perplexity][index], status })
      );
      const progress = buildCollectionRunProgress({ id: 'run-1', status: 'running' }, rows);
      expect(progress.projects[0].prompts[0].status).toBe(expected);
    }
  });

  it('computes total/completed/failed/finished counts, and the count label', () => {
    const rows: CollectionRunItemProgressRow[] = [];
    for (let i = 0; i < 22; i++) {
      rows.push(makeRow({ promptId: `prompt-completed-${i}`, status: 'completed' }));
    }
    for (let i = 0; i < 3; i++) {
      rows.push(makeRow({ promptId: `prompt-failed-${i}`, status: 'failed' }));
    }

    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'running' }, rows);

    expect(progress.promptsTotal).toBe(25);
    expect(progress.promptsCompleted).toBe(22);
    expect(progress.promptsFailed).toBe(3);
    expect(progress.promptsFinished).toBe(25);
    expect(getCollectionRunProgressCountLabel(progress)).toBe('25 of 25');
    expect(getCollectionRunProgressCountLabel({ promptsFinished: 12, promptsTotal: 25 })).toBe(
      '12 of 25'
    );
  });

  it('marks isTerminal for each of the five run statuses', () => {
    const statuses: { status: CollectionRunStatus; isTerminal: boolean }[] = [
      { status: 'pending', isTerminal: false },
      { status: 'running', isTerminal: false },
      { status: 'completed', isTerminal: true },
      { status: 'failed', isTerminal: true },
      { status: 'cancelled', isTerminal: true },
    ];

    for (const { status, isTerminal } of statuses) {
      const progress = buildCollectionRunProgress({ id: 'run-1', status }, []);
      expect(progress.isTerminal).toBe(isTerminal);
    }
  });

  it('exposes only the allowed keys at every level, with no cost/estimate/answer content (ADR 0007)', () => {
    const rows: CollectionRunItemProgressRow[] = [makeRow({ status: 'completed' })];
    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'completed' }, rows);

    // Assert on key sets rather than scanning stringified values: a realistic prompt name (e.g.
    // "best text editor") or chatbot label legitimately contains substrings like "text", so a
    // value scan is both unsound (false positives) and toothless (misses a forbidden key whose
    // value happens not to match). The shape is the actual contract ADR 0007 cares about.
    expect(Object.keys(progress).sort()).toEqual(
      [
        'runId',
        'status',
        'isTerminal',
        'promptsTotal',
        'promptsCompleted',
        'promptsFailed',
        'promptsFinished',
        'projects',
      ].sort()
    );

    const project = progress.projects[0];
    expect(Object.keys(project).sort()).toEqual(
      [
        'projectId',
        'projectName',
        'promptsTotal',
        'promptsCompleted',
        'promptsFailed',
        'promptsFinished',
        'prompts',
      ].sort()
    );

    const prompt = project.prompts[0];
    expect(Object.keys(prompt).sort()).toEqual(
      ['promptId', 'promptName', 'status', 'chatbots'].sort()
    );

    const chatbot = prompt.chatbots[0];
    expect(Object.keys(chatbot).sort()).toEqual(['chatbotId', 'status'].sort());
  });
});

describe('formatCollectionRunProgressSummary', () => {
  it('formats a run with failures', () => {
    const rows: CollectionRunItemProgressRow[] = [];
    for (let i = 0; i < 22; i++) {
      rows.push(makeRow({ promptId: `completed-${i}`, status: 'completed' }));
    }
    for (let i = 0; i < 3; i++) {
      rows.push(makeRow({ promptId: `failed-${i}`, status: 'failed' }));
    }
    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'completed' }, rows);

    expect(formatCollectionRunProgressSummary(progress)).toBe(
      'Covered 22 of 25 Prompts — 3 failed'
    );
  });

  it('formats a clean run with no failures', () => {
    const rows: CollectionRunItemProgressRow[] = [];
    for (let i = 0; i < 25; i++) {
      rows.push(makeRow({ promptId: `completed-${i}`, status: 'completed' }));
    }
    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'completed' }, rows);

    expect(formatCollectionRunProgressSummary(progress)).toBe('Covered 25 of 25 Prompts');
  });

  it('formats the cancelled variant', () => {
    const rows: CollectionRunItemProgressRow[] = [
      makeRow({ promptId: 'completed-1', status: 'completed' }),
      makeRow({ promptId: 'cancelled-1', status: 'cancelled' }),
    ];
    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'cancelled' }, rows);

    expect(formatCollectionRunProgressSummary(progress)).toBe(
      'Cancelled — covered 1 of 2 Prompts'
    );
  });

  it('formats the cancelled variant with failures too', () => {
    const rows: CollectionRunItemProgressRow[] = [
      makeRow({ promptId: 'completed-1', status: 'completed' }),
      makeRow({ promptId: 'failed-1', status: 'failed' }),
      makeRow({ promptId: 'cancelled-1', status: 'cancelled' }),
    ];
    const progress = buildCollectionRunProgress({ id: 'run-1', status: 'cancelled' }, rows);

    expect(formatCollectionRunProgressSummary(progress)).toBe(
      'Cancelled — covered 1 of 3 Prompts — 1 failed'
    );
  });
});
