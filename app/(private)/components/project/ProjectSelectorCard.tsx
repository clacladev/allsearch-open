'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Placement } from 'react-aria';
import { ChevronSelectorVertical, Plus } from '@untitledui/icons';
import { useFocusManager } from 'react-aria';
import type { DialogProps as AriaDialogProps } from 'react-aria-components';
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components';
import { Button } from '@/components/base/buttons/button';
import { RadioButtonBase } from '@/components/base/radio-buttons/radio-buttons';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cx } from '@/utils/cx';
import { ProjectIconLabelGroup } from './ProjectIconLabelGroup';
import { RouteHelper, ROUTES } from '@/libs/routes';
import { useRouter } from 'next/navigation';

export type ProjectStatus = 'running' | 'paused';

export type NavProjectType = {
  /** Unique identifier for the nav item. */
  id: string;
  /** Name of the project. */
  name: string;
  /** Domain of the project. */
  url: string;
  /** Hostname of the project. */
  hostname: string;
  /** Icon of the project. */
  iconUrl: string | undefined;
  /** Status of the project. */
  status: ProjectStatus;
};

export const NavProjectMenu = ({
  className,
  projects,
  selectedProjectId,
  ...dialogProps
}: AriaDialogProps & {
  className?: string;
  projects: NavProjectType[];
  selectedProjectId?: string;
}) => {
  const focusManager = useFocusManager();
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          focusManager?.focusNext({ tabbable: true, wrap: true });
          break;
        case 'ArrowUp':
          focusManager?.focusPrevious({ tabbable: true, wrap: true });
          break;
      }
    },
    [focusManager]
  );

  useEffect(() => {
    const element = dialogRef.current;
    if (element) element.addEventListener('keydown', onKeyDown);
    return () => {
      if (element) element.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <AriaDialog
      {...dialogProps}
      ref={dialogRef}
      className={cx(
        'bg-secondary_alt ring-secondary_alt w-66 rounded-xl shadow-lg ring outline-hidden',
        className
      )}
    >
      {({ close }) => (
        <>
          <div className="bg-primary ring-secondary rounded-xl ring-1">
            <div className="flex flex-col gap-0.5 py-1.5">
              <div className="text-tertiary px-3 pt-1.5 pb-1 text-xs font-semibold">
                Switch project
              </div>

              <div
                className={cx(
                  'flex flex-col gap-0.5 px-1.5',
                  projects.length > 5 && 'max-h-[280px] overflow-y-auto overscroll-contain'
                )}
                style={projects.length > 5 ? { scrollbarWidth: 'thin', scrollbarGutter: 'stable' } : undefined}
              >
                {projects.map((project) => (
                  <button
                    key={project.id}
                    className={cx(
                      'outline-focus-ring hover:bg-primary_hover relative w-full cursor-pointer rounded-md px-2 py-1.5 text-left focus:z-10 focus-visible:outline-2 focus-visible:outline-offset-2',
                      project.id === selectedProjectId && 'bg-primary_hover'
                    )}
                    onClick={() => {
                      router.push(RouteHelper.Project.getOverview(project.id));
                      close();
                    }}
                  >
                    <ProjectIconLabelGroup
                      status={project.status}
                      size="md"
                      src={project.iconUrl}
                      title={project.name}
                      subtitle={project.hostname}
                    />

                    <RadioButtonBase
                      isSelected={project.id === selectedProjectId}
                      className="absolute top-2 right-2"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 px-2 pt-0.5 pb-2">
              <Button
                iconLeading={Plus}
                color="secondary"
                size="sm"
                href={ROUTES.NEW_PROJECT.INDEX}
                onClick={close}
              >
                New project
              </Button>
            </div>
          </div>
        </>
      )}
    </AriaDialog>
  );
};

export const ProjectSelectorCard = ({
  popoverPlacement,
  selectedProjectId,
  projects,
}: {
  popoverPlacement?: Placement;
  selectedProjectId?: string;
  projects: NavProjectType[];
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useBreakpoint('lg');

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  // if (!selectedProject) {
  //   console.warn(`Project with ID ${selectedProjectId} not found in <NavProjectCard />`);
  //   return null;
  // }

  return (
    <div
      ref={triggerRef}
      className="ring-secondary relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-inset"
    >
      <ProjectIconLabelGroup
        size="md"
        src={selectedProject?.iconUrl}
        title={selectedProject?.name}
        subtitle={selectedProject?.hostname}
        status={selectedProject?.status}
      />

      <div className="absolute top-1.5 right-1.5">
        <AriaDialogTrigger>
          <AriaButton className="text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-quaternary_hover pressed:bg-primary_hover pressed:text-fg-quaternary_hover flex cursor-pointer items-center justify-center rounded-md p-1.5 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2">
            <ChevronSelectorVertical className="size-4 shrink-0" />
          </AriaButton>
          <AriaPopover
            placement={popoverPlacement ?? (isDesktop ? 'right bottom' : 'top right')}
            triggerRef={triggerRef}
            offset={8}
            className={({ isEntering, isExiting }) =>
              cx(
                'origin-(--trigger-anchor-point) will-change-transform',
                isEntering &&
                  'animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5 duration-150 ease-out',
                isExiting &&
                  'animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5 duration-100 ease-in'
              )
            }
          >
            <NavProjectMenu selectedProjectId={selectedProjectId} projects={projects} />
          </AriaPopover>
        </AriaDialogTrigger>
      </div>
    </div>
  );
};
