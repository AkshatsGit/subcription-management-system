// Shared Backend Types for Firebase Cloud Functions
// Built for Brightloop Subscription Management System

export type UserRole = 'admin' | 'staff' | 'customer';

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed';
export type InvoiceStatus = 'draft' | 'confirmed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'upi' | 'cheque' | 'cash';
export type PaymentStatus = 'completed' | 'reversed';

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerSnapshot {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  billingAddress: CustomerAddress;
  taxNumber?: string;
}

export interface PlanSnapshot {
  name: string;
  billingFrequency: BillingFrequency;
  salesPrice: number;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  autoCloseOnExpiry: boolean;
}

export interface TaxRuleRecord {
  id: string;
  name: string;
  ratePercentage: number;
  taxType: 'percentage' | 'fixed';
  fixedAmount?: number | null;
  applicableProductIds: string[];
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface DiscountRuleRecord {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minimumPurchaseAmount: number;
  minimumQuantity: number;
  maxUsages: number;
  currentUsages: number;
  startDate: string;
  endDate: string | null;
  applicableProductIds: string[];
  applicableSubscriptionIds: string[];
  isActive: boolean;
}

