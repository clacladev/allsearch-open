import { GradientTextSpan } from '@/app/(public)/components/GradientText';
import Image from 'next/image';
import { ROUTES } from '@/libs/routes';
import Link from 'next/link';
import { PriceKey } from '@/libs/subscriptions';
import { SUBSCRIPTIONS } from '@/libs/subscriptions';
import { getProductVariantsList, ProductVariant } from '@/libs/lemonsqueezy';
import { CheckCircle } from '@untitledui/icons';

const MOST_POPULAR_PRICE_KEY = PriceKey.Pro;
export const CTA_BUTTON_TEXT = 'Start free';

type PricingCardVariant = 'homepage' | 'subscription';

const PricingCardHighlight = ({
  title,
  color,
}: {
  title: string;
  color: 'primary' | 'secondary';
}) => (
  <>
    <div className="absolute top-0 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2">
      <span
        className={`badge text-${color}-content bg-${color} border border-${color} text-xs font-semibold`}
      >
        {title}
      </span>
    </div>
    <div className={`bg-${color}/20 absolute -inset-px rounded-[9px] border border-${color}`}></div>
  </>
);

const PricingCard = ({
  isUserSubscribed,
  productVariant,
  getActionButton,
  variant,
}: {
  isUserSubscribed: boolean;
  productVariant?: ProductVariant;
  getActionButton?: (priceId: string | undefined) => React.ReactNode;
  variant: PricingCardVariant;
}) => {
  const subscription = productVariant ? SUBSCRIPTIONS[productVariant.priceKey] : undefined;
  if (!subscription) return null;

  const priceKey = productVariant?.priceKey ?? 'free_trial';
  return (
    <div className="relative w-full sm:w-68">
      {isUserSubscribed && variant === 'subscription' ? (
        <PricingCardHighlight title="Current Plan" color="primary" />
      ) : priceKey === MOST_POPULAR_PRICE_KEY && variant === 'homepage' ? (
        <PricingCardHighlight title="Most Popular" color="primary" />
      ) : null}

      <div className={`bg-base-200/50 relative flex h-full flex-col gap-5 rounded-lg p-8`}>
        <div className="flex flex-col justify-between gap-4">
          <Image
            src={`/index/pricing/${priceKey}.jpeg`}
            alt={`${subscription.name} subscription's totem`}
            width={100}
            height={100}
            className="mask mask-squircle aspect-square w-30"
          />
          <div className="flex flex-col">
            <p className="text-lg font-bold">{subscription.name} plan</p>

            <p className="mt-4 text-sm">
              <GradientTextSpan>Best for:</GradientTextSpan>
            </p>
            <p className="text-sm">{subscription.bestFor}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <p className="text-4xl font-bold">{productVariant?.priceFormatted ?? 'Free'}</p>
          {productVariant && (
            <div className="mb-[4px] flex flex-col justify-end">
              <p className="text-base-content/60 text-xs">per</p>
              <p className="text-base-content/60 text-xs">month</p>
            </div>
          )}
        </div>

        {getActionButton ? (
          getActionButton(productVariant?.priceId)
        ) : (
          <Link href={ROUTES.DASHBOARD} className="btn btn-primary mt-4">
            {CTA_BUTTON_TEXT}
          </Link>
        )}

        <div className="mt-1 flex flex-col space-y-2.5">
          <span className="text-base-content/60 text-sm">This includes:</span>
          <ul className="flex-1 space-y-2.5 text-sm leading-relaxed">
            {subscription.marketingFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{feature} </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const PricingCards = async ({
  currentPriceKey,
  getActionButton,
  variant,
}: {
  currentPriceKey?: PriceKey;
  getActionButton?: (priceId: string | undefined) => React.ReactNode;
  variant: PricingCardVariant;
}) => {
  let productVariants: ProductVariant[] = [];

  try {
    productVariants = await getProductVariantsList();
  } catch {}

  return (
    <div className={`relative flex w-full flex-row flex-wrap justify-center gap-6`}>
      <PricingCard
        isUserSubscribed={currentPriceKey === undefined && variant === 'subscription'}
        productVariant={undefined}
        getActionButton={getActionButton}
        variant={variant}
      />
      {productVariants.map((productVariant) => (
        <PricingCard
          key={productVariant.priceKey}
          isUserSubscribed={currentPriceKey === productVariant.priceKey}
          productVariant={productVariant}
          getActionButton={getActionButton}
          variant={variant}
        />
      ))}
    </div>
  );
};
