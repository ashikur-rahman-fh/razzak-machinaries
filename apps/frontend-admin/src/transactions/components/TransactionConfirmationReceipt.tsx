'use client';

import type { TransactionConfirmation } from '@razzak-machinaries/shared/api';
import { STORE_CONFIG } from '@razzak-machinaries/shared/constants/store';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  formatAmountInBanglaWords,
  formatCurrencyBn,
  toBanglaDigits,
} from '@razzak-machinaries/shared/utils/bangla-amount';
import { formatInteger } from '@razzak-machinaries/shared/utils/currency';

import { PAYMENT_METHODS } from '../constants';

type TransactionConfirmationReceiptProps = {
  data: TransactionConfirmation;
  showCurrentBaki: boolean;
};

function formatReceiptDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getPaymentMethodLabel(paymentMethod: string, t: (key: string) => string): string {
  const match = PAYMENT_METHODS.find((method) => method.value === paymentMethod);
  return match ? t(match.labelKey) : paymentMethod || '—';
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-sm leading-relaxed sm:grid-cols-[10rem_1fr]">
      <dt className="font-medium text-neutral-700">{label}</dt>
      <dd className="text-neutral-900">{value || '—'}</dd>
    </div>
  );
}

export function TransactionConfirmationReceipt({
  data,
  showCurrentBaki,
}: TransactionConfirmationReceiptProps) {
  const { t } = useTranslation();
  const customerName = data.customerNameBn.trim() || data.customerNameEn.trim();
  const customerAddress = data.customerAddressBn.trim() || data.customerAddressEn.trim();
  const transactionTypeLabel = data.transactionType === 'SALE' ? 'বিক্রয়' : 'পেমেন্ট';
  const amountWords = formatAmountInBanglaWords(data.totalAmount);

  return (
    <article
      className="mx-auto w-full max-w-[210mm] bg-white px-6 py-8 text-neutral-900 shadow-sm print:max-w-none print:border print:border-neutral-300 print:p-8 print:shadow-none"
      aria-label="লেনদেনের রসিদ"
    >
      <header className="border-b border-neutral-300 pb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{STORE_CONFIG.nameBn}</h1>
        {STORE_CONFIG.addressBn ? (
          <p className="mt-2 text-sm text-neutral-700">{STORE_CONFIG.addressBn}</p>
        ) : null}
        {STORE_CONFIG.phone ? (
          <p className="mt-1 text-sm text-neutral-700">{STORE_CONFIG.phone}</p>
        ) : null}
        <p className="mt-3 text-base font-medium text-neutral-800">লেনদেনের রসিদ</p>
      </header>

      <section className="mt-6 space-y-2">
        <ReceiptRow label="গ্রাহকের নাম" value={customerName} />
        <ReceiptRow label="ঠিকানা" value={customerAddress} />
        <ReceiptRow label="তারিখ" value={formatReceiptDate(data.date)} />
        <ReceiptRow label="লেনদেন আইডি" value={data.displayId} />
        <ReceiptRow label="লেনদেনের ধরন" value={transactionTypeLabel} />
      </section>

      {data.transactionType === 'SALE' ? (
        <section className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border border-neutral-400 bg-neutral-50 print:bg-white">
                  <th className="border border-neutral-400 px-2 py-2 text-left font-semibold">
                    ক্রমিক
                  </th>
                  <th className="border border-neutral-400 px-2 py-2 text-left font-semibold">
                    পণ্যের নাম
                  </th>
                  <th className="border border-neutral-400 px-2 py-2 text-right font-semibold">
                    একক মূল্য
                  </th>
                  <th className="border border-neutral-400 px-2 py-2 text-right font-semibold">
                    পরিমাণ
                  </th>
                  <th className="border border-neutral-400 px-2 py-2 text-right font-semibold">
                    মোট
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-neutral-400 px-2 py-2">
                      {toBanglaDigits(index + 1)}
                    </td>
                    <td className="border border-neutral-400 px-2 py-2">{item.productName}</td>
                    <td className="border border-neutral-400 px-2 py-2 text-right">
                      {formatCurrencyBn(item.unitPrice, { useBanglaDigits: true })}
                    </td>
                    <td className="border border-neutral-400 px-2 py-2 text-right">
                      {toBanglaDigits(formatInteger(item.quantity))}
                    </td>
                    <td className="border border-neutral-400 px-2 py-2 text-right">
                      {formatCurrencyBn(item.lineTotal, { useBanglaDigits: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-right text-base font-semibold">
            মোট বিক্রয় মূল্য: {formatCurrencyBn(data.totalAmount, { useBanglaDigits: true })}
          </p>
        </section>
      ) : (
        <section className="mt-6 space-y-2 border border-neutral-300 p-4">
          <ReceiptRow
            label="পেমেন্টের পরিমাণ"
            value={formatCurrencyBn(data.totalAmount, { useBanglaDigits: true })}
          />
          <ReceiptRow label="পেমেন্ট পদ্ধতি" value={getPaymentMethodLabel(data.paymentMethod, t)} />
          {data.note.trim() ? <ReceiptRow label="নোট / বিবরণ" value={data.note.trim()} /> : null}
        </section>
      )}

      <section className="mt-6 border-t border-neutral-300 pt-4">
        <p className="text-sm font-medium text-neutral-700">মোট টাকা কথায়:</p>
        <p className="mt-1 text-base font-semibold">{amountWords}</p>
      </section>

      {showCurrentBaki ? (
        <section className="mt-6 border-t border-dashed border-neutral-300 pt-4">
          <p className="text-sm font-medium text-neutral-700">বর্তমান মোট বাকি:</p>
          <p className="mt-1 text-lg font-semibold">
            {formatCurrencyBn(data.currentBalance, { useBanglaDigits: true })}
          </p>
          <p className="mt-2 text-sm text-neutral-700">কথায়:</p>
          <p className="mt-1 font-medium">{formatAmountInBanglaWords(data.currentBalance)}</p>
        </section>
      ) : null}

      <footer className="mt-12 grid gap-10 sm:grid-cols-2">
        <div>
          <div className="border-b border-neutral-500 pb-1" />
          <p className="mt-2 text-sm font-medium">কর্তৃপক্ষের স্বাক্ষর</p>
        </div>
        <div>
          <div className="border-b border-neutral-500 pb-1" />
          <p className="mt-2 text-sm font-medium">গ্রাহকের স্বাক্ষর</p>
        </div>
      </footer>
    </article>
  );
}
