import { Button } from '@/components/base/buttons/button';
import { ArrowRight, Lightbulb03 } from '@untitledui/icons';

export default function ArticleBottomCta() {
  return (
    <div className="bg-tertiary my-20 rounded-lg p-6">
      <h3 className="mt-0! mb-4 flex items-center gap-2 text-lg font-semibold">
        <Lightbulb03 className="inline h-6 w-6" /> Ready to Transform Your Marketing Research?
      </h3>
      <p className="mb-4">
        Join marketing professionals who&apos;ve accelerated their research process and improved
        campaign performance with real customer insights.
      </p>
      <Button href="/" iconTrailing={<ArrowRight className="h-4 w-4" />}>
        Start Your Research
      </Button>
    </div>
  );
}
