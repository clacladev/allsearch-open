'use client';

import { ROUTES } from '@/libs/routes';
import { useRouter } from 'next/navigation';
import { userSignOut } from '@/libs/database/supabase/client';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { useTheme } from 'next-themes';
import SettingsFormHeader from '../project/[projectId]/settings/[tabId]/components/SettingsFormHeader';
import { SectionLabel } from '@/components/application/section-headers/section-label';
import { LogOut01 } from '@untitledui/icons';

export default function AccountSettings({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const { theme } = useTheme();

  const onSignOut = async () => {
    await userSignOut();
    router.push(ROUTES.HOME);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col gap-5">
        <SettingsFormHeader description="All the settings available for this account." />

        {/* <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title="Subscription"
            description="Manage your billing and subscription."
          />

          <div className="flex w-max flex-col gap-4">
            <Button color="secondary" href={ROUTES.SUBSCRIPTION}>
              Manage subscription
            </Button>
          </div>
        </div> */}

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title="Theme"
            description={
              <>
                Your current theme is:{' '}
                <span className="font-semibold">
                  {theme === undefined || theme === 'undefined' ? 'system' : theme}
                </span>
              </>
            }
          />

          <div className="flex w-max flex-col gap-4">
            <ThemeToggleButton color="secondary" />
          </div>
        </div>

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title="Account details"
            description="This is the account you are currently logged in with."
          />

          <div className="flex w-max flex-col gap-4">
            <Input value={userEmail} isDisabled />
          </div>
        </div>

        <hr className="bg-border-secondary h-px w-full border-none" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-16">
          <SectionLabel.Root
            size="sm"
            title="Sign out"
            description="This will sign you out of your account."
          />

          <div className="flex w-max flex-col gap-4">
            <Button
              color="secondary-destructive"
              onClick={onSignOut}
              size="md"
              iconLeading={LogOut01}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
