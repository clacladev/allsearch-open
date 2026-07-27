'use client';

import { useEffect } from 'react';
import { Crisp } from 'crisp-sdk-web';
import { getUser } from '@/libs/database/supabase/client';

// Crisp customer chat support
const CrispChat = (): null => {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID) return;
    Crisp.configure(process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID);
    Crisp.chat.show();
    Crisp.chat.onChatClosed(() => Crisp.chat.hide());
  }, []);

  useEffect(() => {
    getUser().then((user) => {
      if (!user) return;
      Crisp.session.setData({ userId: user.id });
    });
  }, []);

  return null;
};

export default CrispChat;
