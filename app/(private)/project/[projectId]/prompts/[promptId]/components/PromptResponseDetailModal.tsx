import React from 'react';
import { DialogTrigger as AriaDialogTrigger } from 'react-aria-components';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { CloseButton } from '@/components/base/buttons/close-button';
import { PromptResponseContent } from '../types';
import { SourceItem } from '@/libs/database/Sources/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { BrandPositionBadge } from '../../../sources/components/BrandPositionBadge';
import { ChatbotLogoImage } from '../../../components/ChatbotLogoImage';
import { BrandsIconsStackWithTooltip } from '../../../sources/components/BrandsIconsStack';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBrandVariations } from '@/libs/utils/brandIdsRanking';
import { SentimentIcon } from '../../../components/SentimentIcon';
import { SentimentScale } from './SentimentScale';

export function PromptResponseDetailModal({
  isOpen,
  setIsOpen,
  promptName,
  promptResponse,
  project,
  competitors,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  promptName: string;
  promptResponse: PromptResponseContent | undefined;
  project: ProjectRow;
  competitors: CompetitorRow[];
}) {
  if (!promptResponse) return null;

  const citedSources = promptResponse.sources.filter((s) => s.isCited);
  const usedSources = promptResponse.sources.filter((s) => !s.isCited);

  const highlights = getBrandVariations(project.name, project.aliases, project.hostname);
  competitors.forEach((competitor) => {
    highlights.push(
      ...getBrandVariations(competitor.name, competitor.aliases, competitor.hostname)
    );
  });

  // Defines a map of brand id -> brand name, aliases, hostname
  const brandsMap = new Map<string, string[]>();
  brandsMap.set(project.id, getBrandVariations(project.name, project.aliases, project.hostname));
  competitors.forEach((competitor) => {
    brandsMap.set(
      competitor.id,
      getBrandVariations(competitor.name, competitor.aliases, competitor.hostname)
    );
  });

  return (
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalOverlay isDismissable>
        <Modal className="max-w-5xl">
          <Dialog>
            <div className="bg-primary relative flex w-full flex-col overflow-hidden rounded-2xl shadow-xl sm:flex-row">
              <CloseButton
                onClick={() => setIsOpen(false)}
                theme="light"
                size="lg"
                className="absolute top-3 right-3 z-10"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6 pr-4 sm:max-h-[80vh]">
                <div className="flex flex-col gap-1">
                  <p className="text-tertiary text-xs font-semibold tracking-wide uppercase">
                    Prompt
                  </p>
                  <h2 className="text-primary text-lg font-semibold">{promptName}</h2>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-tertiary text-xs font-semibold tracking-wide uppercase">
                    Response
                  </p>
                  <div className="prose prose-sm text-secondary max-w-none">
                    <MarkdownResponseText
                      text={promptResponse.text}
                      highlights={highlights}
                      chatbotId={promptResponse.chatbotId}
                      sources={promptResponse.sources}
                    />
                  </div>
                </div>
              </div>

              <div className="border-border-secondary flex w-full shrink-0 flex-col overflow-y-auto border-t p-6 sm:max-h-[80vh] sm:w-72 sm:border-t-0 sm:border-l">
                <div className="flex items-center justify-between pr-8">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ChatbotLogoImage chatbotId={promptResponse.chatbotId} />
                    <BrandPositionBadge projectIdRank={promptResponse.projectIdRank} />
                    <SentimentIcon score={promptResponse.sentiment?.[project.id]} tooltipVariant="long" />
                  </div>
                  <BrandsIconsStackWithTooltip
                    brandIdsRanking={promptResponse.brandIdsRanking}
                    competitors={competitors}
                    project={project}
                  />
                </div>

                {promptResponse.sentiment &&
                  Object.keys(promptResponse.sentiment).length > 0 && (
                    <>
                      <hr
                        className="bg-border-secondary my-4 h-px w-full border-none"
                        aria-hidden="true"
                      />
                      <SentimentScale
                        sentiment={promptResponse.sentiment}
                        project={project}
                        competitors={competitors}
                      />
                    </>
                  )}

                <hr
                  className="bg-border-secondary my-4 h-px w-full border-none"
                  aria-hidden="true"
                />

                <div className="divide-border-secondary flex flex-col divide-y">
                  {!!citedSources.length && (
                    <div className="py-4 first:pt-0 last:pb-0">
                      <SourcesList title="Cited sources" sources={citedSources} />
                    </div>
                  )}
                  {!!usedSources.length && (
                    <div className="py-4 first:pt-0 last:pb-0">
                      <SourcesList title="Used sources" sources={usedSources} />
                    </div>
                  )}
                  {!citedSources.length && !usedSources.length && (
                    <p className="text-tertiary text-sm">No sources available.</p>
                  )}
                </div>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </AriaDialogTrigger>
  );
}

function processPerplexityCitations(
  text: string,
  sources: SourceItem[]
): string {
  // Replace [0], [1], [2], etc. with markdown links to the corresponding sources
  return text.replace(/\[(\d+)\]/g, (match, index) => {
    const source = sources[index];

    if (source?.url) {
      return ` [${index}](${source.url})`;
    }

    // If source doesn't exist, return the original match
    return match;
  });
}

const MarkdownResponseText = ({
  text,
  highlights,
  chatbotId,
  sources,
}: {
  text: string;
  highlights?: string[];
  chatbotId: string;
  sources: SourceItem[];
}) => {
  const processedText =
    chatbotId === 'perplexity' ? processPerplexityCitations(text, sources) : text;

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer nofollow">
            {highlightChildren(children, highlights)}
          </a>
        ),
        p: ({ children, ...props }) => <p {...props}>{highlightChildren(children, highlights)}</p>,
        li: ({ children, ...props }) => (
          <li {...props}>{highlightChildren(children, highlights)}</li>
        ),
        td: ({ children, ...props }) => (
          <td {...props}>{highlightChildren(children, highlights)}</td>
        ),
        th: ({ children, ...props }) => (
          <th {...props}>{highlightChildren(children, highlights)}</th>
        ),
        strong: ({ children, ...props }) => (
          <strong {...props}>{highlightChildren(children, highlights)}</strong>
        ),
        em: ({ children, ...props }) => (
          <em {...props}>{highlightChildren(children, highlights)}</em>
        ),
      }}
    >
      {processedText}
    </Markdown>
  );
};

function highlightChildren(children: React.ReactNode, keywords?: string[]): React.ReactNode {
  if (!keywords?.length) return children;

  const pattern = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      const parts = child.split(regex);
      if (parts.length === 1) return child;
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="dark:bg-brand-600 bg-brand-300 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props?.children) {
      return React.cloneElement(child, {}, highlightChildren(child.props.children, keywords));
    }
    return child;
  });
}

const SourcesList = ({
  title,
  sources,
}: {
  title: string;
  sources: SourceItem[];
}) => (
  <div className="flex flex-col gap-2">
    <p className="text-tertiary text-xs font-medium">{title}</p>
    <ul className="flex flex-col gap-2.5">
      {sources.map((source) => (
        <li key={source.cleanUrl}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group flex min-w-0 flex-col"
          >
            {source.title && (
              <span className="text-primary group-hover:text-brand-secondary truncate text-sm font-medium">
                {source.title}
              </span>
            )}
            <span className="text-tertiary truncate text-xs">{source.cleanUrl}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
);
