'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { ProjectIconLabelGroup } from '@/app/(private)/components/project/ProjectIconLabelGroup';
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
      <div className="border-border relative flex min-w-0 items-center gap-3 rounded-xl border p-3">
        <ProjectIconLabelGroup
          size="md"
          src={selected?.iconUrl}
          title={selected?.name ?? 'Project'}
          subtitle={selected?.hostname ?? ''}
          status={selected?.status}
        />
        <PopoverTrigger
          aria-label="Select project"
          render={<Button variant="ghost" size="icon-sm" className="absolute top-1.5 right-1.5 p-1.5 text-muted-foreground hover:text-foreground" />}
        >
          <ChevronDown className="size-4 stroke-[2.5]" />
        </PopoverTrigger>
      </div>
      <PopoverContent side="right" sideOffset={8} align="start" className="w-[264px] gap-0 rounded-xl bg-[var(--color-bg-secondary_alt)] p-0 shadow-lg ring-[var(--color-border-secondary_alt)]">
        <div className="rounded-xl bg-background py-1.5 ring-1 ring-border">
          <p className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">Switch project</p>
          <div className="max-h-70 overflow-y-auto px-1.5">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => navigate(RouteHelper.Project.getOverview(project.id))}
              aria-current={project.id === selectedProjectId ? 'page' : undefined}
              className="hover:bg-muted focus-visible:ring-shadcn-primary/50 flex w-full flex-col rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 aria-[current=page]:bg-muted"
            >
              <span className="text-sm font-medium">{project.name}</span>
              <span className="text-muted-foreground text-xs">{project.hostname}</span>
            </button>
          ))}
          </div>
          <a
            href={ROUTES.NEW_PROJECT.INDEX}
            className="mt-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Plus className="size-4" />
            New project
          </a>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-5 text-muted-foreground" />
          App Settings
        </button>
      </PopoverContent>
    </Popover>
  );
}
