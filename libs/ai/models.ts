import { createGateway } from 'ai';

/**
 * Call-site metadata that used to be forwarded to PostHog's LLM tracing. The
 * telemetry is gone, but the shape is kept so the ~14 call sites do not have to
 * change twice: issue 07 replaces the gateway with direct provider clients and
 * will decide what, if anything, this becomes.
 */
export type AIAnalyticsProps = {
  userId?: string;
  userEmail?: string;
  subscriptionName?: string;
  operationId?: string;
  others?: Record<string, unknown>;
};

export const createAiGatewayModel = (modelId: string, _aiAnalyticsProps?: AIAnalyticsProps) => {
  const gateway = createGateway();
  return gateway(modelId);
};
