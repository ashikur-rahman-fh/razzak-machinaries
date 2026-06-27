export function compareCalendarDates(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isCalendarDateBefore(a: string, b: string): boolean {
  return compareCalendarDates(a, b) < 0;
}

export function isCalendarDateEqual(a: string, b: string): boolean {
  return compareCalendarDates(a, b) === 0;
}

export function formatCalendarDate(isoDate: string, language: 'en' | 'bn'): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function todayIsoDateLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
