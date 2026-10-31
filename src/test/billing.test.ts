import { describe, it, expect } from 'vitest';
import {
  calculateNextBillingDate,
  calculateBillingPeriod,
  generateBillingPeriodId,
  isSubscriptionDueForBilling,
} from '../utils/billing';

describe('Billing Cycle Engine & Month-End Clamping', () => {
  it('should correctly clamp January 31 monthly billing to February 28 on a non-leap year (2025)', () => {
    const startDate = new Date(2025, 0, 31); // Jan 31, 2025
    const nextDate = calculateNextBillingDate(startDate, 'monthly', 31);
    expect(nextDate.getFullYear()).toBe(2025);
    expect(nextDate.getMonth()).toBe(1); // February
    expect(nextDate.getDate()).toBe(28); // Clamped to 28
  });

  it('should correctly clamp January 31 monthly billing to February 29 on a leap year (2024)', () => {
    const startDate = new Date(2024, 0, 31); // Jan 31, 2024 (Leap Year)
    const nextDate = calculateNextBillingDate(startDate, 'monthly', 31);
    expect(nextDate.getFullYear()).toBe(2024);
    expect(nextDate.getMonth()).toBe(1); // February
    expect(nextDate.getDate()).toBe(29); // Clamped to 29 on leap year
  });

  it('should restore original anchor day 31 on March following February clamping', () => {
    const febDate = new Date(2025, 1, 28); // Feb 28, 2025 (clamped)
    const marchDate = calculateNextBillingDate(febDate, 'monthly', 31); // anchorDay is 31
    expect(marchDate.getFullYear()).toBe(2025);
    expect(marchDate.getMonth()).toBe(2); // March
    expect(marchDate.getDate()).toBe(31); // Restored to 31!
  });

  it('should accurately calculate Daily and Weekly frequencies', () => {
    const start = new Date(2026, 9, 1); // Oct 1, 2026
    const nextDay = calculateNextBillingDate(start, 'daily');
    expect(nextDay.getDate()).toBe(2);

    const nextWeek = calculateNextBillingDate(start, 'weekly');
    expect(nextWeek.getDate()).toBe(8);
  });

  it('should calculate Yearly billing accurately', () => {
    const start = new Date(2026, 4, 15); // May 15, 2026
    const nextYear = calculateNextBillingDate(start, 'yearly');
    expect(nextYear.getFullYear()).toBe(2027);
    expect(nextYear.getMonth()).toBe(4);
    expect(nextYear.getDate()).toBe(15);
  });

  it('should generate deterministic, idempotent billing period IDs', () => {
    const id1 = generateBillingPeriodId('sub_100', '2026-10-31');
    const id2 = generateBillingPeriodId('sub_100', '2026-10-31');
    expect(id1).toBe('BP_sub_100_2026-10-31');
    expect(id1).toBe(id2);
  });

  it('should correctly flag due subscriptions', () => {
    const pastDue = isSubscriptionDueForBilling('2026-10-01', new Date(2026, 9, 15), 'active');
    expect(pastDue).toBe(true);

    const future = isSubscriptionDueForBilling('2026-11-01', new Date(2026, 9, 15), 'active');
    expect(future).toBe(false);

    const paused = isSubscriptionDueForBilling('2026-10-01', new Date(2026, 9, 15), 'paused');
    expect(paused).toBe(false);
  });
});
