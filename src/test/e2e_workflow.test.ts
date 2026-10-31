import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '../services/db';
import { toMinorUnits } from '../utils/money';

describe('Complete 21-Step Master End-to-End Workflow Scenario', () => {
  beforeEach(() => {
    dbService.resetSeedData();
  });

  it('executes full lifecycle from product & variant creation to automated billing & payment reconciliation', async () => {
    // 1. Admin logs in (simulated authorized admin session)
    const adminUid = 'admin_ripple_1';

    // 2 & 3. Admin creates a product and adds product variant (Odoo connector +₹560)
    const product = await dbService.saveProduct({
      name: 'Brightloop Master Suite',
      code: 'BMS-101',
      description: 'Unified cloud management suite',
      productType: 'software',
      salesPrice: toMinorUnits(10000), // ₹10,000.00
      costPrice: toMinorUnits(2000),
      currency: 'INR',
      isActive: true,
      variants: [
        {
          id: 'var_odoo_test',
          name: 'Odoo Enterprise Connector',
          description: 'Odoo sync bridge',
          additionalPrice: toMinorUnits(560), // ₹560.00
          isActive: true,
        },
      ],
    });
    expect(product.id).toBeDefined();
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].additionalPrice).toBe(56000); // 56000 paise

    // 4. Admin creates a subscription plan
    const plan = await dbService.savePlan({
      productId: product.id,
      productName: product.name,
      name: 'Master Suite Monthly',
      description: 'Monthly contract with full permissions',
      salesPrice: product.salesPrice,
      billingFrequency: 'monthly',
      minimumQuantity: 1,
      availableFrom: new Date().toISOString(),
      availableUntil: null,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      autoCloseOnExpiry: false,
      isActive: true,
    });
    expect(plan.id).toBeDefined();
    expect(plan.billingFrequency).toBe('monthly');

    // 5. Admin configures tax rules (GST 18%)
    const tax = await dbService.saveTaxRule({
      name: 'GST 18%',
      ratePercentage: 18.0,
      taxType: 'percentage',
      applicableProductIds: [],
      startDate: new Date().toISOString(),
      endDate: null,
      isActive: true,
    });
    expect(tax.ratePercentage).toBe(18.0);

    // 6. Admin configures discount (Flat ₹500 discount)
    const discount = await dbService.saveDiscountRule({
      code: 'FLAT500',
      name: 'Flat ₹500 Discount',
      discountType: 'fixed',
      value: toMinorUnits(500), // ₹500.00
      minimumPurchaseAmount: toMinorUnits(1000),
      minimumQuantity: 1,
      maxUsages: 100,
      currentUsages: 0,
      startDate: new Date().toISOString(),
      endDate: null,
      applicableProductIds: [],
      applicableSubscriptionIds: [],
      isActive: true,
    });
    expect(discount.value).toBe(50000);

    // 7 & 8. Customer registers
    const customer = await dbService.createCustomer({
      companyName: 'Apex Innovations Ltd',
      contactName: 'Sanjay Dutt',
      email: 'sanjay@apex.com',
      phone: '+91 98111 22334',
      billingAddress: {
        street: 'Cyber City, Phase 2',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        country: 'India',
      },
      taxNumber: '06AAACA9999M1Z5',
      status: 'active',
    });
    expect(customer.id).toBeDefined();

    // 9 & 10. Staff creates and confirms a quotation
    const unitPriceWithVariant = plan.salesPrice + product.variants[0].additionalPrice; // 10000 + 560 = ₹10,560
    const quotation = await dbService.saveQuotation({
      customerId: customer.id,
      customerSnapshot: {
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        taxNumber: customer.taxNumber,
      },
      quotationDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'confirmed',
      lineItems: [
        {
          id: 'qli_test_1',
          productId: product.id,
          productName: product.name,
          variantId: product.variants[0].id,
          variantName: product.variants[0].name,
          planId: plan.id,
          planName: plan.name,
          quantity: 1,
          unitPrice: unitPriceWithVariant,
          subtotal: unitPriceWithVariant,
          taxAmount: 181080, // ~18%
          discountAmount: 50000, // ₹500
          total: 1187080,
        },
      ],
      subtotal: unitPriceWithVariant,
      taxTotal: 181080,
      discountTotal: 50000,
      grandTotal: 1187080,
      paymentTerms: 'Net 15 days',
      notes: 'Standard enterprise terms.',
      createdBy: 'staff_1',
    });
    expect(quotation.status).toBe('confirmed');

    // 11 & 12. Quotation converts into an Active Subscription
    const subscription = await dbService.convertQuotationToSubscription(quotation.id, 'staff_1');
    expect(subscription.status).toBe('active');
    expect(subscription.subscriptionNumber).toMatch(/^SUB-/);

    // 13 & 14. Billing date arrives -> Automated Recurring Billing Engine executes
    // Set next billing date to past/now to trigger billing
    subscription.nextBillingDate = new Date(Date.now() - 10000).toISOString();
    const subs = await dbService.getSubscriptions();
    const subIdx = subs.findIndex((s) => s.id === subscription.id);
    subs[subIdx] = subscription;
    localStorage.setItem('brightloop_subscriptions', JSON.stringify(subs));

    const billingJob = await dbService.runAutomatedBillingJob(new Date());
    expect(billingJob.invoicesGenerated).toBeGreaterThanOrEqual(1);

    // 15. Verify generated invoice snapshots
    const invoices = await dbService.getInvoices();
    const invoice = invoices.find((inv) => inv.subscriptionId === subscription.id);
    expect(invoice).toBeDefined();
    expect(invoice?.balanceDue).toBe(invoice?.grandTotal);
    expect(invoice?.status).toBe('confirmed');

    const totalInvoiceAmount = invoice!.grandTotal;

    // 16 & 17. Staff records a partial payment (50%)
    const partialAmount = Math.round(totalInvoiceAmount / 2);
    const partialPayment = await dbService.recordPayment({
      invoiceId: invoice!.id,
      amount: partialAmount,
      paymentMethod: 'bank_transfer',
      reference: 'UTR-PARTIAL-001',
      notes: '50% advance bank transfer',
      recordedBy: 'staff_1',
    });
    expect(partialPayment.status).toBe('completed');

    const invAfterPartial = await dbService.getInvoiceById(invoice!.id);
    expect(invAfterPartial?.status).toBe('partially_paid');
    expect(invAfterPartial?.amountPaid).toBe(partialAmount);
    expect(invAfterPartial?.balanceDue).toBe(totalInvoiceAmount - partialAmount);

    // 18 & 19. Staff records the remaining payment -> Invoice becomes fully Paid
    const remainingBalance = invAfterPartial!.balanceDue;
    const finalPayment = await dbService.recordPayment({
      invoiceId: invoice!.id,
      amount: remainingBalance,
      paymentMethod: 'bank_transfer',
      reference: 'UTR-FINAL-002',
      notes: 'Final balance clearance',
      recordedBy: 'staff_1',
    });
    expect(finalPayment.status).toBe('completed');

    const invAfterFinal = await dbService.getInvoiceById(invoice!.id);
    expect(invAfterFinal?.status).toBe('paid');
    expect(invAfterFinal?.balanceDue).toBe(0);

    // 20. Admin dashboard reflects the updated figures
    const metrics = await dbService.getDashboardMetrics();
    expect(metrics.revenueReceived).toBeGreaterThan(0);
    expect(metrics.totalSubscriptions).toBeGreaterThan(0);

    // 21. Customer account reflects total spent
    const updatedCust = await dbService.getCustomerById(customer.id);
    expect(updatedCust?.totalSpent).toBe(totalInvoiceAmount);
    expect(updatedCust?.outstandingBalance).toBe(0);
  });
});

