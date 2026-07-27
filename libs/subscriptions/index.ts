export const TRIAL_DURATION_DAYS = 7;
export const MAX_PROMPTS_DURING_TRIAL = 25;

export enum PriceKey {
  Starter = 'starter_subscription',
  Pro = 'pro_subscription',
}

type SubscriptionLimitations = {
  priceKey: string | undefined;
  maxPrompts: number;
  maxArticlesPerMonth: number;
};

export const SUBSCRIPTIONS_NAME: Record<string, string> = {
  [PriceKey.Starter]: 'Starter',
  [PriceKey.Pro]: 'Agency Pro',
};

export const SUBSCRIPTIONS_LIMITATIONS: Record<string, SubscriptionLimitations> = {
  [PriceKey.Starter]: {
    priceKey: PriceKey.Starter,
    maxPrompts: 25,
    maxArticlesPerMonth: 10,
  },
  [PriceKey.Pro]: {
    priceKey: PriceKey.Pro,
    maxPrompts: 100,
    maxArticlesPerMonth: 30,
  },
};

export type SubscriptionDetails = {
  priceKey: PriceKey;
  name: string;
  marketingFeatures: string[];
  bestFor: string;
};

export const SUBSCRIPTIONS: Record<PriceKey, SubscriptionDetails> = {
  [PriceKey.Starter]: {
    priceKey: PriceKey.Starter,
    name: SUBSCRIPTIONS_NAME[PriceKey.Starter],
    marketingFeatures: [
      'AEO content strategy',
      `Up to ${SUBSCRIPTIONS_LIMITATIONS[PriceKey.Starter].maxArticlesPerMonth} articles per month`,
      `Up to ${SUBSCRIPTIONS_LIMITATIONS[PriceKey.Starter].maxPrompts} prompts`,
      '1 AI platform SUPPORTED_CHATBOTS_LOGOS',
      'Daily, weekly, monthly tracking',
      'Up to 5 competitors',
      'Email support',
    ],
    bestFor: 'Marketers, small agencies, entrepreneurs.',
  },
  [PriceKey.Pro]: {
    priceKey: PriceKey.Pro,
    name: SUBSCRIPTIONS_NAME[PriceKey.Pro],
    marketingFeatures: [
      'AEO content strategy',
      `Up to ${SUBSCRIPTIONS_LIMITATIONS[PriceKey.Pro].maxArticlesPerMonth} articles per month`,
      `Up to ${SUBSCRIPTIONS_LIMITATIONS[PriceKey.Pro].maxPrompts} prompts`,
      '3 AI platforms SUPPORTED_CHATBOTS_LOGOS',
      'Daily, weekly, monthly tracking',
      'Unlimited competitors',
      'Email & Slack support',
    ],
    bestFor: 'Marketers, small agencies, entrepreneurs.',
  },
};
