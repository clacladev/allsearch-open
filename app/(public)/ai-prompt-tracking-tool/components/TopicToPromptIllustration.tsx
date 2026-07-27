const SuggestedPrompt = ({
  text,
  added,
  highlighted,
}: {
  text: string;
  added?: boolean;
  highlighted?: boolean;
}) => (
  <div
    className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${
      highlighted ? 'border-brand-solid/30' : 'border-secondary'
    } bg-primary`}
  >
    <div className="bg-brand-solid size-1.5 shrink-0 rounded-full" />
    <span className="text-tertiary flex-1 text-xs">{text}</span>
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
        added
          ? 'bg-utility-success-50 text-fg-success-primary'
          : 'bg-utility-success-50 text-fg-success-primary'
      }`}
    >
      {added ? 'Added ✓' : 'Add +'}
    </span>
  </div>
);

export const TopicToPromptIllustration = () => (
  <div className="bg-primary ring-secondary overflow-hidden rounded-2xl ring-1">
    {/* Window chrome */}
    <div className="bg-secondary border-secondary flex items-center gap-2 border-b px-4 py-3">
      <div className="size-2.5 rounded-full bg-[#ff5f56]" />
      <div className="size-2.5 rounded-full bg-[#ffbd2e]" />
      <div className="size-2.5 rounded-full bg-[#27c93f]" />
      <span className="text-tertiary ml-1.5 text-xs font-medium">Topic → Prompt Generator</span>
    </div>

    <div className="flex flex-col gap-4 p-4">
      {/* Selected Topic */}
      <div>
        <div className="text-quaternary mb-2.5 text-[10px] font-bold tracking-wider uppercase">
          Selected Topic
        </div>
        <div className="border-brand-solid/30 bg-brand-solid/10 flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <span className="text-fg-brand-primary text-xs font-semibold">
            AI citation tracking tools
          </span>
          <span className="text-tertiary text-[10px]">✏ Edit</span>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div>
        <div className="text-quaternary mb-2.5 text-[10px] font-bold tracking-wider uppercase">
          Suggested Prompts{' '}
          <span className="text-fg-success-primary ml-1">6 generated</span>
        </div>
        <div className="flex flex-col gap-2">
          <SuggestedPrompt text="What tools track AI citation rates?" />
          <SuggestedPrompt text="How to track which AI engines cite my site?" highlighted />
          <SuggestedPrompt text="Best citation tracking software for AI search" added />
        </div>
      </div>
    </div>
  </div>
);
