import { withTracing } from '@posthog/ai';
import { getPostHogServer } from '../posthog';
import { createGateway } from 'ai';

export type AIAnalyticsProps = {
  userId?: string;
  userEmail?: string;
  subscriptionName?: string;
  operationId?: string;
  others?: Record<string, unknown>;
};

type PosthogClientOptions = {
  posthogDistinctId?: string;
  posthogTraceId?: string;
  posthogProperties?: Record<string, unknown>;
  posthogPrivacyMode?: boolean;
  posthogGroups?: Record<string, unknown>;
  posthogModelOverride?: string;
  posthogProviderOverride?: string;
  posthogCostOverride?: {
    inputCost: number;
    outputCost: number;
  };
  posthogCaptureImmediate?: boolean;
};

function createPosthogClientOptions(props?: AIAnalyticsProps): PosthogClientOptions {
  return {
    posthogDistinctId: props?.userId,
    posthogProperties: {
      ...(props?.userEmail && { userEmail: props?.userEmail }),
      ...(props?.subscriptionName && { subscriptionName: props?.subscriptionName }),
      ...(props?.operationId && { operationId: props?.operationId }),
      ...props?.others,
    },
  };
}

export const createAiGatewayModel = (modelId: string, aiAnalyticsProps?: AIAnalyticsProps) => {
  const posthog = getPostHogServer();
  const options = createPosthogClientOptions(aiAnalyticsProps);
  const gateway = createGateway();
  const model = gateway(modelId);
  return withTracing(model, posthog, options);
};
