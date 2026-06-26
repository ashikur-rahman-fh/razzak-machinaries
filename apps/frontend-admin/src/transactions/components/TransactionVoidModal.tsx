'use client';

import { adminTransactionsApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useState } from 'react';

type TransactionVoidModalProps = {
  transactionId: number;
  displayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoided: () => void;
};

export function TransactionVoidModal({
  transactionId,
  displayId,
  open,
  onOpenChange,
  onVoided,
}: TransactionVoidModalProps) {
  const { language } = useLanguagePreference();
  const [voidReason, setVoidReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!voidReason.trim()) {
      setError(language === 'bn' ? 'বাতিলের কারণ লিখুন।' : 'Void reason is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await adminTransactionsApi.voidTransaction(transactionId, { voidReason: voidReason.trim() });
      onVoided();
      onOpenChange(false);
      setVoidReason('');
    } catch {
      setError(
        language === 'bn'
          ? 'লেনদেন বাতিল করা যায়নি। আবার চেষ্টা করুন।'
          : 'Could not void the transaction. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <TranslatedText translationKey="transaction.void.title" as="span" />
          </DialogTitle>
          <DialogDescription>
            <TranslatedText translationKey="transaction.void.description" as="span" /> {displayId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="void-reason">
            <TranslatedText translationKey="transaction.void.reason" as="span" compact />
          </label>
          <Textarea
            id="void-reason"
            value={voidReason}
            onChange={(event) => {
              setVoidReason(event.target.value);
              setError(null);
            }}
            rows={3}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <TranslatedText translationKey="customer.actions.cancel" as="span" compact />
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            <TranslatedText translationKey="transaction.void.submit" as="span" compact />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
