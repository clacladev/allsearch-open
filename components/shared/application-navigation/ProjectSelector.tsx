'use client';

import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RouteHelper, ROUTES } from '@/libs/routes';
import type { NavigationProject } from './navigation-types';

export function ProjectSelector({ projects, selectedProjectId }: { projects: NavigationProject[]; selectedProjectId?: string }) {
 const router = useRouter(); const selected = projects.find((project) => project.id === selectedProjectId);
 return <Popover><div className="relative flex min-w-0 items-center gap-2 rounded-xl border border-border p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selected?.name ?? 'Project'}</p><p className="truncate text-xs text-muted-foreground">{selected?.hostname}</p></div><PopoverTrigger aria-label="Select project" render={<Button variant="ghost" size="icon-sm" />}><ChevronDown /></PopoverTrigger></div><PopoverContent side="right" align="start" className="w-72 gap-2"><p className="text-xs font-semibold text-muted-foreground">Switch project</p><div className="max-h-70 overflow-y-auto">{projects.map((project) => <button key={project.id} type="button" onClick={() => router.push(RouteHelper.Project.getOverview(project.id))} className="flex w-full flex-col rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><span className="text-sm font-medium">{project.name}</span><span className="text-xs text-muted-foreground">{project.hostname}</span></button>)}</div><a href={ROUTES.NEW_PROJECT.INDEX} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"><Plus className="size-4" />New project</a><button type="button" onClick={() => router.push(ROUTES.SETTINGS)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-muted"><Settings className="size-4" />App Settings</button></PopoverContent></Popover>;
}
