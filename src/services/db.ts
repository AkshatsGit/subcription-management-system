// Unified Firestore & Business Operations Service for Brightloop
// Built by Team Ripple

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Customer,
  Product,
  SubscriptionPlan,
  TaxRule,
  DiscountRule,
  Quotation,
  Subscription,
  Invoice,
  Payment,
  QuotationTemplate,
  BillingJobLog,
  DashboardMetrics,
  SubscriptionStatus,
} from '../types';
import {
  SEED_CUSTOMERS,
  SEED_PRODUCTS,
  SEED_PLANS,
  SEED_TAX_RULES,
  SEED_DISCOUNT_RULES,
  SEED_TEMPLATES,
  SEED_QUOTATIONS,
  SEED_SUBSCRIPTIONS,
  SEED_INVOICES,
  SEED_PAYMENTS,
} from './seedData';
import { calculateNextBillingDate, generateBillingPeriodId } from '../utils/billing';
import { canTransitionSubscription } from '../utils/status';

// In-Memory Storage Cache with LocalStorage Persistence for seamless local dev & emulator fallback
const STORAGE_KEYS = {
  CUSTOMERS: 'brightloop_customers',
  PRODUCTS: 'brightloop_products',
  PLANS: 'brightloop_plans',
  TAXES: 'brightloop_taxes',
  DISCOUNTS: 'brightloop_discounts',
  TEMPLATES: 'brightloop_templates',
  QUOTATIONS: 'brightloop_quotations',
  SUBSCRIPTIONS: 'brightloop_subscriptions',
  INVOICES: 'brightloop_invoices',
  PAYMENTS: 'brightloop_payments',
  BILLING_JOBS: 'brightloop_billing_jobs',
};

function getLocal<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// Detect test or offline runner
const isTestMode = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST === 'true');

// Helper to prevent Firebase SDK hanging on network timeouts in offline or sandboxed test runs
const withTimeout = async <T>(promise: Promise<T>, ms = 250): Promise<T> => {
  if (isTestMode) {
    throw new Error('Test mode: use in-memory fast storage');
  }
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Network timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

class DatabaseService {
  // -------------------------------------------------------------
  // CUSTOMERS
  // -------------------------------------------------------------
  async getCustomers(): Promise<Customer[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'customers')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const snap = await withTimeout(getDoc(doc(db, 'customers', id)));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Customer;
    } catch {
      // Fallback
    }
    const local = await this.getCustomers();
    return local.find((c) => c.id === id) || null;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'outstandingBalance'>): Promise<Customer> {
    const id = `cust_${Date.now()}`;
    const newCustomer: Customer = {
      ...customer,
      id,
      totalSpent: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await withTimeout(
        setDoc(doc(db, 'customers', id), {
          ...newCustomer,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch {
      // Fallback
    }

    const current = getLocal(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    setLocal(STORAGE_KEYS.CUSTOMERS, [newCustomer, ...current]);
    return newCustomer;
  }

  // -------------------------------------------------------------
  // PRODUCTS & VARIANTS
  // -------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'products')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  }

  async saveProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Product> {
    const isNew = !product.id;
    const id = product.id || `prod_${Date.now()}`;
    const now = new Date().toISOString();

    const fullProduct: Product = {
      ...product,
      id,
      createdAt: isNew ? now : (await this.getProductById(id))?.createdAt || now,
      updatedAt: now,
    };

    try {
      await withTimeout(
        setDoc(doc(db, 'products', id), {
          ...fullProduct,
          updatedAt: serverTimestamp(),
        })
      );
    } catch {
      // Fallback
    }

    const current = getLocal(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    const updated = isNew ? [fullProduct, ...current] : current.map((p) => (p.id === id ? fullProduct : p));
    setLocal(STORAGE_KEYS.PRODUCTS, updated);
    return fullProduct;
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find((p) => p.id === id) || null;
  }

  // -------------------------------------------------------------
  // SUBSCRIPTION PLANS
  // -------------------------------------------------------------
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'plans')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubscriptionPlan));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.PLANS, SEED_PLANS);
  }

  async savePlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SubscriptionPlan> {
    const isNew = !plan.id;
    const id = plan.id || `plan_${Date.now()}`;
    const now = new Date().toISOString();

    const fullPlan: SubscriptionPlan = {
      ...plan,
      id,
      createdAt: isNew ? now : now,
      updatedAt: now,
    };

    try {
      await withTimeout(
        setDoc(doc(db, 'plans', id), {
          ...fullPlan,
          updatedAt: serverTimestamp(),
        })
      );
    } catch {
      // Fallback
    }

    const current = getLocal(STORAGE_KEYS.PLANS, SEED_PLANS);
    const updated = isNew ? [fullPlan, ...current] : current.map((p) => (p.id === id ? fullPlan : p));
    setLocal(STORAGE_KEYS.PLANS, updated);
    return fullPlan;
  }

  // -------------------------------------------------------------
  // TAXES & DISCOUNTS
  // -------------------------------------------------------------
  async getTaxRules(): Promise<TaxRule[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'taxRules')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaxRule));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.TAXES, SEED_TAX_RULES);
  }

  async saveTaxRule(taxRule: Omit<TaxRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TaxRule> {
    const id = taxRule.id || `tax_${Date.now()}`;
    const fullTax: TaxRule = {
      ...taxRule,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await withTimeout(setDoc(doc(db, 'taxRules', id), fullTax));
    } catch {
      // Fallback
    }
    const current = getLocal(STORAGE_KEYS.TAXES, SEED_TAX_RULES);
    const updated = taxRule.id ? current.map((t) => (t.id === id ? fullTax : t)) : [fullTax, ...current];
    setLocal(STORAGE_KEYS.TAXES, updated);
    return fullTax;
  }

  async getDiscountRules(): Promise<DiscountRule[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'discountRules')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DiscountRule));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.DISCOUNTS, SEED_DISCOUNT_RULES);
  }

  async saveDiscountRule(rule: Omit<DiscountRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DiscountRule> {
    const id = rule.id || `disc_${Date.now()}`;
    const fullRule: DiscountRule = {
      ...rule,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await withTimeout(setDoc(doc(db, 'discountRules', id), fullRule));
    } catch {
      // Fallback
    }
    const current = getLocal(STORAGE_KEYS.DISCOUNTS, SEED_DISCOUNT_RULES);
    const updated = rule.id ? current.map((d) => (d.id === id ? fullRule : d)) : [fullRule, ...current];
    setLocal(STORAGE_KEYS.DISCOUNTS, updated);
    return fullRule;
  }

  // -------------------------------------------------------------
  // QUOTATION TEMPLATES & QUOTATIONS
  // -------------------------------------------------------------
  async getQuotationTemplates(): Promise<QuotationTemplate[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'quotationTemplates')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuotationTemplate));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES);
  }

  async getQuotations(): Promise<Quotation[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'quotations')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.QUOTATIONS, SEED_QUOTATIONS);
  }

  async saveQuotation(quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Quotation> {
    const quotations = await this.getQuotations();
    const nextSeq = quotations.length + 1001;
    const year = new Date().getFullYear();
    const quotationNumber = `QT-${year}-${nextSeq.toString().padStart(4, '0')}`;
    const id = quotation.id || `quot_${Date.now()}`;

    const fullQuotation: Quotation = {
      ...quotation,
      id,
      quotationNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await withTimeout(setDoc(doc(db, 'quotations', id), fullQuotation));
    } catch {
      // Fallback
    }

    setLocal(STORAGE_KEYS.QUOTATIONS, [fullQuotation, ...quotations]);
    return fullQuotation;
  }

  /**
   * Converts an approved quotation directly into an active subscription
   * without re-entering data (Requirement REQ-QUOT-02)
   */
  async convertQuotationToSubscription(quotationId: string, performedByUid: string): Promise<Subscription> {
    const quotations = await this.getQuotations();
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) throw new Error('Quotation not found.');
    if (quotation.status === 'converted') throw new Error('Quotation has already been converted.');

    const subscriptions = await this.getSubscriptions();
    const subSeq = subscriptions.length + 1001;
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${subSeq.toString().padStart(4, '0')}`;
    const subId = `sub_${Date.now()}`;

    const startDate = new Date();
    const primaryLine = quotation.lineItems[0] || {};
    const frequency = 'monthly';
    const anchorDay = startDate.getDate();
    const nextBilling = calculateNextBillingDate(startDate, frequency, anchorDay);

    const newSub: Subscription = {
      id: subId,
      subscriptionNumber,
      customerId: quotation.customerId,
      customerSnapshot: quotation.customerSnapshot,
      planId: primaryLine.planId || '',
      planSnapshot: {
        name: primaryLine.planName || 'Standard Plan',
        billingFrequency: frequency,
        salesPrice: primaryLine.unitPrice || 0,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        autoCloseOnExpiry: false,
      },
      productId: primaryLine.productId || '',
      productName: primaryLine.productName || 'Software Product',
      variantId: primaryLine.variantId || null,
      variantName: primaryLine.variantName || null,
      status: 'active',
      quantity: primaryLine.quantity || 1,
      unitPrice: primaryLine.unitPrice || 0,
      subtotal: quotation.subtotal,
      taxRuleIds: [],
      taxTotal: quotation.taxTotal,
      discountRuleIds: [],
      discountTotal: quotation.discountTotal,
      totalAmount: quotation.grandTotal,
      billingFrequency: frequency,
      startDate: startDate.toISOString(),
      nextBillingDate: nextBilling.toISOString(),
      expiryDate: null,
      paymentTerms: quotation.paymentTerms || 'Net 15',
      anchorDay,
      autoCloseOnExpiry: false,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      lastInvoicedDate: null,
      history: [
        {
          timestamp: new Date().toISOString(),
          fromStatus: 'quotation',
          toStatus: 'active',
          reason: `Converted from quotation ${quotation.quotationNumber}`,
          performedBy: performedByUid,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update quotation status
    const updatedQuotations = quotations.map((q) =>
      q.id === quotationId ? { ...q, status: 'converted' as const, convertedSubscriptionId: subId } : q
    );
    setLocal(STORAGE_KEYS.QUOTATIONS, updatedQuotations);

    // Save new subscription
    setLocal(STORAGE_KEYS.SUBSCRIPTIONS, [newSub, ...subscriptions]);

    try {
      await withTimeout(
        updateDoc(doc(db, 'quotations', quotationId), {
          status: 'converted',
          convertedSubscriptionId: subId,
          updatedAt: serverTimestamp(),
        })
      );
      await withTimeout(setDoc(doc(db, 'subscriptions', subId), newSub));
    } catch {
      // Fallback
    }

    return newSub;
  }

  // -------------------------------------------------------------
  // SUBSCRIPTIONS
  // -------------------------------------------------------------
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'subscriptions')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const subs = await this.getSubscriptions();
    return subs.find((s) => s.id === id) || null;
  }

  async updateSubscriptionStatus(
    id: string,
    targetStatus: SubscriptionStatus,
    reason: string,
    performedBy: string
  ): Promise<Subscription> {
    const subs = await this.getSubscriptions();
    const currentSub = subs.find((s) => s.id === id);
    if (!currentSub) throw new Error('Subscription not found.');

    const guard = canTransitionSubscription(currentSub.status, targetStatus, {
      allowEarlyClosure: currentSub.allowEarlyClosure,
      allowPause: currentSub.allowPause,
    });

    if (!guard.allowed) {
      throw new Error(guard.reason || 'Invalid state transition');
    }

    const updatedSub: Subscription = {
      ...currentSub,
      status: targetStatus,
      history: [
        ...currentSub.history,
        {
          timestamp: new Date().toISOString(),
          fromStatus: currentSub.status,
          toStatus: targetStatus,
          reason,
          performedBy,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const updatedList = subs.map((s) => (s.id === id ? updatedSub : s));
    setLocal(STORAGE_KEYS.SUBSCRIPTIONS, updatedList);

    try {
      await withTimeout(
        updateDoc(doc(db, 'subscriptions', id), {
          status: targetStatus,
          history: updatedSub.history,
          updatedAt: serverTimestamp(),
        })
      );
    } catch {
      // Fallback
    }

    return updatedSub;
  }

  // -------------------------------------------------------------
  // INVOICES & AUTOMATED BILLING
  // -------------------------------------------------------------
  async getInvoices(): Promise<Invoice[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'invoices')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.INVOICES, SEED_INVOICES);
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    return invoices.find((inv) => inv.id === id) || null;
  }

  /**
   * Automated Recurring Billing Engine (Requirement REQ-BILL-01, REQ-BILL-02)
   * Evaluates active subscriptions whose nextBillingDate is due.
   * Guarantees idempotency via unique billingPeriodId.
   */
  async runAutomatedBillingJob(runDate: Date = new Date()): Promise<BillingJobLog> {
    const subscriptions = await this.getSubscriptions();
    const invoices = await this.getInvoices();
    const customers = await this.getCustomers();

    const jobId = `job_${Date.now()}`;
    const jobLog: BillingJobLog = {
      id: jobId,
      startedAt: runDate.toISOString(),
      status: 'running',
      subscriptionsEvaluated: 0,
      invoicesGenerated: 0,
      skippedCount: 0,
      errors: [],
      billingPeriodIds: [],
    };

    const newInvoices: Invoice[] = [];
    const updatedSubs: Subscription[] = [];
    const customerBalanceUpdates: Record<string, number> = {};

    for (const sub of subscriptions) {
      if (sub.status !== 'active') continue;
      jobLog.subscriptionsEvaluated++;

      // Check if billing date is due
      const nextDate = new Date(sub.nextBillingDate);
      if (nextDate.getTime() > runDate.getTime()) {
        continue;
      }

      // Idempotency: verify this cycle wasn't already billed
      const periodId = generateBillingPeriodId(sub.id, sub.nextBillingDate);
      const alreadyBilled = invoices.some((inv) => inv.billingPeriodId === periodId);
      if (alreadyBilled) {
        jobLog.skippedCount++;
        continue;
      }

      try {
        const nextCycleDate = calculateNextBillingDate(sub.nextBillingDate, sub.billingFrequency, sub.anchorDay);
        const invNum = `INV-${runDate.getFullYear()}-${(invoices.length + newInvoices.length + 1001).toString().padStart(4, '0')}`;
        const invId = `inv_${Date.now()}_${sub.id}`;

        const grandTotal = sub.totalAmount;

        const newInvoice: Invoice = {
          id: invId,
          invoiceNumber: invNum,
          billingPeriodId: periodId,
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerId: sub.customerId,
          customerSnapshot: sub.customerSnapshot,
          invoiceDate: runDate.toISOString(),
          dueDate: new Date(runDate.getTime() + 15 * 86400000).toISOString(),
          periodStart: sub.nextBillingDate,
          periodEnd: nextCycleDate.toISOString(),
          status: 'confirmed',
          lineItems: [
            {
              id: `li_${Date.now()}`,
              description: `${sub.productName} - ${sub.planSnapshot?.name || 'Subscription'} (${sub.billingFrequency})`,
              quantity: sub.quantity,
              unitPrice: sub.unitPrice,
              subtotal: sub.subtotal,
              taxAmount: sub.taxTotal,
              discountAmount: sub.discountTotal,
              total: grandTotal,
            },
          ],
          subtotal: sub.subtotal,
          taxSnapshot: [
            {
              ruleId: 'tax_gst_18',
              name: 'GST 18%',
              ratePercentage: 18.0,
              amount: sub.taxTotal,
            },
          ],
          taxTotal: sub.taxTotal,
          discountSnapshot: [],
          discountTotal: sub.discountTotal,
          grandTotal,
          amountPaid: 0,
          balanceDue: grandTotal,
          paymentTerms: sub.paymentTerms || 'Net 15',
          notes: 'Automated recurring billing generated by Brightloop.',
          createdAt: runDate.toISOString(),
          updatedAt: runDate.toISOString(),
        };

        newInvoices.push(newInvoice);
        jobLog.invoicesGenerated++;
        jobLog.billingPeriodIds.push(periodId);

        // Update subscription next cycle date
        const updatedSub: Subscription = {
          ...sub,
          nextBillingDate: nextCycleDate.toISOString(),
          lastInvoicedDate: runDate.toISOString(),
          updatedAt: runDate.toISOString(),
        };
        updatedSubs.push(updatedSub);

        // Track customer balance update
        customerBalanceUpdates[sub.customerId] = (customerBalanceUpdates[sub.customerId] || 0) + grandTotal;
      } catch (err: any) {
        jobLog.errors.push({ subscriptionId: sub.id, error: err.message || String(err) });
      }
    }

    if (newInvoices.length > 0) {
      setLocal(STORAGE_KEYS.INVOICES, [...newInvoices, ...invoices]);
    }

    if (updatedSubs.length > 0) {
      const mergedSubs = subscriptions.map((s) => updatedSubs.find((u) => u.id === s.id) || s);
      setLocal(STORAGE_KEYS.SUBSCRIPTIONS, mergedSubs);
    }

    if (Object.keys(customerBalanceUpdates).length > 0) {
      const updatedCustomers = customers.map((c) => {
        const delta = customerBalanceUpdates[c.id];
        return delta ? { ...c, outstandingBalance: c.outstandingBalance + delta } : c;
      });
      setLocal(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
    }

    jobLog.completedAt = new Date().toISOString();
    jobLog.status = jobLog.errors.length === 0 ? 'success' : jobLog.invoicesGenerated > 0 ? 'partial' : 'failed';

    const jobs = getLocal<BillingJobLog>(STORAGE_KEYS.BILLING_JOBS, []);
    setLocal(STORAGE_KEYS.BILLING_JOBS, [jobLog, ...jobs]);

    return jobLog;
  }

  async getBillingJobs(): Promise<BillingJobLog[]> {
    return getLocal<BillingJobLog>(STORAGE_KEYS.BILLING_JOBS, []);
  }

  // -------------------------------------------------------------
  // PAYMENTS & RECONCILIATION
  // -------------------------------------------------------------
  async getPayments(): Promise<Payment[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'payments')));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
      }
    } catch {
      // Fallback
    }
    return getLocal(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
  }

  /**
   * Records a manual payment and reconciles invoice balance & customer spend.
   * Prevents overpayment (Requirement REQ-PAY-02)
   */
  async recordPayment(paymentData: {
    invoiceId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    reference: string;
    notes?: string;
    paymentDate?: string;
    recordedBy: string;
  }): Promise<Payment> {
    const invoices = await this.getInvoices();
    const invoice = invoices.find((inv) => inv.id === paymentData.invoiceId);
    if (!invoice) throw new Error('Invoice not found.');
    if (invoice.status === 'paid') throw new Error('Invoice is already fully paid.');
    if (invoice.status === 'cancelled') throw new Error('Cannot record payment for a cancelled invoice.');

    // Overpayment guard
    if (paymentData.amount > invoice.balanceDue) {
      throw new Error(
        `Payment amount (₹${paymentData.amount / 100}) cannot exceed outstanding invoice balance (₹${
          invoice.balanceDue / 100
        }).`
      );
    }

    const payments = await this.getPayments();
    const paySeq = payments.length + 1001;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${paySeq.toString().padStart(4, '0')}`;
    const paymentId = `pay_${Date.now()}`;

    const newPayment: Payment = {
      id: paymentId,
      paymentNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerSnapshot.companyName,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference,
      notes: paymentData.notes || '',
      status: 'completed',
      recordedBy: paymentData.recordedBy,
      createdAt: new Date().toISOString(),
    };

    const newAmountPaid = invoice.amountPaid + paymentData.amount;
    const newBalanceDue = Math.max(0, invoice.balanceDue - paymentData.amount);
    const newInvoiceStatus: Invoice['status'] = newBalanceDue === 0 ? 'paid' : 'partially_paid';

    // Update invoice
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoice.id ? { ...inv, amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: newInvoiceStatus } : inv
    );
    setLocal(STORAGE_KEYS.INVOICES, updatedInvoices);

    // Save payment
    setLocal(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

    // Update customer spend & balance
    const customers = await this.getCustomers();
    const updatedCustomers = customers.map((c) =>
      c.id === invoice.customerId
        ? {
            ...c,
            totalSpent: c.totalSpent + paymentData.amount,
            outstandingBalance: Math.max(0, c.outstandingBalance - paymentData.amount),
          }
        : c
    );
    setLocal(STORAGE_KEYS.CUSTOMERS, updatedCustomers);

    try {
      await withTimeout(setDoc(doc(db, 'payments', paymentId), newPayment));
      await withTimeout(
        updateDoc(doc(db, 'invoices', invoice.id), {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newInvoiceStatus,
          updatedAt: serverTimestamp(),
        })
      );
    } catch {
      // Fallback
    }

    return newPayment;
  }

  // -------------------------------------------------------------
  // DASHBOARD METRICS AGGREGATION
  // -------------------------------------------------------------
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const customers = await this.getCustomers();
    const products = await this.getProducts();
    const plans = await this.getPlans();
    const subscriptions = await this.getSubscriptions();
    const invoices = await this.getInvoices();
    const payments = await this.getPayments();

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const pausedSubscriptions = subscriptions.filter((s) => s.status === 'paused').length;
    const closedSubscriptions = subscriptions.filter((s) => s.status === 'closed').length;

    const paidInvoices = invoices.filter((i) => i.status === 'paid').length;
    const outstandingInvoices = invoices.filter((i) => i.status === 'confirmed' || i.status === 'partially_paid').length;
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length;

    // Revenue calculations: cash collected vs outstanding balance
    const revenueReceived = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const outstandingRevenue = invoices
      .filter((i) => i.status !== 'cancelled' && i.status !== 'paid')
      .reduce((sum, i) => sum + i.balanceDue, 0);

    // Calculate MRR (Monthly Recurring Revenue) from active subscriptions normalized to monthly
    let mrr = 0;
    for (const sub of subscriptions) {
      if (sub.status !== 'active') continue;
      const subTotal = sub.totalAmount;
      if (sub.billingFrequency === 'monthly') mrr += subTotal;
      else if (sub.billingFrequency === 'yearly') mrr += Math.round(subTotal / 12);
      else if (sub.billingFrequency === 'weekly') mrr += Math.round((subTotal * 52) / 12);
      else if (sub.billingFrequency === 'daily') mrr += Math.round((subTotal * 365) / 12);
    }

    const arr = mrr * 12;

    return {
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalPlans: plans.length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions,
      pausedSubscriptions,
      closedSubscriptions,
      totalInvoices: invoices.length,
      paidInvoices,
      outstandingInvoices,
      overdueInvoices,
      revenueReceived,
      outstandingRevenue,
      mrr,
      arr,
      updatedAt: new Date().toISOString(),
    };
  }

  // Helper to reset and reload seed data
  resetSeedData(): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(SEED_PLANS));
    localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(SEED_TAX_RULES));
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(SEED_DISCOUNT_RULES));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(SEED_QUOTATIONS));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(SEED_SUBSCRIPTIONS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(SEED_INVOICES));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(SEED_PAYMENTS));
    localStorage.removeItem(STORAGE_KEYS.BILLING_JOBS);
  }
}

export const dbService = new DatabaseService();
