import Link from 'next/link';
import { ArrowRight, FilePenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RouteHelper } from '@/libs/routes';

export const CreateArticleOutlineCTA = ({
  projectId,
  promptId,
  opportunityId,
  startDate,
  endDate,
}: {
  projectId: string;
  promptId: string;
  opportunityId?: string;
  startDate?: string;
  endDate?: string;
}) => (
  <div className="border-brand bg-brand-primary_alt rounded-xl border p-5">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="bg-brand-solid text-primary_on-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FilePenLine className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-md text-primary font-semibold">Create an article outline</p>
          <p className="text-tertiary text-sm">
            Generate an outline for a new article to improve your brand visibility for this prompt.
          </p>
        </div>
      </div>
      <Button
        render={
          <Link
            href={RouteHelper.Project.getPromptNewArticle(
              projectId,
              promptId,
              opportunityId,
              undefined,
              startDate,
              endDate
            )}
          />
        }
        size="lg"
      >
        Generate outline
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  </div>
);
