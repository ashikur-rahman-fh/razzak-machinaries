'use client';

import { Button, TranslatedText } from '@razzak-machinaries/shared/ui';

type PrintActionButtonsProps = {
  onPrint: () => void;
};

export function PrintActionButtons({ onPrint }: PrintActionButtonsProps) {
  return (
    <Button type="button" onClick={onPrint}>
      <TranslatedText translationKey="halkhata.invitations.print.action" as="span" compact />
    </Button>
  );
}
