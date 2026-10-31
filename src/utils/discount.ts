// Precision Discount Eligibility & Calculation Engine
// Built for Brightloop Subscription Management System

import { DiscountRule } from '../types';
import { calculatePercentageAmount } from './money';

export interface DiscountCalculationResult {
  ruleId: string;
  code: string;
  name: string;
  amount: number; // in minor units
}

/**
 * Validates whether a discount rule is currently eligible for an order.
 */
export function isDiscountEligible(
  rule: DiscountRule,
  orderSubtotal: number,
  quantity: number = 1,
  productId?: string,
  currentDate: Date = new Date()
): { eligible: boolean; reason?: string } {
  if (!rule.isActive) {
    return { eligible: false, reason: 'Discount rule is inactive' };
  }

  // Check validity dates
  const now = currentDate.getTime();
  if (rule.startDate && new Date(rule.startDate).getTime() > now) {
    return { eligible: false, reason: 'Discount promotion has not started yet' };
  }

  if (rule.endDate && new Date(rule.endDate).getTime() < now) {
    return { eligible: false, reason: 'Discount promotion has expired' };
  }

  // Check usage limit
  if (rule.maxUsages > 0 && rule.currentUsages >= rule.maxUsages) {
    return { eligible: false, reason: 'Maximum usage limit reached for this discount' };
  }

  // Check minimum purchase amount
  if (rule.minimumPurchaseAmount > 0 && orderSubtotal < rule.minimumPurchaseAmount) {
    return {
      eligible: false,
      reason: `Order subtotal does not meet minimum requirement of ${rule.minimumPurchaseAmount / 100}`,
    };
  }

  // Check minimum quantity
  if (rule.minimumQuantity > 0 && quantity < rule.minimumQuantity) {
    return {
      eligible: false,
      reason: `Quantity (${quantity}) is less than required minimum of ${rule.minimumQuantity}`,
    };
  }

  // Check product applicability
  if (
    productId &&
    rule.applicableProductIds &&
    rule.applicableProductIds.length > 0 &&
    !rule.applicableProductIds.includes(productId)
  ) {
    return { eligible: false, reason: 'Discount is not applicable to this product' };
  }

  return { eligible: true };
}

/**
 * Calculates discounts and returns snapshots.
 */
export function calculateDiscounts(
  orderSubtotal: number,
  discountRules: DiscountRule[],
  quantity: number = 1,
  productId?: string
): { discountSnapshots: DiscountCalculationResult[]; discountTotal: number } {
  if (orderSubtotal <= 0 || !discountRules || discountRules.length === 0) {
    return { discountSnapshots: [], discountTotal: 0 };
  }

  const discountSnapshots: DiscountCalculationResult[] = [];
  let discountTotal = 0;

  for (const rule of discountRules) {
    const { eligible } = isDiscountEligible(rule, orderSubtotal, quantity, productId);
    if (!eligible) continue;

    let discountAmount = 0;
    if (rule.discountType === 'percentage') {
      discountAmount = calculatePercentageAmount(orderSubtotal, rule.value);
    } else if (rule.discountType === 'fixed') {
      // Fixed discount cannot exceed subtotal
      discountAmount = Math.min(orderSubtotal, rule.value);
    }

    // Ensure total discount doesn't exceed order subtotal
    const remainingEligibleSubtotal = Math.max(0, orderSubtotal - discountTotal);
    discountAmount = Math.min(discountAmount, remainingEligibleSubtotal);

    if (discountAmount > 0) {
      discountSnapshots.push({
        ruleId: rule.id,
        code: rule.code,
        name: rule.name,
        amount: discountAmount,
      });
      discountTotal += discountAmount;
    }

    if (discountTotal >= orderSubtotal) break;
  }

  return {
    discountSnapshots,
    discountTotal,
  };
}
