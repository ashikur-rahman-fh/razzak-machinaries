const BANGLA_DIGIT_OFFSET = 0x09e6;

/** Bengali numerals ০–৯ and ASCII digits 0–9, plus whitespace. */
const MEMO_BN_INPUT_PATTERN = /^[\u09E6-\u09EF0-9\s]*$/;

export function banglaToLatinDigits(text: string): string {
  return text.replace(/[\u09E6-\u09EF]/g, (char) =>
    String(char.charCodeAt(0) - BANGLA_DIGIT_OFFSET),
  );
}

export function banglaToLatinPhone(text: string): string {
  const converted = banglaToLatinDigits(text.trim());
  const hasPlus = converted.startsWith('+');
  const digits = converted.replace(/\D/g, '');

  if (hasPlus && digits.length > 0) {
    return `+${digits}`;
  }

  return digits;
}

export function banglaToLatinDigitsOnly(text: string): string {
  return banglaToLatinDigits(text).replace(/\D/g, '');
}

export function isValidMemoBnInput(text: string): boolean {
  return MEMO_BN_INPUT_PATTERN.test(text.trim());
}

export function isDigitsOnly(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && /^\d+$/.test(trimmed);
}
