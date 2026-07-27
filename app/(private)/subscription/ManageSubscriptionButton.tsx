'use client';

import { appFetch } from '@/hooks/appFetch';
import { ROUTES } from '@/libs/routes';
import { useState } from 'react';

export default function ManageSubscriptionButton({
  title,
  style = 'btn-primary',
  className,
}: {
  title: string;
  style?: 'btn-primary' | 'btn-neutral' | 'btn-error';
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    setIsLoading(true);

    try {
      const { url } = await appFetch<{ url: string }>(
        ROUTES.API.LEMONSQUEEZY_CREATE_PORTAL,
        {
          method: 'POST',
          body: JSON.stringify({ returnUrl: window.location.href }),
        },
        'Failed to create portal'
      );
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <button className={`btn ${style} ${className}`} onClick={onClick} disabled={isLoading}>
      {title}
      {isLoading && <span className="loading loading-spinner loading-xs ml-2" />}
    </button>
  );
}
