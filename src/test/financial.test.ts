import { describe, it, expect } from 'vitest';
import { toMinorUnits, fromMinorUnits, calculatePercentageAmount, formatCurrency } from '../utils/money';
import { calculateTaxes } from '../utils/tax';
import { calculateDiscounts, isDiscountEligible } from '../utils/discount';
import { TaxRule, DiscountRule } from '../types';

describe('Financial Precision & Multi-Component Calculations', () => {
  it('should convert decimals to integer minor units safely without floating-point errors', () => {
    expect(toMinorUnits(199.99)).toBe(19999);
    expect(toMinorUnits(560.0)).toBe(56000);
    expect(fromMinorUnits(19999)).toBe(199.99);
  });

  it('should calculate precise percentage amounts', () => {
    // 18% GST on ₹10,000.00 (1000000 minor units) = ₹1,800.00 (180000 minor units)
    expect(calculatePercentageAmount(1000000, 18)).toBe(180000);
  });

  it('should calculate multi-component tax rules', () => {
    const rules: TaxRule[] = [
      {
        id: 'tax_1',
        name: 'GST 18%',
        ratePercentage: 18,
        taxType: 'percentage',
        applicableProductIds: [],
        startDate: '2026-01-01',
        endDate: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tax_2',
        name: 'Digital Cess 0.5%',
        ratePercentage: 0.5,
        taxType: 'percentage',
        applicableProductIds: [],
        startDate: '2026-01-01',
        endDate: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = calculateTaxes(1000000, rules); // On ₹10,000.00
    expect(result.taxSnapshots).toHaveLength(2);
    expect(result.taxSnapshots[0].amount).toBe(180000); // 18% = ₹1800
    expect(result.taxSnapshots[1].amount).toBe(5000); // 0.5% = ₹50
    expect(result.taxTotal).toBe(185000); // Total ₹1850
  });

  it('should enforce discount eligibility and usage caps', () => {
    const discount: DiscountRule = {
      id: 'disc_1',
      code: 'PROMO20',
      name: '20% Off',
      discountType: 'percentage',
      value: 20,
      minimumPurchaseAmount: 500000, // ₹5,000 min
      minimumQuantity: 1,
      maxUsages: 10,
      currentUsages: 10, // Max reached!
      startDate: '2026-01-01',
      endDate: null,
      applicableProductIds: [],
      applicableSubscriptionIds: [],
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };

    // When usage limit is reached
    const check1 = isDiscountEligible(discount, 1000000, 1);
    expect(check1.eligible).toBe(false);
    expect(check1.reason).toContain('Maximum usage limit');

    // When subtotal does not meet min requirement
    discount.currentUsages = 5;
    const check2 = isDiscountEligible(discount, 200000, 1); // Only ₹2,000
    expect(check2.eligible).toBe(false);
    expect(check2.reason).toContain('minimum requirement');

    // When valid
    const check3 = isDiscountEligible(discount, 1000000, 1); // ₹10,000
    expect(check3.eligible).toBe(true);

    const calc = calculateDiscounts(1000000, [discount], 1);
    expect(calc.discountTotal).toBe(200000); // 20% of ₹10,000 = ₹2,000
  });
});
