'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Avatar } from '@/components/base/avatar/avatar';
import { cx } from '@/utils/cx';
import { Button } from '@/components/base/buttons/button';
import { openSupportOnClick } from '@/app/(public)/components/SupportButton';

export type FaqItem = { question: string; answer: string | ReactNode };

const FAQS: FaqItem[] = [
  {
    question: 'What is this tool?',
    answer:
      'AllSearch is an AI search analytics and visibility platform. It tracks how your brand, competitors, prompts, and content are picked up by AI search engines and LLM-based platforms. It shows where you appear, how often, and under which prompts. It also provides data-driven opportunities on what to improve for the biggest uplift.',
  },
  {
    question: 'What analytics and outputs do I get with this tool?',
    answer: (
      <>
        You receive:
        <ul className="list-disc pl-6">
          <li>Brand visibility tracking on AI search</li>
          <li>Competitor tracking and benchmarking</li>
          <li>Prompt-level and topic-level visibility</li>
          <li>Citation and source tracking</li>
          <li>
            Actionable opportunity suggestions based on data patterns to show what to improve and
            what to prioritize to increase AI search visibility.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Which AI search sources does this tool monitor?',
    answer:
      "It currently supports sources: OpenAI's ChatGPT, Perplexity, Google AI. Other AI search engines will be integrated soon.",
  },
  {
    question: 'How do I start using this tool?',
    answer: 'Register, book a demo, and you will get access for a free trial period.',
  },
  {
    question: 'What happens after the free trial ends?',
    answer:
      'You continue under a monthly subscription plan; add-ons are available. If you have a specific request, please contact us.',
  },
  {
    question: "Why might results from a manual search differ from this tool's results?",
    answer:
      'AI search engines personalize answers based on user history, location, and previous behavior. Manual searches reflect your personal context. The tool runs neutral, clean-slate searches, giving objective and consistent results.',
  },
  {
    question: 'For whom is this tool designed?',
    answer:
      'Expert marketers, agencies, and brands working with SEO, content, and AI search visibility.',
  },
];

export const FaqAccordion = ({
  faqs = FAQS,
  showContactBlock = true,
}: {
  faqs?: FaqItem[];
  showContactBlock?: boolean;
}) => {
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set([]));

  const handleToggle = (index: number) => {
    if (openQuestions.has(index)) {
      openQuestions.delete(index);
    } else {
      openQuestions.add(index);
    }
    setOpenQuestions(new Set(openQuestions));
  };

  return (
    <section className="bg-primary py-16 md:py-24" id="faqs">
      <div className="max-w-container mx-auto px-4 md:px-8">
        <div className="reveal mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">FAQs</span>
          <h2 className="text-display-sm text-primary md:text-display-md font-semibold">
            Frequently Asked Questions
          </h2>
          <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
            Everything you need to know about the product and billing.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl md:mt-16">
          <div className="flex flex-col gap-8">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="not-first:border-secondary not-first:-mt-px not-first:border-t not-first:pt-6"
              >
                <h3>
                  <button
                    onClick={() => handleToggle(index)}
                    className="outline-focus-ring flex w-full cursor-pointer items-start justify-between gap-2 rounded-md text-left select-none focus-visible:outline-2 focus-visible:outline-offset-2 md:gap-6"
                  >
                    <span className="text-md text-primary font-semibold">{faq.question}</span>

                    <span
                      aria-hidden="true"
                      className="text-fg-quaternary flex size-6 items-center"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line
                          className={cx(
                            'origin-center rotate-0 transition duration-150 ease-out',
                            openQuestions.has(index) && '-rotate-90'
                          )}
                          x1="12"
                          y1="8"
                          x2="12"
                          y2="16"
                        ></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  className={cx(
                    'grid transition-all duration-300 ease-in-out',
                    openQuestions.has(index)
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pt-1 pr-8 md:pr-12">
                      <div className="text-md text-tertiary">{faq.answer}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showContactBlock && (
          <div className="bg-secondary mt-12 flex flex-col items-center gap-6 rounded-2xl px-6 py-8 text-center md:mt-16 md:gap-8 md:pt-8 md:pb-10">
            <div className="flex items-end -space-x-4">
              <Avatar
                src="https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80"
                alt="Marco Kelly"
                size="lg"
                className="ring-fg-white ring-[1.5px]"
              />
              <Avatar
                src="https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80"
                alt="Amelie Laurent"
                size="xl"
                className="ring-fg-white z-10 ring-[1.5px]"
              />
              <Avatar
                src="https://www.untitledui.com/images/avatars/jaya-willis?fm=webp&q=80"
                alt="Jaya Willis"
                size="lg"
                className="ring-fg-white ring-[1.5px]"
              />
            </div>
            <div>
              <p className="text-primary text-xl font-semibold">Still have questions?</p>
              <p className="text-md text-tertiary mt-2 md:text-lg">
                Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
              </p>
            </div>
            <Button size="xl" onClick={openSupportOnClick}>
              Get in touch
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
