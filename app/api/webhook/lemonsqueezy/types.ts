type LemonSqueezyEventName =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered';

interface LemonSqueezyMeta {
  event_name: LemonSqueezyEventName;
  custom_data: {
    user_id: string;
  };
  test_mode: boolean;
  timestamp: string;
}

interface LemonSqueezySubscriptionAttributes {
  status:
    | 'active'
    | 'cancelled'
    | 'expired'
    | 'on_trial'
    | 'on_grace_period'
    | 'paused'
    | 'past_due';
  status_formatted: string;
  user_email: string;
  user_name: string;
  store_id: number;
  customer_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  order_id: number;
  order_item_id: number;
  trial_ends_at: string | null;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
  urls: {
    customer_portal: string;
    update_payment_method: string;
    customer_portal_update_subscription: string;
  };
  first_subscription_item?: {
    id: number;
    price_id: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    is_usage_based: boolean;
    subscription_id: number;
  };
}

interface LemonSqueezySubscriptionData {
  id: string;
  type: string;
  attributes: LemonSqueezySubscriptionAttributes;
  relationships: Record<string, unknown>;
  links: {
    self: string;
  };
}

export interface LemonSqueezyWebhookPayload {
  meta: LemonSqueezyMeta;
  data: LemonSqueezySubscriptionData;
}
