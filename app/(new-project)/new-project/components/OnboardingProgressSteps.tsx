import { Check } from 'lucide-react';
import { cn } from '@/libs/utils/cn';

const DEFAULT_STEPS = ['Your brand', 'Prompt groups', 'Prompts', 'Competitors'];

export const OnboardingProgressSteps = ({
  currentStep,
  className,
}: {
  currentStep: number;
  className?: string;
}) => {
  return (
    <ol
      aria-label="Onboarding progress"
      className={cn('flex w-full items-center justify-center', className)}
    >
      {DEFAULT_STEPS.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <li
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-center"
          >
            <span className="sr-only">
              {`${step}: ${isCurrent ? 'current step' : isComplete ? 'complete' : 'upcoming step'}`}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'z-10 flex size-4 items-center justify-center rounded-full',
                isComplete || isCurrent ? 'bg-shadcn-primary' : 'ring-1.5 opacity-50 ring-inset',
                isCurrent && 'ring-ring ring-offset-background ring-2 ring-offset-2'
              )}
            >
              {isComplete ? (
                <Check aria-hidden="true" className="text-shadcn-primary-foreground size-2" />
              ) : (
                <span className="bg-muted-foreground size-1 rounded-full" />
              )}
            </span>
            {index < DEFAULT_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn('h-0.5 w-20', isComplete ? 'bg-shadcn-primary' : 'bg-muted')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};
