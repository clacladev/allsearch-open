import { Button, Props } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import { ROUTES } from '@/libs/routes';

const CTA_TEXT = 'Start Free Trial';

export const CtaButton = (props: Props) => (
  <Button href={ROUTES.DASHBOARD} size="xl" {...props}>
    {props.children ?? CTA_TEXT}
  </Button>
);

export const HomepageCtaBlock = ({ className, ...rest }: Props) => (
  <div className={cx('flex flex-col items-center gap-2', className)}>
    <CtaButton {...rest} />
    <div className="text-quaternary mx-0.5 text-xs">No Card Required</div>
  </div>
);
