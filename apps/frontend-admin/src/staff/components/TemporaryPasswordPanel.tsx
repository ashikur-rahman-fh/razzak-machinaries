'use client';

import { ErrorAlert, SuccessAlert, Button, TranslatedText } from '@razzak-machinaries/shared/ui';
import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

type TemporaryPasswordPanelProps = {
  password: string;
  onDismiss?: () => void;
};

export function TemporaryPasswordPanel({ password, onDismiss }: TemporaryPasswordPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('Could not copy to clipboard.');
    }
  }, [password]);

  return (
    <div
      className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4"
      data-testid="temporary-password-panel"
    >
      <ErrorAlert
        title={<TranslatedText translationKey="staff.tempPassword.warningTitle" as="span" />}
        description={<TranslatedText translationKey="staff.tempPassword.warning" as="span" />}
        role="alert"
      />
      <div className="flex flex-wrap items-center gap-2">
        <code
          className="rounded-md bg-muted px-3 py-2 font-mono text-sm tracking-wide"
          data-testid="temporary-password-value"
        >
          {password}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          <TranslatedText translationKey="staff.tempPassword.copy" as="span" compact />
        </Button>
      </div>
      {copyError ? (
        <p className="text-sm text-destructive" role="alert">
          {copyError}
        </p>
      ) : null}
      {copied ? (
        <SuccessAlert
          title={<TranslatedText translationKey="staff.tempPassword.copied" as="span" />}
          role="status"
        />
      ) : null}
      {onDismiss ? (
        <Button type="button" variant="secondary" onClick={onDismiss}>
          <TranslatedText translationKey="staff.tempPassword.done" as="span" compact />
        </Button>
      ) : null}
    </div>
  );
}
