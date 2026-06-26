const BDT_FORMATTER_EN = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const BDT_FORMATTER_BN = new Intl.NumberFormat('bn-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function parseAmount(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundAmount(value: string | number): number {
  return Math.round(parseAmount(value));
}

export function formatInteger(value: string | number): string {
  return String(roundAmount(value));
}

export function formatBdt(amount: string | number, language: 'en' | 'bn' = 'en'): string {
  const formatter = language === 'bn' ? BDT_FORMATTER_BN : BDT_FORMATTER_EN;
  return formatter.format(roundAmount(amount));
}

export function formatBdtPlain(amount: string | number): string {
  const rounded = roundAmount(amount);
  return `৳${rounded.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function multiplyMoneyStrings(unitPrice: string, quantity: string): string {
  const total = roundAmount(unitPrice) * roundAmount(quantity);
  return String(total);
}

export function sumMoneyStrings(...amounts: string[]): string {
  const total = amounts.reduce((sum, amount) => sum + roundAmount(amount), 0);
  return String(total);
}
