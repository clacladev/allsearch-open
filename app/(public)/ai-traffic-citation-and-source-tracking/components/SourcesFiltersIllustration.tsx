import { SourcesIllustration } from '../../agencies/components/SourcesIllustration';

const FilterButton = ({
  label,
  value,
  hasWarningDot,
}: {
  label: string;
  value: string;
  hasWarningDot?: boolean;
}) => (
  <div className="relative">
    <div className="bg-primary ring-primary flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm shadow-xs ring-1 ring-inset">
      <span className="text-secondary">{label}:</span>
      <span className="text-primary font-medium">{value}</span>
      <svg className="text-fg-quaternary size-4 shrink-0" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    {hasWarningDot && (
      <svg className="text-fg-warning-primary pointer-events-none absolute -top-1 -right-1" width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4" fill="currentColor" stroke="currentColor" />
      </svg>
    )}
  </div>
);

const InactiveFilterButton = ({ label }: { label: string }) => (
  <div className="bg-primary ring-primary flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm shadow-xs ring-1 ring-inset">
    <span className="text-secondary">{label}</span>
    <svg className="text-fg-quaternary size-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const UsedPercentagePopover = () => (
  <div className="relative">
    <FilterButton label="Used %" value="52% – 78%" hasWarningDot />
    <div className="ring-secondary_alt bg-primary absolute top-full left-0 z-10 mt-1 w-56 rounded-lg p-3 shadow-lg ring-1">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-tertiary mb-1 block text-xs">Min (%)</label>
            <div className="ring-brand bg-primary text-primary w-full rounded-md px-2 py-1.5 text-sm ring-2 ring-inset">
              52
            </div>
          </div>
          <div className="text-tertiary mt-5 text-xs">–</div>
          <div className="flex-1">
            <label className="text-tertiary mb-1 block text-xs">Max (%)</label>
            <div className="ring-primary bg-primary text-primary w-full rounded-md px-2 py-1.5 text-sm ring-1 ring-inset">
              78
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-brand-solid flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium text-white">
            Apply
          </div>
          <div className="ring-secondary text-secondary flex-1 rounded-md px-3 py-1.5 text-center text-sm ring-1 ring-inset">
            Clear
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FilterToggleButton = () => (
  <div className="relative">
    <div className="bg-primary ring-primary flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset text-primary">
      <svg className="size-4" viewBox="0 0 24 24" fill="none">
        <path d="M2 4.6C2 4.04 2 3.76 2.11 3.55C2.2 3.37 2.37 3.2 2.55 3.11C2.76 3 3.04 3 3.6 3H20.4C20.96 3 21.24 3 21.45 3.11C21.63 3.2 21.8 3.37 21.89 3.55C22 3.76 22 4.04 22 4.6V5.26C22 5.54 22 5.68 21.96 5.8C21.93 5.91 21.88 6.01 21.81 6.11C21.73 6.21 21.63 6.29 21.42 6.46L14.58 12.24C14.37 12.41 14.27 12.49 14.19 12.59C14.12 12.69 14.07 12.79 14.04 12.9C14 13.02 14 13.16 14 13.44V17.67C14 17.83 14 17.91 13.97 17.98C13.95 18.04 13.91 18.1 13.86 18.14C13.81 18.19 13.74 18.22 13.6 18.28L10.8 19.48C10.52 19.6 10.38 19.66 10.27 19.63C10.17 19.6 10.09 19.54 10.04 19.45C10 19.36 10 19.21 10 18.9V13.44C10 13.16 10 13.02 9.96 12.9C9.93 12.79 9.88 12.69 9.81 12.59C9.73 12.49 9.63 12.41 9.42 12.24L2.58 6.46C2.37 6.29 2.27 6.21 2.19 6.11C2.12 6.01 2.07 5.91 2.04 5.8C2 5.68 2 5.54 2 5.26V4.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Filters
    </div>
    <svg className="text-fg-warning-primary pointer-events-none absolute -top-1 -right-1" width="10" height="10" viewBox="0 0 10 10" fill="none">
      <circle cx="5" cy="5" r="4" fill="currentColor" stroke="currentColor" />
    </svg>
  </div>
);

const ContentsDomainsToggle = () => (
  <div className="ring-secondary bg-secondary inline-flex items-center rounded-lg p-0.5 ring-1">
    <div className="bg-primary ring-secondary flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium shadow-xs ring-1 text-primary">
      <svg className="text-fg-success-secondary size-2" width="8" height="8" viewBox="0 0 8 8" fill="none">
        <circle cx="4" cy="4" r="2.5" fill="currentColor" stroke="currentColor" />
      </svg>
      Contents
    </div>
    <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-tertiary">
      <svg className="text-fg-tertiary size-2" width="8" height="8" viewBox="0 0 8 8" fill="none">
        <circle cx="4" cy="4" r="2.5" fill="currentColor" stroke="currentColor" />
      </svg>
      Domains
    </div>
  </div>
);

const ClearFiltersButton = () => (
  <div className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-secondary">
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Clear filters
  </div>
);

export const SourcesFiltersIllustration = () => (
  <div className="bg-primary ring-secondary relative overflow-hidden rounded-2xl ring-1">
    {/* Background: SourcesIllustration */}
    <div className="pointer-events-none select-none" aria-hidden="true">
      <SourcesIllustration />
    </div>

    {/* Blur overlay */}
    <div className="absolute inset-0 z-5 backdrop-blur-xs" />

    {/* Filter overlay */}
    <div className="absolute inset-0 z-10 flex flex-col gap-2 p-3">
      {/* Top bar: toggle + filter button */}
      <div className="flex items-center gap-2">
        <ContentsDomainsToggle />
        <div className="flex-1" />
        <FilterToggleButton />
      </div>

      {/* Expanded filter bar */}
      <div className="flex flex-wrap items-start gap-2 px-3 py-2.5">
        <InactiveFilterButton label="Title" />
        <FilterButton label="Category" value="You +2" hasWarningDot />
        <UsedPercentagePopover />
        <InactiveFilterButton label="Cited %" />
        <InactiveFilterButton label="Mentioned" />
        <InactiveFilterButton label="Chatbot" />
        <ClearFiltersButton />
      </div>
    </div>
  </div>
);
