import { describe, it, expect } from 'vitest';
import { canTransitionSubscription, canTransitionQuotation, canTransitionInvoice } from '../utils/status';

describe('State Machines & Transition Guards', () => {
  it('should allow valid subscription transitions', () => {
    // Draft -> Quotation -> Confirmed -> Active -> Closed
    expect(canTransitionSubscription('draft', 'quotation').allowed).toBe(true);
    expect(canTransitionSubscription('quotation', 'confirmed').allowed).toBe(true);
    expect(canTransitionSubscription('confirmed', 'active').allowed).toBe(true);
    expect(canTransitionSubscription('active', 'paused', { allowPause: true }).allowed).toBe(true);
    expect(canTransitionSubscription('paused', 'active').allowed).toBe(true);
    expect(canTransitionSubscription('active', 'closed', { allowEarlyClosure: true }).allowed).toBe(true);
  });

  it('should reject invalid and unauthorized subscription transitions', () => {
    // Cannot jump draft straight to active
    expect(canTransitionSubscription('draft', 'active').allowed).toBe(false);
    // Cannot transition terminal closed state
    expect(canTransitionSubscription('closed', 'active').allowed).toBe(false);
    // Cannot pause if plan forbids pause
    const pauseDenied = canTransitionSubscription('active', 'paused', { allowPause: false });
    expect(pauseDenied.allowed).toBe(false);
    expect(pauseDenied.reason).toContain('does not permit pausing');
    // Cannot close early if plan forbids early closure
    const closeDenied = canTransitionSubscription('active', 'closed', { allowEarlyClosure: false });
    expect(closeDenied.allowed).toBe(false);
    expect(closeDenied.reason).toContain('does not permit early closure');
  });

  it('should validate quotation transitions', () => {
    expect(canTransitionQuotation('draft', 'sent').allowed).toBe(true);
    expect(canTransitionQuotation('sent', 'confirmed').allowed).toBe(true);
    expect(canTransitionQuotation('confirmed', 'converted').allowed).toBe(true);
    // Cannot jump draft directly to converted
    expect(canTransitionQuotation('draft', 'converted').allowed).toBe(false);
  });

  it('should validate invoice transitions and payment states', () => {
    expect(canTransitionInvoice('confirmed', 'partially_paid').allowed).toBe(true);
    expect(canTransitionInvoice('partially_paid', 'paid').allowed).toBe(true);
    expect(canTransitionInvoice('confirmed', 'overdue').allowed).toBe(true);
    // Cannot transition terminal paid state
    expect(canTransitionInvoice('paid', 'draft').allowed).toBe(false);
  });
});
