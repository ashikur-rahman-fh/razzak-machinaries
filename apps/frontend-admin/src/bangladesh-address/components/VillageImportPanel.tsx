'use client';

import {
  adminGeoApi,
  getUserFacingMessage,
  type VillageImportSummary,
} from '@razzak-machinaries/shared/api';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  ErrorAlert,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useId, useRef, useState } from 'react';

type VillageImportPanelProps = {
  onImportSuccess: () => void;
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function VillageImportPanel({ onImportSuccess }: VillageImportPanelProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<VillageImportSummary | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreview(null);
    setError(null);
    setSuccess(null);
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      return;
    }

    setIsPreviewing(true);
    setError(null);
    setSuccess(null);

    try {
      const summary = await adminGeoApi.importVillages(selectedFile, { dryRun: true });
      setPreview(summary);
    } catch (err) {
      setError(getUserFacingMessage(err));
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const summary = await adminGeoApi.importVillages(selectedFile, { dryRun: false });
      setPreview(summary);
      setSuccess('geo.import.success');
      setConfirmOpen(false);
      onImportSuccess();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
    } catch (err) {
      setError(getUserFacingMessage(err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card data-testid="village-import-panel">
      <CardHeader>
        <CardTitle>
          <TranslatedText translationKey="geo.import.title" as="span" />
        </CardTitle>
        <CardDescription>
          <TranslatedText translationKey="geo.import.description" as="span" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <ErrorAlert>
            <TranslatedText translationKey="geo.import.failed" as="span" layout="inline" /> {error}
          </ErrorAlert>
        ) : null}
        {success ? (
          <SuccessAlert>
            <TranslatedText translationKey={success} as="span" layout="inline" />
          </SuccessAlert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor={inputId} className="text-sm font-medium">
              <TranslatedText translationKey="geo.import.fileLabel" as="span" layout="inline" />
            </label>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium"
              data-testid="village-import-file-input"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedFile || isPreviewing}
            onClick={() => void handlePreview()}
            data-testid="village-import-preview-button"
          >
            <TranslatedText
              translationKey={isPreviewing ? 'geo.import.previewing' : 'geo.import.preview'}
              as="span"
              compact
            />
          </Button>
        </div>

        {preview ? (
          <div
            className="rounded-lg border border-border bg-muted/30 p-4 text-sm"
            data-testid="village-import-preview"
          >
            <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">
                  <TranslatedText translationKey="geo.import.total" as="span" layout="inline" />
                </dt>
                <dd className="font-mono font-medium">{preview.total}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  <TranslatedText translationKey="geo.import.valid" as="span" layout="inline" />
                </dt>
                <dd className="font-mono font-medium">{preview.valid}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  <TranslatedText translationKey="geo.import.invalid" as="span" layout="inline" />
                </dt>
                <dd className="font-mono font-medium">{preview.invalid}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  <TranslatedText
                    translationKey="geo.import.wouldCreate"
                    as="span"
                    layout="inline"
                  />
                </dt>
                <dd className="font-mono font-medium">{preview.wouldCreate}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  <TranslatedText
                    translationKey="geo.import.wouldUpdate"
                    as="span"
                    layout="inline"
                  />
                </dt>
                <dd className="font-mono font-medium">{preview.wouldUpdate}</dd>
              </div>
            </dl>

            {preview.errors.length > 0 ? (
              <ul className="mt-4 space-y-1 text-destructive" role="alert">
                {preview.errors.map((item) => (
                  <li key={`${item.rowIndex}-${item.message}`}>
                    {interpolate(t('geo.import.rowError'), {
                      row: item.rowIndex,
                      message: item.message,
                    })}
                  </li>
                ))}
              </ul>
            ) : null}

            {preview.invalid === 0 && preview.valid > 0 ? (
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  data-testid="village-import-commit-button"
                >
                  <TranslatedText translationKey="geo.import.commit" as="span" compact />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={<TranslatedText translationKey="geo.import.confirmTitle" as="span" />}
          description={<TranslatedText translationKey="geo.import.confirmMessage" as="span" />}
          confirmLabel={
            <TranslatedText
              translationKey={isImporting ? 'geo.import.importing' : 'geo.import.confirm'}
              as="span"
              compact
            />
          }
          cancelLabel={<TranslatedText translationKey="geo.actions.cancel" as="span" compact />}
          onConfirm={() => void handleConfirmImport()}
          isLoading={isImporting}
        />
      </CardContent>
    </Card>
  );
}
