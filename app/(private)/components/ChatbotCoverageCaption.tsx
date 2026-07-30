import { CHATBOT_DISPLAY_LABELS, type ChatbotId } from '@/libs/database/shared/ChatbotId';
import { cx } from '@/utils/cx';

/** Oxford-comma-free "A, B and C" join, matching this codebase's other list-of-labels copy. */
function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/**
 * Pure copy for the coverage caption issue 09 requires on every figure that aggregates across
 * Chatbots (e.g. a visibility percentage): "enabling a Chatbot changes the denominator... the UI
 * must state which Chatbots a figure covers." Exported separately from the component for unit
 * testing without a render step (this repo has no component-testing infrastructure).
 */
export function getChatbotCoverageCaption(enabledChatbotIds: ChatbotId[]): string {
  if (enabledChatbotIds.length === 0) {
    return 'No Chatbots enabled — add a key or turn one on in Settings to see data here.';
  }
  const labels = enabledChatbotIds.map((id) => CHATBOT_DISPLAY_LABELS[id]);
  return `Based on ${joinLabels(labels)}.`;
}

/** Caption naming the Chatbots a headline aggregate figure covers. Deliberately just this one
 * figure per page (issue 09 scopes this to headline aggregates, not every table cell) — apply it
 * next to the number, not as a page-wide banner. */
export function ChatbotCoverageCaption({
  enabledChatbotIds,
  className,
}: {
  enabledChatbotIds: ChatbotId[];
  className?: string;
}) {
  return (
    <span className={cx('text-tertiary text-xs', className)}>
      {getChatbotCoverageCaption(enabledChatbotIds)}
    </span>
  );
}
