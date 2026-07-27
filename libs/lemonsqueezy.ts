import {
  createCheckout,
  getCustomer,
  getProduct,
  lemonSqueezySetup,
  listProducts,
} from '@lemonsqueezy/lemonsqueezy.js';
import { PriceKey } from '@/libs/subscriptions';
import { config } from '@/config';
import { formatPrice } from './numberFormatters';

export async function createCheckoutUrl(
  variantId: string,
  redirectUrl: string,
  userId?: string,
  email?: string
): Promise<string> {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
  const { data, error } = await createCheckout(process.env.LEMONSQUEEZY_STORE_ID!, variantId, {
    productOptions: { redirectUrl, enabledVariants: [Number(variantId)] },
    checkoutData: {
      email,
      custom: { userId },
    },
  });
  if (error) throw error;
  return data.data.attributes.url;
}

export async function createCustomerPortalUrl(customerId: string): Promise<string> {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
  const { data, error } = await getCustomer(customerId);
  if (error) throw error;
  if (!data.data.attributes.urls.customer_portal) throw new Error('Customer portal not found');
  return data.data.attributes.urls.customer_portal;
}

export function variantIdToPriceKey(variantId: string | number): PriceKey {
  const { plansIds } = config.lemonsqueezy;
  const vid = String(variantId);
  if (vid === plansIds.starter) return PriceKey.Starter;
  if (vid === plansIds.pro) return PriceKey.Pro;
  throw new Error('Invalid variant id');
}

export type ProductVariant = {
  id: string;
  priceId: string;
  priceKey: PriceKey;
  description: string;
  image: string;
  price: string;
  priceFormatted: string;
};

export async function getProductVariantsList(): Promise<ProductVariant[]> {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
  const { productId, plansIds } = config.lemonsqueezy;
  const response = await getProduct(productId, {
    include: ['variants'],
  });

  if (!response.data) throw new Error('Product not found');
  const product = response.data;
  if (!product.included || !product.included.length) throw new Error('Product variants not found');
  const variants = product.included;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  return Object.values(plansIds).map((planId) => {
    const variant = variants.find((variant) => variant.id === planId);
    if (!variant) throw new Error('Variant not found');
    return {
      id: product.data.id,
      priceId: variant.id,
      priceKey: variantIdToPriceKey(variant.id),
      description: String(variant.attributes.description).replace(/<[^>]*>/g, ''),
      image: product.data.attributes.large_thumb_url,
      price: variant.attributes.price as string,
      priceFormatted: formatPrice(Number(variant.attributes.price), 'USD', locale),
    };
  });
}

export async function getProductsList() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
  const products = await listProducts({
    filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID! },
    include: ['variants'],
  });

  return (products.data?.data ?? [])
    .map((product) => {
      const variantId = product.relationships.variants.data?.[0].id;
      if (!variantId) throw new Error('Variant id not found');

      return {
        id: product.id,
        priceId: variantId,
        priceKey: variantIdToPriceKey(variantId),
        description: product.attributes.description.replace(/<[^>]*>/g, ''),
        image: product.attributes.large_thumb_url,
        price: product.attributes.price,
        priceFormatted: product.attributes.price_formatted.split('/')[0],
      };
    })
    .sort((a, b) => a.price - b.price);
}
