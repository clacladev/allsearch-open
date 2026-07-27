'use client';

import { Tabs } from '@/components/application/tabs/tabs';
import { Badge } from '@/components/base/badges/badges';
import { cx } from '@/utils/cx';
import { CheckCircle } from '@untitledui/icons';
import { Key, ReactNode, useState } from 'react';
import { CtaButton } from './Buttons';
import { PriceKey, SUBSCRIPTIONS, SUBSCRIPTIONS_NAME } from '@/libs/subscriptions';
import { config } from '@/config';
import {
  ChatbotLogoImage,
  supportedChatbotIds,
} from '@/app/(private)/project/[projectId]/components/ChatbotLogoImage';

const SUPPORTED_CHATBOTS_LOGOS = 'SUPPORTED_CHATBOTS_LOGOS';

const AiPlatformLogos = () => (
  <span className="inline-flex items-center gap-1.5 align-middle">
    {supportedChatbotIds.map((chatbotId) => (
      <ChatbotLogoImage key={chatbotId} chatbotId={chatbotId} className="size-4" />
    ))}
  </span>
);

function renderFeature(feature: string): ReactNode {
  if (feature.includes(SUPPORTED_CHATBOTS_LOGOS)) {
    const beforeToken = feature.substring(0, feature.indexOf(SUPPORTED_CHATBOTS_LOGOS));
    const afterToken = feature.substring(
      feature.indexOf(SUPPORTED_CHATBOTS_LOGOS) + SUPPORTED_CHATBOTS_LOGOS.length
    );
    return (
      <span className="inline-flex items-center gap-1.5">
        {beforeToken}
        <AiPlatformLogos />
        {afterToken}
      </span>
    );
  }
  return feature;
}

export type PricingPlan = {
  priceKey: string;
  title: string;
  description?: string;
  badge?: string;
  priceMonth: string;
  priceYear: string;
  isEnterprise: boolean;
  features: string[];
  cta: 'get-started' | 'get-quote';
};

const plans: PricingPlan[] = [
  {
    priceKey: PriceKey.Starter,
    title: SUBSCRIPTIONS_NAME[PriceKey.Starter],
    priceMonth: '$99',
    priceYear: '$999',
    isEnterprise: false,
    description: 'Perfect for small agencies getting started with AI SEO.',
    features: SUBSCRIPTIONS[PriceKey.Starter].marketingFeatures,
    cta: 'get-started',
  },
  {
    priceKey: PriceKey.Pro,
    title: SUBSCRIPTIONS_NAME[PriceKey.Pro],
    badge: 'Best Seller',
    priceMonth: '$299',
    priceYear: '$2,999',
    isEnterprise: false,
    description: 'Everything you need to manage AI SEO across multiple client accounts.',
    features: SUBSCRIPTIONS[PriceKey.Pro].marketingFeatures,
    cta: 'get-started',
  },
  {
    priceKey: 'enterprise',
    title: 'Enterprise',
    priceMonth: 'Custom',
    priceYear: 'Custom',
    isEnterprise: true,
    description: 'Built for large agencies managing many clients at scale.',
    features: [
      'AEO content strategy',
      'Unlimited articles per month',
      'Custom number of prompts',
      'Custom number of platforms',
      'Daily, weekly, monthly tracking',
      'Custom number of brands monitored',
      'Reporting integrations',
      'Custom onboarding',
      'Priority & dedicated support',
    ],
    cta: 'get-quote',
  },
];

export type PricingOccurrenceId = 'monthly' | 'yearly';
type PricingOccurrence = { id: PricingOccurrenceId; label: string };

const PRICING_OCCURRENCE_TABS: PricingOccurrence[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export const PricingSection = ({ className }: { className?: string }) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState<Key>('monthly');

  return (
    <section className={cx('bg-primary py-16 md:py-24', className)} id="pricing">
      <div className="max-w-container mx-auto px-4 md:px-8">
        <div className="reveal mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">Pricing</span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
            Choose the plan that fits your brand&apos;s AI search growth.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          {/* <NativeSelect
            aria-label="Tabs"
            value={selectedTabIndex as string}
            onChange={(event) => setSelectedTabIndex(event.target.value)}
            options={PRICING_OCCURRENCE_TABS.map((tab) => ({ label: tab.label, value: tab.id }))}
            className="w-80 md:hidden"
          /> */}
          <Tabs
            selectedKey={selectedTabIndex as PricingOccurrenceId}
            onSelectionChange={setSelectedTabIndex}
            className="w-max"
          >
            <Tabs.List type="button-border" items={PRICING_OCCURRENCE_TABS}>
              {(tab) => <Tabs.Item {...tab} />}
            </Tabs.List>
          </Tabs>
        </div>

        <div className="reveal mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.title}
              plan={plan}
              priceOccurrenceId={selectedTabIndex as PricingOccurrenceId}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export const PricingCard = ({
  plan,
  priceOccurrenceId,
  className,
}: {
  plan: PricingPlan;
  priceOccurrenceId: PricingOccurrenceId;
  className?: string;
}) => (
  <div
    key={plan.title}
    className={cx(
      'bg-primary flex flex-col overflow-hidden rounded-2xl shadow-lg ring-1',
      plan.badge
        ? 'ring-brand-solid/40 ring-2 shadow-xl'
        : 'ring-secondary_alt',
      className
    )}
  >
    <div className="flex flex-col p-6 pb-8 md:p-8">
      <div className="flex justify-between">
        <span className="text-tertiary text-lg font-semibold">{plan.title}</span>
        {plan.badge && (
          <Badge size="lg" type="pill-color" color="brand">
            {plan.badge}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-end gap-1">
        <p className="text-display-lg text-primary md:text-display-xl font-semibold">
          {priceOccurrenceId === 'monthly' ? plan.priceMonth : plan.priceYear}
        </p>
        {!plan.isEnterprise && (
          <span className="text-md text-tertiary pb-2 font-medium">
            {priceOccurrenceId === 'monthly' ? 'per month' : 'per year'}
          </span>
        )}
      </div>

      <p className="text-md text-tertiary mt-4">{plan.description}</p>
    </div>

    <div className="ring-secondary flex flex-1 flex-col gap-3 px-6 pt-2 pb-6 md:px-8">
      <p className="text-md text-primary font-semibold">What&apos;s included</p>
      <ul className="flex flex-col gap-4">
        {plan.features.map((feat) => (
          <CheckItemText
            key={feat}
            iconStyle="outlined"
            color="primary"
            text={renderFeature(feat)}
          />
        ))}
      </ul>
    </div>

    <div className="flex flex-col gap-3 self-stretch p-6 pb-8 md:p-8">
      {plan.cta === 'get-started' ? (
        <CtaButton size="xl" data-ref="pricing-business-plan">
          Start Free Trial
        </CtaButton>
      ) : (
        <CtaButton
          size="xl"
          color="secondary"
          href={`mailto:${config.email.supportEmail}?subject=Enterprise%20plan%20interest`}
          data-ref="pricing-enterprise-plan"
        >
          Chat with Sales
        </CtaButton>
      )}
    </div>
  </div>
);

export const CheckItemText = (props: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: ReactNode;
  color?: 'primary' | 'success';
  iconStyle?: 'outlined' | 'contained' | 'filled';
  textClassName?: string;
}) => {
  const { text, color, size, iconStyle = 'contained' } = props;

  return (
    <li className="flex gap-3">
      {iconStyle === 'contained' && (
        <div
          className={cx(
            'flex shrink-0 items-center justify-center rounded-full',
            color === 'success'
              ? 'bg-success-secondary text-featured-icon-light-fg-success'
              : 'bg-brand-primary text-featured-icon-light-fg-brand',
            size === 'lg' ? 'size-7 md:h-8 md:w-8' : size === 'md' ? 'size-7' : 'size-6'
          )}
        >
          <svg
            width={size === 'lg' ? 16 : size === 'md' ? 15 : 13}
            height={size === 'lg' ? 14 : size === 'md' ? 13 : 11}
            viewBox="0 0 13 11"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}

      {iconStyle === 'filled' && (
        <div className="bg-brand-solid flex size-6 shrink-0 items-center justify-center rounded-full text-white">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1.5 4L4.5 7L10.5 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {iconStyle === 'outlined' && (
        <CheckCircle
          className={cx(
            'shrink-0',
            color === 'success' ? 'text-fg-success-primary' : 'text-fg-brand-primary',
            size === 'lg' ? 'size-7 md:h-8 md:w-8' : size === 'md' ? 'size-7' : 'size-6'
          )}
        />
      )}

      <span
        className={cx(
          'text-tertiary',
          size === 'lg'
            ? 'pt-0.5 text-lg md:pt-0'
            : size === 'md'
              ? 'text-md pt-0.5 md:pt-0 md:text-lg'
              : 'text-md',
          iconStyle === 'filled' && 'text-brand-secondary',
          props.textClassName
        )}
      >
        {text}
      </span>
    </li>
  );
};
