import { startFetchDailyPromptsForProjects } from './steps';
import { ISODateString } from '@/libs/database/shared/ISODateString';

export async function fetchDailyPromptsWorkflow(date: ISODateString) {
  'use workflow';
  await startFetchDailyPromptsForProjects(date);
}
