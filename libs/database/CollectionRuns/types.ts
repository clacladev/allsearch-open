import { collectionRuns } from '../schema';

export type CollectionRunRow = typeof collectionRuns.$inferSelect;

export type CollectionRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type CollectionRunScope = 'all' | 'projects';
