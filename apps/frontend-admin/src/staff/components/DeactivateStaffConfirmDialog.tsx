'use client';

import { ConfirmDialog, TranslatedText } from '@razzak-machinaries/shared/ui';

type DeactivateStaffConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
};

export function DeactivateStaffConfirmDialog({
  open,
  onOpenChange,
  staffName,
  onConfirm,
  isLoading = false,
}: DeactivateStaffConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<TranslatedText translationKey="staff.deactivate.title" as="span" layout="inline" />}
      description={
        <>
          <TranslatedText translationKey="staff.deactivate.body" as="p" />
          <p className="font-medium text-foreground">{staffName}</p>
        </>
      }
      cancelLabel={<TranslatedText translationKey="staff.actions.cancel" as="span" compact />}
      confirmLabel={
        isLoading ? (
          <TranslatedText translationKey="staff.deactivate.confirming" as="span" compact />
        ) : (
          <TranslatedText translationKey="staff.deactivate.confirm" as="span" compact />
        )
      }
      onConfirm={onConfirm}
      isLoading={isLoading}
      confirmVariant="destructive"
    />
  );
}
