// State Machine Transition Guards & Status Utilities
// Built for Brightloop Subscription Management System

import { SubscriptionStatus, InvoiceStatus, QuotationStatus } from '../types';

/**
 * Valid subscription state machine transitions
 */
export const VALID_SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  draft: ['quotation', 'confirmed', 'closed'],
  quotation: ['confirmed', 'closed'],
  confirmed: ['active', 'closed'],
  active: ['paused', 'closed'],
  paused: ['active', 'closed'],
  closed: [], // Terminal state, unless renewed as a new subscription
};

export function canTransitionSubscription(
  currentStatus: SubscriptionStatus,
  targetStatus: SubscriptionStatus,
  permissions?: { allowEarlyClosure?: boolean; allowPause?: boolean }
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: 'Subscription is already in this status' };
  }

  const allowedNext = VALID_SUBSCRIPTION_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition subscription from '${currentStatus}' to '${targetStatus}'. Valid transitions are: ${allowedNext.join(', ') || 'none'}`,
    };
  }

  // Permission checks
  if (targetStatus === 'paused' && permissions?.allowPause === false) {
    return { allowed: false, reason: 'This subscription plan does not permit pausing.' };
  }

  if (targetStatus === 'closed' && currentStatus === 'active' && permissions?.allowEarlyClosure === false) {
    return { allowed: false, reason: 'This subscription plan does not permit early closure before its expiry.' };
  }

  return { allowed: true };
}

/**
 * Valid quotation state transitions
 */
export const VALID_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  draft: ['sent', 'confirmed', 'expired'],
  sent: ['confirmed', 'expired'],
  confirmed: ['converted', 'expired'],
  expired: [],
  converted: [],
};

export function canTransitionQuotation(
  currentStatus: QuotationStatus,
  targetStatus: QuotationStatus
): { allowed: boolean; reason?: string } {
  const allowed = VALID_QUOTATION_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition quotation from '${currentStatus}' to '${targetStatus}'.`,
    };
  }
  return { allowed: true };
}

/**
 * Valid invoice state transitions
 */
export const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['partially_paid', 'paid', 'overdue', 'cancelled'],
  partially_paid: ['paid', 'overdue', 'cancelled'],
  paid: [], // Terminal paid state, can be refunded or reversed via audited payment reversal
  overdue: ['partially_paid', 'paid', 'cancelled'],
  cancelled: [],
};

export function canTransitionInvoice(
  currentStatus: InvoiceStatus,
  targetStatus: InvoiceStatus
): { allowed: boolean; reason?: string } {
  const allowed = VALID_INVOICE_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition invoice from '${currentStatus}' to '${targetStatus}'.`,
    };
  }
  return { allowed: true };
}
