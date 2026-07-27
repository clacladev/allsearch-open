'use client';

import { Crisp } from 'crisp-sdk-web';
import { config } from '@/config';
import { Button, Props } from '@/components/base/buttons/button';
import { HelpCircle } from '@untitledui/icons';

export const openSupportOnClick = () => {
  if (process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID) {
    Crisp.chat.show();
    Crisp.chat.open();
  } else if (config.email?.supportEmail) {
    // open default email client in new window with "need help with ${config.appName}" as subject
    window.open(
      `mailto:${config.email.supportEmail}?subject=Need help with ${config.appName}`,
      '_blank'
    );
  }
};

export const SupportButton = (props: Props) => (
  <Button onClick={openSupportOnClick} iconLeading={HelpCircle} {...props}>
    Support
  </Button>
);

export const SupportLink = (props: Props) => (
  <Button {...props} color="link-gray" size="lg" onClick={openSupportOnClick}>
    {props.children}
  </Button>
);
