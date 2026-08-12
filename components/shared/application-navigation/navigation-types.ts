import type { LucideIcon } from 'lucide-react';
export type NavigationItem = { label: string; href: string; icon: LucideIcon };
export type NavigationProject = { id: string; name: string; url: string; hostname: string; iconUrl?: string; status: 'running' | 'paused' };
