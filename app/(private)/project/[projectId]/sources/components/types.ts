import z from 'zod';

export const SourcesTypeSchema = z.enum(['domains', 'contents']);
export type SourcesType = z.infer<typeof SourcesTypeSchema>;
