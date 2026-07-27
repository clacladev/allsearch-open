'use client';

import { appFetch } from '@/hooks/appFetch';
import { ROUTES } from '@/libs/routes';
import { useState } from 'react';

export default function SubscribeButton({ priceId }: { priceId: string }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onClick = async () => {
    setIsLoading(true);

    try {
      const { url } = await appFetch<{ url: string }>(
        ROUTES.API.LEMONSQUEEZY_CREATE_CHECKOUT,
        {
          method: 'POST',
          body: JSON.stringify({
            priceId,
            redirectUrl: window.location.href,
          }),
        },
        'Failed to create checkout'
      );
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <button className="btn btn-primary" onClick={onClick} disabled={isLoading}>
      Subscribe {isLoading && <span className="loading loading-spinner loading-xs ml-2" />}
    </button>
  );
}
