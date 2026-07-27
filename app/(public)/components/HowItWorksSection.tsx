type HowItWorksItem = {
  step: string;
  title: string;
  description: string;
};

type HowItWorksSectionProps = {
  eyebrow?: string;
  title: string;
  items: HowItWorksItem[];
};

export const HowItWorksSection = ({
  eyebrow = 'How It Works',
  title,
  items,
}: HowItWorksSectionProps) => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="reveal mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">{eyebrow}</span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            {title}
          </h2>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-0 md:mt-16 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.step}
              className="reveal group relative flex flex-col items-start px-6 py-6 text-start lg:py-0"
            >
              {/* Step number with dot */}
              <div className="mb-4 flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
                <div className="bg-brand-solid flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  {item.step}
                </div>
              </div>
              <h3 className="text-primary text-lg font-semibold">{item.title}</h3>
              <p className="text-tertiary mt-2 text-base">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
