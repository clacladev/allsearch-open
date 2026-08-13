'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/libs/utils/cn';
import { CHATBOT_DISPLAY_LABELS } from '@/libs/database/shared/ChatbotId';
import { CollectionRunItemStatus } from '@/libs/database/CollectionRunItems/types';
import {
  CollectionRunProgress as CollectionRunProgressType,
  formatCollectionRunProgressSummary,
  getCollectionRunProgressCountLabel,
  getCollectionRunProgressPercentage,
} from '@/libs/collection/progress';

type Props = {
  progress: CollectionRunProgressType;
  isReconnecting: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
  variant?: 'panel' | 'bar';
};

const STATUS_DOT_CLASS: Record<CollectionRunItemStatus, string> = {
  pending: 'bg-gray-400',
  running: 'bg-blue-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400',
};

export function CollectionRunProgress({
  progress,
  isReconnecting,
  onCancel,
  isCancelling,
  variant = 'panel',
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const isBar = variant === 'bar';
  const showList = !isBar || showDetails;

  return (
    <div data-testid="collection-run-progress" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          {progress.isTerminal ? (
            <span data-testid="collection-run-progress-summary" className="text-sm font-medium">
              {formatCollectionRunProgressSummary(progress)}
            </span>
          ) : (
            <span data-testid="collection-run-progress-count" className="text-sm font-medium">
              {getCollectionRunProgressCountLabel(progress)}
            </span>
          )}
          {isReconnecting && (
            <span className="text-tertiary flex items-center gap-1.5 text-xs">
              <Spinner className="size-3" />
              Reconnecting…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isBar && (
            <Button size="sm" variant="ghost" onClick={() => setShowDetails((prev) => !prev)}>
              {showDetails ? 'Hide details' : 'Details'}
            </Button>
          )}
          {onCancel && !progress.isTerminal && (
            <Button
              size="sm"
              variant="secondary"
              data-testid="collection-run-progress-cancel"
              disabled={isCancelling}
              onClick={onCancel}
            >
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>

      <Progress value={getCollectionRunProgressPercentage(progress)} />

      {showList && (
        <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
          {progress.projects.map((project) => (
            <div key={project.projectId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{project.projectName}</span>
                <span className="text-tertiary text-xs">
                  {getCollectionRunProgressCountLabel(project)}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {project.prompts.map((prompt) => (
                  <div key={prompt.promptId} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-secondary text-sm">{prompt.promptName}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {prompt.chatbots.map((chatbot) => (
                        // Wrapped so the compact shadcn Badge can keep its status label. The tooltip is the
                        // only place a dropped item says WHY it was dropped — an ungrounded Google
                        // answer (issue 25) is not the same failure as a rate limit.
                        <span
                          key={chatbot.chatbotId}
                          title={chatbot.error ?? undefined}
                          data-testid={`collection-run-progress-chatbot-${chatbot.chatbotId}`}
                        >
                          <Badge variant="outline">
                            <span
                              className={cn('size-1.5 rounded-full', STATUS_DOT_CLASS[chatbot.status])}
                              aria-hidden="true"
                            />
                            {CHATBOT_DISPLAY_LABELS[chatbot.chatbotId]} · {chatbot.status}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
