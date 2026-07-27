const TopicChip = ({ label, active }: { label: string; active?: boolean }) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
      active
        ? 'border-brand-solid/30 text-fg-brand-primary bg-brand-solid/10'
        : 'border-secondary text-tertiary bg-primary'
    }`}
  >
    {label}
  </div>
);

const PromptCard = ({
  text,
  tag,
  tagVariant,
}: {
  text: string;
  tag: string;
  tagVariant: 'auto' | 'topic';
}) => (
  <div className="border-secondary bg-primary flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5">
    <div className="bg-brand-solid size-1.5 shrink-0 rounded-full" />
    <span className="text-tertiary flex-1 text-xs">{text}</span>
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
        tagVariant === 'auto'
          ? 'bg-utility-success-50 text-fg-success-primary'
          : 'bg-brand-solid/10 text-fg-brand-primary'
      }`}
    >
      {tag}
    </span>
  </div>
);

export const PromptResearchIllustration = () => (
  <div className="bg-primary ring-secondary overflow-hidden rounded-2xl ring-1">
    {/* Window chrome */}
    <div className="bg-secondary border-secondary flex items-center gap-2 border-b px-4 py-3">
      <div className="size-2.5 rounded-full bg-[#ff5f56]" />
      <div className="size-2.5 rounded-full bg-[#ffbd2e]" />
      <div className="size-2.5 rounded-full bg-[#27c93f]" />
      <span className="text-tertiary ml-1.5 text-xs font-medium">Prompt Research</span>
    </div>

    <div className="flex flex-col gap-4 p-4">
      {/* Suggested Topics */}
      <div>
        <div className="text-quaternary mb-2.5 text-[10px] font-bold tracking-wider uppercase">
          Suggested Topics
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TopicChip label="AI visibility tracking" active />
          <TopicChip label="AI citation tools" />
          <TopicChip label="AEO content strategy" active />
          <TopicChip label="LLM brand mentions" />
          <TopicChip label="AI search optimisation" />
          <TopicChip label="prompt research tool" />
        </div>
      </div>

      {/* Auto-generated Prompts */}
      <div>
        <div className="text-quaternary mb-2.5 text-[10px] font-bold tracking-wider uppercase">
          Auto-generated Prompts
        </div>
        <div className="flex flex-col gap-2">
          <PromptCard
            text="What is the best AI visibility tracking tool?"
            tag="Auto"
            tagVariant="auto"
          />
          <PromptCard
            text="How do I track brand mentions in ChatGPT?"
            tag="Auto"
            tagVariant="auto"
          />
          <PromptCard
            text="Best AEO content strategy for SaaS brands"
            tag="Topic"
            tagVariant="topic"
          />
          <PromptCard
            text="Which tools track AI citations in Perplexity?"
            tag="Auto"
            tagVariant="auto"
          />
        </div>
      </div>
    </div>
  </div>
);
