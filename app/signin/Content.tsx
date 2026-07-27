'use client';

import { Button } from '@/components/base/buttons/button';
import { SocialButton } from '@/components/base/buttons/social-button';
import { Input } from '@/components/base/input/input';
import { BackgroundPattern } from '@/components/shared-assets/background-patterns';
import { ROUTES } from '@/libs/routes';
import {
  userSignInWithGoogle,
  userSignInWithOTP,
  userVerifyWithOTP,
} from '@/libs/database/supabase/client';
import { showErrorAlertToast, showSuccessAlertToast } from '@/app/(public)/components/Alerts';
import { useState } from 'react';
import { isPreviewEnv } from '@/libs/env';
import { Form } from '@/components/base/form/form';
import { PinInput } from '@/components/base/pin-input/pin-input';
import Link from 'next/link';
import { AppLogoMinimal } from '@/app/(public)/components/AppLogo';

export const Content = () => {
  const [email, setEmail] = useState<string>('');
  const [isSendLoading, setIsSendLoading] = useState<boolean>(false);
  const [hasSentCode, setHasSentCode] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [isVerifyLoading, setIsVerifyLoading] = useState<boolean>(false);

  const onSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendLoading(true);

    try {
      const redirectUrl = window.location.origin + ROUTES.API.AUTH_CALLBACK;
      await userSignInWithOTP(email, redirectUrl);
      showSuccessAlertToast('Code sent', 'Check your email to find the code.');
      setHasSentCode(true);
    } catch (error) {
      console.log(error);

      showErrorAlertToast(
        'Something went wrong',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setIsSendLoading(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyLoading(true);

    try {
      await userVerifyWithOTP(email, code);
      window.location.href = window.location.origin + ROUTES.API.AUTH_CALLBACK;
    } catch (error) {
      console.log(error);
      showErrorAlertToast(
        'Something went wrong',
        error instanceof Error ? error.message : 'Try again.'
      );
      setIsVerifyLoading(false);
    }
  };

  const onSignInWithGoogle = async () => {
    if (isPreviewEnv) return;
    const redirectUrl = window.location.origin + ROUTES.API.AUTH_CALLBACK;
    try {
      await userSignInWithGoogle(redirectUrl);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="bg-primary relative min-h-screen overflow-hidden px-4 py-12 md:px-8 md:pt-24">
      <div className="mx-auto flex w-full flex-col gap-8 sm:max-w-90">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <AppLogoMinimal className="size-12 max-md:hidden" />
            <AppLogoMinimal className="size-10 md:hidden" />
            <BackgroundPattern
              pattern="square"
              className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block"
            />
            <BackgroundPattern
              pattern="square"
              size="md"
              className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden"
            />
          </div>

          <h1 className="text-display-xs text-primary md:text-display-sm z-10 font-semibold">
            Sign in or create your account
          </h1>
          <p className="text-tertiary z-10 max-w-80 text-sm">
            See your brand's AI visibility results in less than 60 seconds.
          </p>
        </div>

        <div className="z-10 flex flex-col gap-6">
          {!hasSentCode ? (
            <>
              <SocialButton
                social="google"
                theme="color"
                onClick={onSignInWithGoogle}
                disabled={isPreviewEnv}
              >
                Continue with Google
              </SocialButton>

              <div className="border-secondary h-px w-full border-t"></div>

              <Form onSubmit={onSendCode} className="z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <Input
                    value={email}
                    onChange={setEmail}
                    isDisabled={isSendLoading || hasSentCode}
                    isRequired
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    size="md"
                  />

                  <Button type="submit" size="lg" color={hasSentCode ? 'secondary' : 'primary'}>
                    {isSendLoading
                      ? 'Sending...'
                      : hasSentCode
                        ? 'Resend code'
                        : 'Continue with email'}
                  </Button>

                  <div className="text-base-content/60 text-center text-xs">
                    By continuing you agree to our
                    <br />
                    <Link href={ROUTES.TOS} className="underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href={ROUTES.PRIVACY_POLICY} className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </div>

                  <p className="text-tertiary text-center text-xs">
                    New to AllSearch? Your free trial starts after your first login.
                  </p>
                </div>
              </Form>
            </>
          ) : (
            <Form onSubmit={onVerify} className="z-10 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <PinInput size="sm">
                  <PinInput.Label>Secure code</PinInput.Label>
                  <PinInput.Group maxLength={6} value={code} onChange={setCode}>
                    <PinInput.Slot index={0} />
                    <PinInput.Slot index={1} />
                    <PinInput.Slot index={2} />
                    <PinInput.Slot index={3} />
                    <PinInput.Slot index={4} />
                    <PinInput.Slot index={5} />
                  </PinInput.Group>
                  <PinInput.Description>Check your email for the code.</PinInput.Description>
                </PinInput>

                <Button type="submit" size="lg" disabled={isVerifyLoading}>
                  {isVerifyLoading ? 'Verifying...' : 'Verify code'}
                </Button>
                <Button color="secondary" onClick={() => setHasSentCode(false)}>
                  Back
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </section>
  );
};
