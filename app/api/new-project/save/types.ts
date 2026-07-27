import { z } from 'zod';
import { PromptAndTopicId } from '@/libs/utils/PromptAndTopicId';

export const BrandSchema = z.object({
  url: z.string().trim(),
  name: z.string().trim(),
  iconUrl: z.string().trim().optional(),
  targetLocation: z.string().trim().optional(),
});

export const TopicsSchema = z.array(z.string());

export const PromptIdsSchema: z.ZodType<PromptAndTopicId[]> = z.array(
  z.string() as unknown as z.ZodType<PromptAndTopicId>
);

export const CompetitorSchema = z.object({
  url: z.string().trim(),
  name: z.string().trim().optional(),
  iconUrl: z.string().trim().optional(),
});

export type SaveNewProjectResponse = {
  projectId: string;
  workflowId: string;
};
