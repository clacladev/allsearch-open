import { PricingCards } from '@/app/(public)/components/PricingCards';
import ManageSubscriptionButton from './ManageSubscriptionButton';
import SubscribeButton from './SubscribeButton';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import { getUserProfileRowWithId } from '@/libs/database/UserProfiles/queries';
import { SUBSCRIPTIONS_NAME } from '@/libs/subscriptions';
import Header from '../components/Header';
import { MainContainer } from '../components/Containers';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Subscription' };

export default async function SubscriptionPage() {
  const user = await getUserOrThrow();
  const userProfile = await getUserProfileRowWithId(user.id);
  if (!userProfile) throw new Error('No user profile found for user: ' + user.id);

  const isSubscribed = !!userProfile.price_key;

  return (
    <MainContainer>
      <Header text="Subscription" />

      <div className="space-y-8">
        <section className="space-y-8">
          <div className="stats bg-base-200/50 border-base-200 stats-vertical md:stats-horizontal w-full border">
            <div className="stat place-items-center">
              <div className="stat-title">Current plan</div>
              <div className="stat-value">
                {isSubscribed ? SUBSCRIPTIONS_NAME[userProfile.price_key!] : 'Free'}
              </div>

              <div className="stat-actions h-8">
                {isSubscribed && (
                  <ManageSubscriptionButton
                    title="Manage subscription"
                    style="btn-neutral"
                    className="btn-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {!!userProfile.customer_id && !!userProfile.scheduled_cancellation && (
          <section className="space-y-8">
            <div className="alert alert-warning flex flex-col items-center justify-center gap-2 md:flex-row">
              <p className="text-sm/6">Your subscription is scheduled for cancellation.</p>
              <ManageSubscriptionButton
                title="Renew subscription"
                style="btn-neutral"
                className="btn-sm"
              />
            </div>
          </section>
        )}

        {!!userProfile.customer_id && !!userProfile.is_unpaid && (
          <section className="space-y-8">
            <div className="alert alert-warning flex flex-col items-center justify-center gap-2 md:flex-row">
              <p className="text-sm/6">
                Your subscription has been disabled because your payment failed.
              </p>
              <ManageSubscriptionButton
                title="Fix payment"
                style="btn-neutral"
                className="btn-sm"
              />
            </div>
          </section>
        )}

        {!isSubscribed && userProfile.customer_id && (
          <section className="space-y-8">
            <div className="alert flex flex-col items-center justify-center gap-2 md:flex-row">
              <p className="text-sm/6">You have no active subscription at the moment.</p>
              <ManageSubscriptionButton
                title="Check billing history"
                style="btn-neutral"
                className="btn-sm"
              />
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-center text-xl font-semibold">
            {isSubscribed ? 'Switch your subscription' : 'Select a subscription'}
          </h2>
        </section>

        <section className="mt-8">
          <PricingCards
            currentPriceKey={userProfile.price_key ?? undefined}
            getActionButton={(priceId) =>
              priceId === userProfile.price_id ? (
                <ManageSubscriptionButton title="Manage" style="btn-neutral" />
              ) : isSubscribed ? (
                <ManageSubscriptionButton title="Switch" />
              ) : priceId ? (
                <SubscribeButton priceId={priceId} />
              ) : null
            }
            variant="subscription"
          />
        </section>
      </div>
    </MainContainer>
  );
}
