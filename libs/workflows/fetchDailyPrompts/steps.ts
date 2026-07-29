import { getProjectRowsAll } from '@/libs/database/Projects/queries';
import { fetchDailyPromptsForProjectWorkflow } from '../fetchDailyPromptsForProject';
import { start } from 'workflow/api';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { chunk } from '@/libs/utils/chunk';

const PROJECTS_BATCH_SIZE = 10;

export async function startFetchDailyPromptsForProjects(date: ISODateString) {
  'use step';
  const projectIdsBatches = await getProjectIdsBatchesToProcess();
  for (const batch of projectIdsBatches) {
    await Promise.allSettled(
      batch.map((projectId) => start(fetchDailyPromptsForProjectWorkflow, [projectId, date]))
    );
  }
}

async function getProjectIdsBatchesToProcess() {
  'use step';
  const projects = await getProjectRowsAll(false, ['id', 'is_paused']);
  const projectsIds = projects.filter((project) => !project.is_paused).map((project) => project.id);
  return chunk(projectsIds, PROJECTS_BATCH_SIZE);
}
