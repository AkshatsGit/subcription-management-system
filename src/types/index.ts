// Core Domain Types for Brightloop Subscription Management System
// Built by Team Ripple

export type UserRole = 'admin' | 'staff' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  customerId?: string | null;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string; // ISO date string or Firestore Timestamp
  updatedAt: string;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: CustomerAddress;
  taxNumber?: string;
  userId?: string | null;
  status: 'active' | 'inactive';
  totalSpent: number; // In minor units (cents / paise)
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  description: string;
  additionalPrice: number; // in minor units
  isActive: boolean;
}

export type ProductType = 'software' | 'service' | 'addon';

export interface Product {
  id: string;
  name: string;
  code: string; // SKU
  description: string;
  productType: ProductType;
  salesPrice: number; // in minor units
  costPrice: number;
  currency: string;
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  productId: string;
  productName: string;
  name: string;
  description: string;
  salesPrice: number; // Base plan price in minor units
  billingFrequency: BillingFrequency;
  minimumQuantity: number;
  availableFrom: string; // ISO string
  availableUntil: string | null;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  autoCloseOnExpiry: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationLineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string | null;
  variantName?: string | null;
  planId: string;
  planName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'expired' | 'converted';

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QT-2026-0001
  customerId: string;
  customerSnapshot: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    billingAddress: CustomerAddress;
    taxNumber?: string;
  };
  quotationDate: string;
  expiryDate: string;
  status: QuotationStatus;
  lineItems: QuotationLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentTerms: string;
  notes: string;
  convertedSubscriptionId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string;
  defaultValidityDays: number;
  defaultTerms: string;
  defaultNotes: string;
  lineItems: Array<{
    productId: string;
    variantId?: string;
    planId: string;
    quantity: number;
    unitPrice: number;
    description: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed';

export interface SubscriptionStatusHistory {
  timestamp: string;
  fromStatus: SubscriptionStatus;
  toStatus: SubscriptionStatus;
  reason: string;
  performedBy: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string; // e.g. SUB-2026-0001
  customerId: string;
  customerSnapshot: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    billingAddress: CustomerAddress;
    taxNumber?: string;
  };
  planId: string;
  planSnapshot: {
    name: string;
    billingFrequency: BillingFrequency;
    salesPrice: number;
    allowEarlyClosure: boolean;
    allowPause: boolean;
    allowRenewal: boolean;
    autoCloseOnExpiry: boolean;
  };
  productId: string;
  productName: string;
  variantId?: string | null;
  variantName?: string | null;
  status: SubscriptionStatus;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRuleIds: string[];
  taxTotal: number;
  discountRuleIds: string[];
  discountTotal: number;
  totalAmount: number;
  billingFrequency: BillingFrequency;
  startDate: string;
  nextBillingDate: string;
  expiryDate: string | null;
  paymentTerms: string;
  anchorDay: number; // The target day of month (e.g. 31) for accurate month-end clamping
  autoCloseOnExpiry: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  lastInvoicedDate: string | null;
  history: SubscriptionStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceTaxSnapshot {
  ruleId: string;
  name: string;
  ratePercentage: number;
  amount: number;
}

export interface InvoiceDiscountSnapshot {
  ruleId: string;
  code: string;
  name: string;
  amount: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  billingPeriodId: string; // Idempotency key: `${subscriptionId}_${cycleDate}`
  subscriptionId: string;
  subscriptionNumber?: string;
  customerId: string;
  customerSnapshot: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    billingAddress: CustomerAddress;
    taxNumber?: string;
  };
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxSnapshot: InvoiceTaxSnapshot[];
  taxTotal: number;
  discountSnapshot: InvoiceDiscountSnapshot[];
  discountTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentTerms: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'upi' | 'cheque' | 'cash';
export type PaymentStatus = 'completed' | 'reversed';

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. PAY-2026-0001
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference: string; // Transaction / Cheque / UTR number
  notes: string;
  status: PaymentStatus;
  recordedBy: string;
  reversalReason?: string | null;
  reversedAt?: string | null;
  createdAt: string;
}

export interface TaxRule {
  id: string;
  name: string;
  ratePercentage: number; // e.g. 18.0 for 18%
  taxType: 'percentage' | 'fixed';
  fixedAmount?: number | null;
  applicableProductIds: string[]; // empty means applies to all products
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  value: number; // percentage value (e.g. 15 for 15%) or fixed minor units (e.g. 5000 for ₹50.00)
  minimumPurchaseAmount: number;
  minimumQuantity: number;
  maxUsages: number; // 0 = unlimited
  currentUsages: number;
  startDate: string;
  endDate: string | null;
  applicableProductIds: string[];
  applicableSubscriptionIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountUsage {
  id: string;
  discountRuleId: string;
  discountCode: string;
  customerId: string;
  invoiceId: string;
  amountSaved: number;
  timestamp: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalProducts: number;
  totalPlans: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  closedSubscriptions: number;
  totalInvoices: number;
  paidInvoices: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  revenueReceived: number; // actual cash collected
  outstandingRevenue: number; // invoiced but unpaid
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue (MRR * 12)
  updatedAt: string;
}

export interface BillingJobLog {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  subscriptionsEvaluated: number;
  invoicesGenerated: number;
  skippedCount: number;
  errors: Array<{ subscriptionId: string; error: string }>;
  billingPeriodIds: string[];
}
