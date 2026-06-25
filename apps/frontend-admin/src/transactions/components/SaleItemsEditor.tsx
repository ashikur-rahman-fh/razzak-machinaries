'use client';

import { formatBdt, multiplyMoneyStrings } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { Button, Input, TranslatedText } from '@razzak-machinaries/shared/ui';

import { createEmptySaleItem, getSaleGrandTotal, type SaleItemFormValues } from '../validation';

type SaleItemsEditorProps = {
  items: SaleItemFormValues[];
  onChange: (items: SaleItemFormValues[]) => void;
  fieldErrors: Record<string, string | undefined>;
};

export function SaleItemsEditor({ items, onChange, fieldErrors }: SaleItemsEditorProps) {
  const { language, t } = useLanguagePreference();
  const grandTotal = getSaleGrandTotal(items);

  function updateItem(id: string, patch: Partial<SaleItemFormValues>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, createEmptySaleItem()]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">
          <TranslatedText translationKey="transaction.sale" as="span" compact />
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <span className="mr-2" aria-hidden>
            +
          </span>
          <TranslatedText translationKey="transaction.addItem" as="span" compact />
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const lineTotal = multiplyMoneyStrings(item.unitPrice || '0', item.quantity || '0');
          return (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'bn' ? `পণ্য ${index + 1}` : `Item ${index + 1}`}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  aria-label={t('transaction.create.removeItem')}
                >
                  <span aria-hidden>×</span>
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`product-name-${item.id}`}>
                  <TranslatedText
                    translationKey="transaction.create.productName"
                    as="span"
                    compact
                  />
                </label>
                <Input
                  id={`product-name-${item.id}`}
                  value={item.productName}
                  onChange={(event) => updateItem(item.id, { productName: event.target.value })}
                  aria-invalid={Boolean(fieldErrors[`items.${index}.productName`])}
                />
                {fieldErrors[`items.${index}.productName`] ? (
                  <p className="text-sm text-destructive" role="alert">
                    <TranslatedText
                      translationKey={fieldErrors[`items.${index}.productName`]!}
                      as="span"
                      compact
                    />
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`unit-price-${item.id}`}>
                    <TranslatedText translationKey="transaction.unitPrice" as="span" compact />
                  </label>
                  <Input
                    id={`unit-price-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                    aria-invalid={Boolean(fieldErrors[`items.${index}.unitPrice`])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`quantity-${item.id}`}>
                    <TranslatedText translationKey="transaction.quantity" as="span" compact />
                  </label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                    aria-invalid={Boolean(fieldErrors[`items.${index}.quantity`])}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    <TranslatedText
                      translationKey="transaction.create.lineTotal"
                      as="span"
                      compact
                    />
                  </p>
                  <p className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold">
                    {formatBdt(lineTotal, language)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {fieldErrors.items ? (
        <p className="text-sm text-destructive" role="alert">
          <TranslatedText translationKey={fieldErrors.items} as="span" compact />
        </p>
      ) : null}

      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
        <span className="text-sm font-medium">
          <TranslatedText translationKey="transaction.create.grandTotal" as="span" compact />
        </span>
        <span className="text-lg font-semibold text-foreground">
          {formatBdt(grandTotal, language)}
        </span>
      </div>
    </div>
  );
}
