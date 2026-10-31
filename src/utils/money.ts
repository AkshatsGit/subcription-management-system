// Precise Financial Arithmetic Utility for Brightloop Subscription Management System
// Avoids floating-point precision hazards by working with integer minor units (paise / cents)

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';

/**
 * Converts a decimal amount (e.g. 199.99) to minor units (e.g. 19999)
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts minor units (e.g. 19999) to a standard decimal number (199.99)
 */
export function fromMinorUnits(minorUnits: number): number {
  return (minorUnits || 0) / 100;
}

/**
 * Formats minor units into an attractive localized currency string
 * e.g. 125000 -> "₹1,250.00"
 */
export function formatCurrency(
  minorUnits: number,
  currency: string = DEFAULT_CURRENCY,
  symbol: string = DEFAULT_CURRENCY_SYMBOL
): string {
  const value = fromMinorUnits(minorUnits);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${symbol}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Formats a decimal amount for display without currency symbol
 */
export function formatNumber(minorUnits: number): string {
  return fromMinorUnits(minorUnits).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Safe percentage calculation in minor units
 * e.g. 18% of 10000 minor units = 1800 minor units
 */
export function calculatePercentageAmount(baseMinorUnits: number, percentageRate: number): number {
  if (!baseMinorUnits || !percentageRate || percentageRate <= 0) return 0;
  return Math.round((baseMinorUnits * percentageRate) / 100);
}

