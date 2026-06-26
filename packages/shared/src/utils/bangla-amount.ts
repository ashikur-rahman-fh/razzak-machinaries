import { numberToBanglaWords } from 'react-bangla-number-converter';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

function parseTakaAmount(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.floor(Math.abs(parsed));
}

function toLatinDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => {
    const index = BANGLA_DIGITS.indexOf(digit as (typeof BANGLA_DIGITS)[number]);
    return index >= 0 ? String(index) : digit;
  });
}

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)] ?? digit);
}

export type FormatCurrencyBnOptions = {
  useBanglaDigits?: boolean;
};

export function formatCurrencyBn(
  amount: string | number,
  options: FormatCurrencyBnOptions = {},
): string {
  const parsed =
    typeof amount === 'number' ? amount : Number.parseFloat(toLatinDigits(String(amount)));
  const safeAmount = Number.isFinite(parsed) ? Math.round(parsed) : 0;
  const formatted = safeAmount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const withSymbol = `৳${formatted}`;
  return options.useBanglaDigits ? toBanglaDigits(withSymbol) : withSymbol;
}

export function convertNumberToBanglaWords(amount: string | number): string {
  const taka = parseTakaAmount(amount);
  return numberToBanglaWords(taka, { supportBanglaDigits: true });
}

export function formatAmountInBanglaWords(amount: string | number): string {
  return `${convertNumberToBanglaWords(amount)} টাকা মাত্র`;
}
