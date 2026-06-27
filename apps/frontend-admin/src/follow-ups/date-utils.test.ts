import { describe, expect, it } from 'vitest';

import {
  compareCalendarDates,
  formatCalendarDate,
  isCalendarDateBefore,
  isCalendarDateEqual,
} from './date-utils';

describe('date-utils', () => {
  it('compares ISO calendar dates lexicographically', () => {
    expect(compareCalendarDates('2026-06-20', '2026-06-26')).toBeLessThan(0);
    expect(compareCalendarDates('2026-06-26', '2026-06-26')).toBe(0);
    expect(compareCalendarDates('2026-06-30', '2026-06-26')).toBeGreaterThan(0);
  });

  it('detects before/equal relationships without Date parsing drift', () => {
    expect(isCalendarDateBefore('2026-06-20', '2026-06-26')).toBe(true);
    expect(isCalendarDateBefore('2026-06-26', '2026-06-26')).toBe(false);
    expect(isCalendarDateEqual('2026-06-26', '2026-06-26')).toBe(true);
  });

  it('formats calendar dates from explicit parts', () => {
    expect(formatCalendarDate('2026-06-26', 'en')).toContain('2026');
    expect(formatCalendarDate('2026-06-26', 'bn')).toBeTruthy();
  });
});
