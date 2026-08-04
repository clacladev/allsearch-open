// Client-safe: this file must not import `server-only`, `@/libs/database/client`, or any
// `queries.ts`. Client components import types and formatters from here directly, never from
// `@/libs/collection` (the barrel pulls in server-only modules).

import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { CollectionRunItemStatus } from '@/libs/database/CollectionRunItems/types';
import { CollectionRunStatus } from '@/libs/database/CollectionRuns/types';
import type { CollectionRunItemProgressRow } from '@/libs/database/CollectionRunItems/queries';

export type CollectionRunProgressChatbot = { chatbotId: ChatbotId; status: CollectionRunItemStatus };

export type CollectionRunProgressPrompt = {
  promptId: string;
  promptName: string;
  status: CollectionRunItemStatus; // derived, see buildCollectionRunProgress
  chatbots: CollectionRunProgressChatbot[];
};

export type CollectionRunProgressProject = {
  projectId: string;
  projectName: string;
  promptsTotal: number;
  promptsCompleted: number;
  promptsFailed: number;
  promptsFinished: number; // completed + failed + cancelled
  prompts: CollectionRunProgressPrompt[];
};

export type CollectionRunProgress = {
  runId: string;
  status: CollectionRunStatus;
  isTerminal: boolean; // status is completed | failed | cancelled
  promptsTotal: number;
  promptsCompleted: number;
  promptsFailed: number;
  promptsFinished: number;
  projects: CollectionRunProgressProject[];
};

const TERMINAL_RUN_STATUSES: CollectionRunStatus[] = ['completed', 'failed', 'cancelled'];

/** A Prompt counts as covered when at least one Chatbot answered. Precedence: any item `running`
 * wins over `pending`, which wins over `completed`, which wins over `failed`, which wins over
 * `cancelled` — so a Prompt only reads as finished once every one of its Chatbots is. */
function derivePromptStatus(chatbots: CollectionRunProgressChatbot[]): CollectionRunItemStatus {
  if (chatbots.some((chatbot) => chatbot.status === 'running')) return 'running';
  if (chatbots.some((chatbot) => chatbot.status === 'pending')) return 'pending';
  if (chatbots.some((chatbot) => chatbot.status === 'completed')) return 'completed';
  if (chatbots.some((chatbot) => chatbot.status === 'failed')) return 'failed';
  return 'cancelled';
}

export function buildCollectionRunProgress(
  run: { id: string; status: CollectionRunStatus },
  rows: CollectionRunItemProgressRow[]
): CollectionRunProgress {
  const projectsById = new Map<
    string,
    { projectName: string; promptsById: Map<string, { promptName: string; chatbots: CollectionRunProgressChatbot[] }> }
  >();

  for (const row of rows) {
    let project = projectsById.get(row.projectId);
    if (!project) {
      project = { projectName: row.projectName, promptsById: new Map() };
      projectsById.set(row.projectId, project);
    }
    let prompt = project.promptsById.get(row.promptId);
    if (!prompt) {
      prompt = { promptName: row.promptName, chatbots: [] };
      project.promptsById.set(row.promptId, prompt);
    }
    prompt.chatbots.push({ chatbotId: row.chatbotId, status: row.status });
  }

  const projects: CollectionRunProgressProject[] = [];
  let promptsTotal = 0;
  let promptsCompleted = 0;
  let promptsFailed = 0;
  let promptsFinished = 0;

  for (const [projectId, project] of projectsById) {
    const prompts: CollectionRunProgressPrompt[] = [];
    let projectPromptsCompleted = 0;
    let projectPromptsFailed = 0;
    let projectPromptsFinished = 0;

    for (const [promptId, prompt] of project.promptsById) {
      const status = derivePromptStatus(prompt.chatbots);
      prompts.push({ promptId, promptName: prompt.promptName, status, chatbots: prompt.chatbots });
      if (status === 'completed') projectPromptsCompleted++;
      if (status === 'failed') projectPromptsFailed++;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        projectPromptsFinished++;
      }
    }

    projects.push({
      projectId,
      projectName: project.projectName,
      promptsTotal: prompts.length,
      promptsCompleted: projectPromptsCompleted,
      promptsFailed: projectPromptsFailed,
      promptsFinished: projectPromptsFinished,
      prompts,
    });

    promptsTotal += prompts.length;
    promptsCompleted += projectPromptsCompleted;
    promptsFailed += projectPromptsFailed;
    promptsFinished += projectPromptsFinished;
  }

  return {
    runId: run.id,
    status: run.status,
    isTerminal: TERMINAL_RUN_STATUSES.includes(run.status),
    promptsTotal,
    promptsCompleted,
    promptsFailed,
    promptsFinished,
    projects,
  };
}

export function getCollectionRunProgressCountLabel(scope: {
  promptsFinished: number;
  promptsTotal: number;
}): string {
  return `${scope.promptsFinished} of ${scope.promptsTotal}`;
}

export function getCollectionRunProgressPercentage(scope: {
  promptsFinished: number;
  promptsTotal: number;
}): number {
  return scope.promptsTotal ? Math.round((scope.promptsFinished / scope.promptsTotal) * 100) : 0;
}

export function formatCollectionRunProgressSummary(progress: CollectionRunProgress): string {
  const { status, promptsCompleted, promptsTotal, promptsFailed } = progress;
  if (status === 'cancelled') {
    return (
      `Cancelled — covered ${promptsCompleted} of ${promptsTotal} Prompts` +
      (promptsFailed > 0 ? ` — ${promptsFailed} failed` : '')
    );
  }
  if (promptsFailed > 0) {
    return `Covered ${promptsCompleted} of ${promptsTotal} Prompts — ${promptsFailed} failed`;
  }
  return `Covered ${promptsCompleted} of ${promptsTotal} Prompts`;
}
