'use client';

import { useClipboard } from '@/hooks/use-clipboard';
import { Button } from '@/components/base/buttons/button';
import { Check, Copy01 } from '@untitledui/icons';

export const CopyButton = ({ text }: { text: string }) => {
  const { copied, copy } = useClipboard();

  return (
    <Button
      onClick={() => copy(text)}
      color="tertiary"
      size="xs"
      className="bg-tertiary shadow-none!"
      iconLeading={copied ? <Check size={14} /> : <Copy01 size={14} />}
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
};
