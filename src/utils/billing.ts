// Deterministic Recurring Billing Calculation Engine
// Handles Daily, Weekly, Monthly, Yearly billing cycles with leap years and month-end clamping

import {
  addDays,
  addWeeks,
  getDaysInMonth,
  setDate,
  addMonths,
  addYears,
  isLeapYear,
  format,
  parseISO,
  isBefore,
  isEqual,
  startOfDay,
} from 'date-fns';
import { BillingFrequency } from '../types';

/**
 * Calculates the next billing date given a current billing date, frequency, and original anchor day.
 * 
 * Example Month-End Clamping:
 * If a customer starts on January 31:
 * - Next monthly billing date: Feb 28 (or Feb 29 on leap year)
 * - Following monthly billing date: March 31 (because anchorDay is preserved as 31)
 * - Following monthly billing date: April 30 (clamped to 30)
 * - Following monthly billing date: May 31 (restored to 31)
 * 
 * @param currentDate Current reference date (Date or ISO string)
 * @param frequency 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @param anchorDay Original day of the month when subscription started (1-31). Defaults to currentDate's day.
 * @returns Next billing Date object
 */
export function calculateNextBillingDate(
  currentDate: Date | string,
  frequency: BillingFrequency,
  anchorDay?: number
): Date {
  const baseDate = typeof currentDate === 'string' ? parseISO(currentDate) : new Date(currentDate);
  const effectiveAnchorDay = anchorDay || baseDate.getDate();

  switch (frequency) {
    case 'daily':
      return addDays(baseDate, 1);

    case 'weekly':
      return addWeeks(baseDate, 1);

    case 'monthly': {
      // Step to next month
      const targetMonthDate = addMonths(baseDate, 1);
      const maxDaysInTargetMonth = getDaysInMonth(targetMonthDate);
      // Clamp day to available days in target month
      const clampedDay = Math.min(effectiveAnchorDay, maxDaysInTargetMonth);
      return setDate(targetMonthDate, clampedDay);
    }

    case 'yearly': {
      const targetYearDate = addYears(baseDate, 1);
      // Handle February 29 leap-year start
      if (effectiveAnchorDay === 29 && baseDate.getMonth() === 1) {
        if (!isLeapYear(targetYearDate)) {
          return setDate(targetYearDate, 28);
        }
      }
      const maxDays = getDaysInMonth(targetYearDate);
      return setDate(targetYearDate, Math.min(effectiveAnchorDay, maxDays));
    }

    default:
      throw new Error(`Unsupported billing frequency: ${frequency}`);
  }
}

/**
 * Calculates the period start and period end for an invoice billing cycle.
 */
export function calculateBillingPeriod(
  cycleStartDate: Date | string,
  frequency: BillingFrequency,
  anchorDay?: number
): { periodStart: Date; periodEnd: Date; nextBillingDate: Date } {
  const periodStart = typeof cycleStartDate === 'string' ? parseISO(cycleStartDate) : new Date(cycleStartDate);
  const nextBilling = calculateNextBillingDate(periodStart, frequency, anchorDay);
  // Period end is typically the day before the next cycle starts, or the full cycle duration
  const periodEnd = addDays(nextBilling, -1);

  return {
    periodStart,
    periodEnd,
    nextBillingDate: nextBilling,
  };
}

/**
 * Generates an idempotent billing period identifier for a subscription.
 * Format: `SUB_<subscriptionId>_<YYYY-MM-DD>`
 * Guaranteed unique per subscription per billing cycle.
 */
export function generateBillingPeriodId(subscriptionId: string, billingDate: Date | string): string {
  const dateObj = typeof billingDate === 'string' ? parseISO(billingDate) : billingDate;
  return `BP_${subscriptionId}_${format(dateObj, 'yyyy-MM-dd')}`;
}

/**
 * Determines whether a subscription is due for recurring billing.
 * A subscription is due if status is 'active' and nextBillingDate <= targetDate (start of day).
 */
export function isSubscriptionDueForBilling(
  nextBillingDate: Date | string,
  targetDate: Date = new Date(),
  status: string = 'active'
): boolean {
  if (status !== 'active') return false;
  const nextDate = startOfDay(typeof nextBillingDate === 'string' ? parseISO(nextBillingDate) : nextBillingDate);
  const today = startOfDay(targetDate);
  return isBefore(nextDate, today) || isEqual(nextDate, today);
}
