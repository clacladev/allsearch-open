import { FaceHappy, FaceSmile, FaceNeutral, FaceFrown, FaceSad } from '@untitledui/icons';
import { Tooltip } from '@/app/(private)/components/Tooltip';

type SentimentInfo = {
  label: string;
  icon: typeof FaceHappy;
  color: string;
};

function getSentimentInfo(score: number): SentimentInfo {
  if (score >= 1.5)
    return { label: 'Very Positive', icon: FaceHappy, color: 'text-success-primary' };
  if (score >= 0.5) return { label: 'Positive', icon: FaceSmile, color: 'text-success-tertiary' };
  if (score > -0.5) return { label: 'Neutral', icon: FaceNeutral, color: 'text-tertiary' };
  if (score > -1.5) return { label: 'Negative', icon: FaceFrown, color: 'text-warning-primary' };
  return { label: 'Very Negative', icon: FaceSad, color: 'text-error-primary' };
}

export function SentimentIcon({
  score,
  size = 14,
  tooltipVariant = 'short',
}: {
  score: number | undefined;
  size?: number;
  tooltipVariant?: 'short' | 'long';
}) {
  if (score === undefined) return null;

  const { label, icon: Icon, color } = getSentimentInfo(score);
  const tooltipTitle =
    tooltipVariant === 'long' ? `Your brand's sentiment is ${label.toLowerCase()}` : label;

  return (
    <Tooltip title={tooltipTitle}>
      <Icon size={size} className={color} />
    </Tooltip>
  );
}

export function getSentimentLabel(score: number): string {
  return getSentimentInfo(score).label;
}
