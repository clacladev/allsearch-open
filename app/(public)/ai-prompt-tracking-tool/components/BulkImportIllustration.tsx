const BulkRow = ({
  text,
  checked,
  badge,
}: {
  text: string;
  checked?: boolean;
  badge?: string;
}) => (
  <div className="border-secondary flex items-center gap-2.5 border-b py-2 last:border-b-0">
    <div
      className={`flex size-4 shrink-0 items-center justify-center rounded ${
        checked ? 'bg-brand-solid' : 'border-tertiary border'
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4l3 3 5-6"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
    <span className="text-tertiary flex-1 text-xs">{text}</span>
    {badge ? (
      <span className="bg-brand-solid/10 text-fg-brand-primary rounded px-2 py-0.5 text-[10px] font-semibold">
        {badge}
      </span>
    ) : (
      <span className="text-quaternary text-[10px]">Draft</span>
    )}
  </div>
);

export const BulkImportIllustration = () => (
  <div className="bg-primary ring-secondary overflow-hidden rounded-2xl ring-1">
    {/* Window chrome */}
    <div className="bg-secondary border-secondary flex items-center gap-2 border-b px-4 py-3">
      <div className="size-2.5 rounded-full bg-[#ff5f56]" />
      <div className="size-2.5 rounded-full bg-[#ffbd2e]" />
      <div className="size-2.5 rounded-full bg-[#27c93f]" />
      <span className="text-tertiary ml-1.5 text-xs font-medium">Prompt Library</span>
    </div>

    <div className="p-4">
      {/* Header row */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-quaternary text-[10px] font-bold tracking-wider uppercase">
          All Prompts{' '}
          <span className="text-fg-brand-primary ml-1">148</span>
        </div>
        <div className="flex gap-2">
          <div className="border-brand-solid/30 bg-brand-solid/10 text-fg-brand-primary rounded-md border px-2.5 py-1 text-[10px] font-semibold">
            ↑ Bulk Import
          </div>
          <div className="border-secondary text-tertiary rounded-md border px-2.5 py-1 text-[10px] font-semibold">
            ↓ Export
          </div>
        </div>
      </div>

      {/* Prompt rows */}
      <BulkRow text="Best AI search visibility tools 2025" checked badge="Tracking" />
      <BulkRow text="How to appear in ChatGPT answers" checked badge="Tracking" />
      <BulkRow text="Perplexity citation tracking for brands" />
      <BulkRow text="LLM brand visibility benchmarking tool" />
    </div>
  </div>
);
