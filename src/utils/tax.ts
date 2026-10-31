// Precision Tax Calculation Engine
// Built for Brightloop Subscription Management System

import { TaxRule } from '../types';
import { calculatePercentageAmount } from './money';

export interface TaxCalculationResult {
  ruleId: string;
  name: string;
  ratePercentage: number;
  amount: number; // in minor units
}

/**
 * Calculates applicable taxes on a given taxable amount.
 * Supports multiple tax rules (e.g. CGST + SGST or Federal + State).
 * 
 * @param taxableAmount Base taxable amount in minor units (after line-level discounts)
 * @param taxRules Active tax rules applicable to the product/plan
 * @param productId Optional product ID to filter specific applicability
 * @returns Array of tax snapshots and total tax amount
 */
export function calculateTaxes(
  taxableAmount: number,
  taxRules: TaxRule[],
  productId?: string
): { taxSnapshots: TaxCalculationResult[]; taxTotal: number } {
  if (taxableAmount <= 0 || !taxRules || taxRules.length === 0) {
    return { taxSnapshots: [], taxTotal: 0 };
  }

  const taxSnapshots: TaxCalculationResult[] = [];
  let taxTotal = 0;

  for (const rule of taxRules) {
    if (!rule.isActive) continue;

    // Check product applicability: empty array means applies to all products
    if (
      productId &&
      rule.applicableProductIds &&
      rule.applicableProductIds.length > 0 &&
      !rule.applicableProductIds.includes(productId)
    ) {
      continue;
    }

    let taxAmount = 0;
    if (rule.taxType === 'percentage') {
      taxAmount = calculatePercentageAmount(taxableAmount, rule.ratePercentage);
    } else if (rule.taxType === 'fixed' && rule.fixedAmount) {
      taxAmount = rule.fixedAmount;
    }

    taxSnapshots.push({
      ruleId: rule.id,
      name: rule.name,
      ratePercentage: rule.ratePercentage,
      amount: taxAmount,
    });

    taxTotal += taxAmount;
  }

  return {
    taxSnapshots,
    taxTotal,
  };
}
