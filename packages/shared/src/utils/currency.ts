const BDT_FORMATTER_EN = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BDT_FORMATTER_BN = new Intl.NumberFormat('bn-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseAmount(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatBdt(amount: string | number, language: 'en' | 'bn' = 'en'): string {
  const formatter = language === 'bn' ? BDT_FORMATTER_BN : BDT_FORMATTER_EN;
  return formatter.format(parseAmount(amount));
}

export function formatBdtPlain(amount: string | number): string {
  const parsed = parseAmount(amount);
  return `৳${parsed.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function multiplyMoneyStrings(unitPrice: string, quantity: string): string {
  const total = parseAmount(unitPrice) * parseAmount(quantity);
  return total.toFixed(2);
}

export function sumMoneyStrings(...amounts: string[]): string {
  const total = amounts.reduce((sum, amount) => sum + parseAmount(amount), 0);
  return total.toFixed(2);
}
