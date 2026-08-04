'use client';

import { useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { ProgressBarBase } from '@/components/base/progress-indicators/progress-indicators';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
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

const STATUS_BADGE_COLOR: Record<CollectionRunItemStatus, 'gray' | 'blue' | 'success' | 'error'> = {
  pending: 'gray',
  running: 'blue',
  completed: 'success',
  failed: 'error',
  cancelled: 'gray',
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
    <div data-testid={isBar ? 'collection-run-progress' : undefined} className="flex flex-col gap-3">
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
              <LoadingIndicator size="xxs" />
              Reconnecting…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isBar && (
            <Button size="sm" color="tertiary" onClick={() => setShowDetails((prev) => !prev)}>
              {showDetails ? 'Hide details' : 'Details'}
            </Button>
          )}
          {onCancel && !progress.isTerminal && (
            <Button
              size="sm"
              color="secondary"
              data-testid="collection-run-progress-cancel"
              isDisabled={isCancelling}
              onClick={onCancel}
            >
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>

      <ProgressBarBase value={getCollectionRunProgressPercentage(progress)} />

      {showList && (
        <div className="flex flex-col gap-4">
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
                        <BadgeWithDot
                          key={chatbot.chatbotId}
                          size="sm"
                          color={STATUS_BADGE_COLOR[chatbot.status]}
                        >
                          {CHATBOT_DISPLAY_LABELS[chatbot.chatbotId]}
                        </BadgeWithDot>
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
