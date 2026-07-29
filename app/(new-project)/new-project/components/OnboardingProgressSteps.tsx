import { Progress } from '@/components/application/progress-steps/progress-steps';
import type { ProgressIconType } from '@/components/application/progress-steps/progress-types';

const DEFAULT_STEPS: ProgressIconType[] = [
  { title: 'Your brand', description: '', status: 'incomplete' },
  { title: 'Prompt groups', description: '', status: 'incomplete' },
  { title: 'Prompts', description: '', status: 'incomplete' },
  { title: 'Competitors', description: '', status: 'incomplete' },
];

export const OnboardingProgressSteps = ({
  currentStep,
  className,
}: {
  currentStep: number;
  className?: string;
}) => {
  const steps: ProgressIconType[] = DEFAULT_STEPS.map((step, index) => ({
    ...step,
    status: index < currentStep ? 'complete' : index === currentStep ? 'current' : 'incomplete',
  }));
  return (
    <Progress.MinimalIconsConnected
      items={steps}
      size="xs"
      orientation="horizontal"
      className={className}
    />
  );
};
