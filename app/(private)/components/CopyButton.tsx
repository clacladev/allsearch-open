'use client';

import { useClipboard } from '@/hooks/use-clipboard';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

export const CopyButton = ({ text }: { text: string }) => {
  const { copied, copy } = useClipboard();

  return (
    <Button onClick={() => copy(text)} variant="ghost" size="xs" className="bg-muted shadow-none!">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
};
