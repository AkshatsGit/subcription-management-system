// Backend Recurring Billing Date Engine
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
} from 'date-fns';
import { BillingFrequency } from '../types';

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
      const targetMonthDate = addMonths(baseDate, 1);
      const maxDays = getDaysInMonth(targetMonthDate);
      const clampedDay = Math.min(effectiveAnchorDay, maxDays);
      return setDate(targetMonthDate, clampedDay);
    }

    case 'yearly': {
      const targetYearDate = addYears(baseDate, 1);
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

export function generateBillingPeriodId(subscriptionId: string, billingDate: Date | string): string {
  const dateObj = typeof billingDate === 'string' ? parseISO(billingDate) : billingDate;
  return `BP_${subscriptionId}_${format(dateObj, 'yyyy-MM-dd')}`;
}
