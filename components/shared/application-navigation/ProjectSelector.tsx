'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RouteHelper, ROUTES } from '@/libs/routes';
import type { NavigationProject } from './navigation-types';

export function ProjectSelector({
  projects,
  selectedProjectId,
}: {
  projects: NavigationProject[];
  selectedProjectId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = projects.find((project) => project.id === selectedProjectId);
  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="border-border relative flex min-w-0 items-center gap-2 rounded-xl border p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{selected?.name ?? 'Project'}</p>
          <p className="text-muted-foreground truncate text-xs">{selected?.hostname}</p>
        </div>
        <PopoverTrigger
          aria-label="Select project"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <ChevronDown />
        </PopoverTrigger>
      </div>
      <PopoverContent side="right" align="start" className="w-72 gap-2">
        <p className="text-muted-foreground text-xs font-semibold">Switch project</p>
        <div className="max-h-70 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => navigate(RouteHelper.Project.getOverview(project.id))}
              aria-current={project.id === selectedProjectId ? 'page' : undefined}
              className="hover:bg-muted focus-visible:ring-shadcn-primary/50 flex w-full flex-col rounded-md px-2 py-2 text-left outline-none focus-visible:ring-2 aria-[current=page]:bg-muted"
            >
              <span className="text-sm font-medium">{project.name}</span>
              <span className="text-muted-foreground text-xs">{project.hostname}</span>
            </button>
          ))}
        </div>
        <a
          href={ROUTES.NEW_PROJECT.INDEX}
          className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium"
        >
          <Plus className="size-4" />
          New project
        </a>
        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium"
        >
          <Settings className="size-4" />
          App Settings
        </button>
      </PopoverContent>
    </Popover>
  );
}
