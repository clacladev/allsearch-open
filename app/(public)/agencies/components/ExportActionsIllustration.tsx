import {
  Calendar,
  Database01,
  DownloadCloud01,
  FileCheck02,
  InfoCircle,
  Plus,
  Share04,
} from '@untitledui/icons';

const EXPORT_ACTIONS = [
  { label: 'Export as CSV', icon: Database01 },
  { label: 'Export as Excel', icon: FileCheck02 },
  { label: 'Export to...', icon: Share04 },
] as const;

const PROMPT_ROWS = [
  'Best high-quality running shoes to improve your daily runs easily.',
  'Best water-resistant trail running shoes for long-distance training.',
  'What are the most durable flip flops for beach and daily wear?',
] as const;

export const ExportActionsIllustration = () => (
  <div
    className="bg-primary ring-secondary relative overflow-hidden rounded-2xl p-4 shadow-xs ring-1 md:p-5"
    aria-hidden="true"
  >
    <div className="mb-3 flex items-center gap-2">
      <div className="border-secondary bg-primary text-secondary flex h-10 flex-1 items-center gap-2 rounded-xl border px-3 text-sm font-semibold shadow-xs">
        <Calendar className="text-quaternary size-5" />
        <span>27 Jan 2026 - 26 Feb 2026</span>
      </div>

      <button
        type="button"
        className="border-secondary bg-primary text-secondary flex h-10 items-center rounded-xl border px-4 text-sm font-semibold shadow-xs"
      >
        <Plus className="mr-1 size-4" />
        Add new
      </button>

      <button
        type="button"
        className="border-secondary bg-primary text-secondary relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs"
      >
        <DownloadCloud01 className="size-5" />
      </button>
    </div>

    <div className="border-secondary bg-secondary/30 overflow-hidden rounded-2xl border">
      <div className="border-secondary text-secondary flex items-center border-b px-4 py-3 text-sm font-semibold">
        Prompt
        <InfoCircle className="text-quaternary ml-2 size-4" />
      </div>

      {PROMPT_ROWS.map((prompt) => (
        <div key={prompt} className="border-secondary border-b px-4 py-4 last:border-b-0">
          <p className="text-secondary line-clamp-2 text-left text-sm md:text-base">{prompt}</p>
        </div>
      ))}
    </div>

    <div className="absolute inset-0 z-5 bg-black/35 backdrop-blur-xs" />

    <div className="border-secondary bg-primary absolute top-16 right-4 z-10 w-fit min-w-56 rounded-2xl border p-2 shadow-lg md:right-5 md:p-3">
      <ul className="flex flex-col gap-1">
        {EXPORT_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <li
              key={action.label}
              className="text-secondary flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold"
            >
              <Icon className="text-quaternary size-4" />
              {action.label}
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);
