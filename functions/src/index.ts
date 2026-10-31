// Brightloop Subscription Management System — Cloud Functions
// Built by Team Ripple

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { format } from 'date-fns';
import { calculateNextBillingDate, generateBillingPeriodId } from './billing/billingEngine';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Helper: Verify admin role
function requireAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const token = context.auth.token;
  if (token.role !== 'admin' && !token.email?.endsWith('@brightloop.admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Only system administrators can perform this action.');
  }
}

// Helper: Verify staff or admin role
function requireStaffOrAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const token = context.auth.token;
  if (token.role !== 'admin' && token.role !== 'staff' && !token.email?.endsWith('@brightloop.admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Staff or admin privileges required.');
  }
}

/**
 * 1. Secure Initial Admin Provisioning Procedure
 * Creates or promotes the initial admin user if no admin exists yet.
 */
export const bootstrapInitialAdmin = functions.https.onCall(async (data, _context) => {
  const { email, password, displayName } = data;
  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and password are required.');
  }

  // Check if an admin already exists in users collection
  const existingAdminSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (!existingAdminSnapshot.empty) {
    throw new functions.https.HttpsError('already-exists', 'An administrator account already exists. Use the admin dashboard to manage staff.');
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || 'System Administrator',
      });
    } else {
      throw err;
    }
  }

  // Set custom claims
  await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

  // Store user record in Firestore
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: userRecord.displayName || displayName || 'System Administrator',
    role: 'admin',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Initial administrator provisioned successfully.', uid: userRecord.uid };
});

/**
 * 2. Create Staff Account (Admin Only)
 */
export const createStaffUser = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { email, password, displayName, phoneNumber } = data;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, password, and displayName are required.');
  }

  // Create Firebase Auth user
  const userRecord = await auth.createUser({
    email,
    password,
    displayName,
    phoneNumber: phoneNumber || undefined,
  });

  // Assign custom claims
  await auth.setCustomUserClaims(userRecord.uid, { role: 'staff' });

  // Create user profile in Firestore
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    displayName,
    phoneNumber: phoneNumber || null,
    role: 'staff',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log audit event
  await db.collection('auditLogs').add({
    action: 'STAFF_CREATED',
    performedBy: context.auth!.uid,
    targetUid: userRecord.uid,
    email,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, uid: userRecord.uid };
});

/**
 * 3. Quotation to Subscription Conversion
 */
export const convertQuotationToSubscription = functions.https.onCall(async (data, context) => {
  requireStaffOrAdmin(context);

  const { quotationId, startDate } = data;
  if (!quotationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Quotation ID is required.');
  }

  return await db.runTransaction(async (transaction) => {
    const quotationRef = db.collection('quotations').doc(quotationId);
    const quotationDoc = await transaction.get(quotationRef);

    if (!quotationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Quotation not found.');
    }

    const qData = quotationDoc.data()!;
    if (qData.status === 'converted') {
      throw new functions.https.HttpsError('failed-precondition', 'Quotation has already been converted.');
    }

    // Check expiry
    const expiry = qData.expiryDate ? new Date(qData.expiryDate).getTime() : 0;
    if (expiry > 0 && expiry < Date.now()) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot convert an expired quotation.');
    }

    // Generate unique sequential subscription number
    const subSeqRef = db.collection('counters').doc('subscriptions');
    const subSeqDoc = await transaction.get(subSeqRef);
    let nextNum = 1001;
    if (subSeqDoc.exists && subSeqDoc.data()?.current) {
      nextNum = subSeqDoc.data()!.current + 1;
    }
    transaction.set(subSeqRef, { current: nextNum }, { merge: true });

    const subscriptionNumber = `SUB-${format(new Date(), 'yyyy')}-${nextNum.toString().padStart(4, '0')}`;
    const newSubRef = db.collection('subscriptions').doc();

    const start = startDate ? new Date(startDate) : new Date();
    const primaryLine = qData.lineItems?.[0] || {};
    const frequency = primaryLine.billingFrequency || 'monthly';
    const anchorDay = start.getDate();
    const nextBilling = calculateNextBillingDate(start, frequency, anchorDay);

    const subscriptionData = {
      id: newSubRef.id,
      subscriptionNumber,
      customerId: qData.customerId,
      customerSnapshot: qData.customerSnapshot,
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
      subtotal: qData.subtotal || 0,
      taxRuleIds: [],
      taxTotal: qData.taxTotal || 0,
      discountRuleIds: [],
      discountTotal: qData.discountTotal || 0,
      totalAmount: qData.grandTotal || 0,
      billingFrequency: frequency,
      startDate: start.toISOString(),
      nextBillingDate: nextBilling.toISOString(),
      expiryDate: null,
      paymentTerms: qData.paymentTerms || 'Immediate',
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
          reason: `Converted from quotation ${qData.quotationNumber}`,
          performedBy: context.auth!.uid,
        },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    transaction.set(newSubRef, subscriptionData);
    transaction.update(quotationRef, {
      status: 'converted',
      convertedSubscriptionId: newSubRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      subscriptionId: newSubRef.id,
      subscriptionNumber,
    };
  });
});

/**
 * 4. Automated Recurring Billing Engine (Scheduled & Manual Trigger)
 * Implements strict idempotency, duplicate prevention, and transaction safety.
 */
export async function executeRecurringBillingBatch(runDate: Date = new Date()) {
  const jobId = `job_${Date.now()}`;
  const nowIso = runDate.toISOString();

  // Create billing job record
  const jobRef = db.collection('billingJobs').doc(jobId);
  await jobRef.set({
    id: jobId,
    startedAt: nowIso,
    status: 'running',
    subscriptionsEvaluated: 0,
    invoicesGenerated: 0,
    skippedCount: 0,
    errors: [],
    billingPeriodIds: [],
  });

  // Query all active subscriptions where nextBillingDate <= nowIso
  const dueSubscriptionsSnapshot = await db
    .collection('subscriptions')
    .where('status', '==', 'active')
    .where('nextBillingDate', '<=', nowIso)
    .get();

  let evaluated = 0;
  let generated = 0;
  let skipped = 0;
  const errors: Array<{ subscriptionId: string; error: string }> = [];
  const processedPeriodIds: string[] = [];

  for (const doc of dueSubscriptionsSnapshot.docs) {
    evaluated++;
    const sub = doc.data();
    const periodId = generateBillingPeriodId(doc.id, sub.nextBillingDate);

    try {
      await db.runTransaction(async (transaction) => {
        // Idempotency check: Look up existing invoice with this billingPeriodId
        const existingInvQuery = await db
          .collection('invoices')
          .where('billingPeriodId', '==', periodId)
          .limit(1)
          .get();

        if (!existingInvQuery.empty) {
          skipped++;
          return;
        }

        // Generate invoice number
        const invSeqRef = db.collection('counters').doc('invoices');
        const invSeqDoc = await transaction.get(invSeqRef);
        let nextInvNum = 1001;
        if (invSeqDoc.exists && invSeqDoc.data()?.current) {
          nextInvNum = invSeqDoc.data()!.current + 1;
        }
        transaction.set(invSeqRef, { current: nextInvNum }, { merge: true });

        const invoiceNumber = `INV-${format(runDate, 'yyyy')}-${nextInvNum.toString().padStart(4, '0')}`;
        const newInvRef = db.collection('invoices').doc();

        // Calculate next cycle date
        const nextBilling = calculateNextBillingDate(
          sub.nextBillingDate,
          sub.billingFrequency,
          sub.anchorDay || new Date(sub.nextBillingDate).getDate()
        );

        const subtotal = sub.subtotal || (sub.unitPrice * sub.quantity) || 0;
        const taxTotal = sub.taxTotal || 0;
        const discountTotal = sub.discountTotal || 0;
        const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

        const invoiceData = {
          id: newInvRef.id,
          invoiceNumber,
          billingPeriodId: periodId,
          subscriptionId: doc.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerId: sub.customerId,
          customerSnapshot: sub.customerSnapshot,
          invoiceDate: runDate.toISOString(),
          dueDate: new Date(runDate.getTime() + 15 * 86400000).toISOString(), // 15-day due date
          periodStart: sub.nextBillingDate,
          periodEnd: nextBilling.toISOString(),
          status: 'confirmed',
          lineItems: [
            {
              id: 'line_1',
              description: `${sub.productName} - ${sub.planSnapshot?.name || 'Subscription'} (${sub.billingFrequency})`,
              quantity: sub.quantity,
              unitPrice: sub.unitPrice,
              subtotal,
              taxAmount: taxTotal,
              discountAmount: discountTotal,
              total: grandTotal,
            },
          ],
          subtotal,
          taxSnapshot: [],
          taxTotal,
          discountSnapshot: [],
          discountTotal,
          grandTotal,
          amountPaid: 0,
          balanceDue: grandTotal,
          paymentTerms: sub.paymentTerms || 'Net 15',
          notes: 'Automated recurring billing generated by Brightloop.',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Write invoice
        transaction.set(newInvRef, invoiceData);

        // Update subscription next billing date & last invoiced date
        transaction.update(doc.ref, {
          nextBillingDate: nextBilling.toISOString(),
          lastInvoicedDate: runDate.toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Record billing event
        const eventRef = db.collection('billingEvents').doc();
        transaction.set(eventRef, {
          id: eventRef.id,
          jobId,
          subscriptionId: doc.id,
          invoiceId: newInvRef.id,
          billingPeriodId: periodId,
          amount: grandTotal,
          status: 'success',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update customer outstanding balance
        const customerRef = db.collection('customers').doc(sub.customerId);
        transaction.update(customerRef, {
          outstandingBalance: admin.firestore.FieldValue.increment(grandTotal),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        generated++;
        processedPeriodIds.push(periodId);
      });
    } catch (err: any) {
      errors.push({ subscriptionId: doc.id, error: err.message || String(err) });
    }
  }

  // Update billing job status
  await jobRef.update({
    completedAt: new Date().toISOString(),
    status: errors.length === 0 ? 'success' : generated > 0 ? 'partial' : 'failed',
    subscriptionsEvaluated: evaluated,
    invoicesGenerated: generated,
    skippedCount: skipped,
    errors,
    billingPeriodIds: processedPeriodIds,
  });

  return {
    jobId,
    subscriptionsEvaluated: evaluated,
    invoicesGenerated: generated,
    skippedCount: skipped,
    errors,
  };
}

/**
 * 5. Callable Recurring Billing Runner for On-Demand Operational Trigger
 */
export const triggerRecurringBilling = functions.https.onCall(async (_data, context) => {
  requireStaffOrAdmin(context);
  const result = await executeRecurringBillingBatch(new Date());
  return result;
});

/**
 * 6. Scheduled Cloud Function (Runs Daily at 00:00 UTC)
 */
export const scheduledDailyRecurringBilling = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (_context) => {
    console.info('[ScheduledBilling] Running daily automated recurring billing job...');
    const result = await executeRecurringBillingBatch(new Date());
    console.info('[ScheduledBilling] Result:', JSON.stringify(result));
    return null;
  });

/**
 * 7. Manual Payment Recording & Reconciliation Function
 */
export const recordPayment = functions.https.onCall(async (data, context) => {
  requireStaffOrAdmin(context);

  const { invoiceId, amount, paymentDate, paymentMethod, reference, notes } = data;
  if (!invoiceId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid invoiceId and positive amount are required.');
  }

  return await db.runTransaction(async (transaction) => {
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    const invoiceDoc = await transaction.get(invoiceRef);

    if (!invoiceDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invoice not found.');
    }

    const inv = invoiceDoc.data()!;
    if (inv.status === 'paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Invoice is already fully paid.');
    }
    if (inv.status === 'cancelled') {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot record payment for a cancelled invoice.');
    }

    // Overpayment validation
    if (amount > inv.balanceDue) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Payment amount (₹${amount / 100}) exceeds the invoice balance due (₹${inv.balanceDue / 100}).`
      );
    }

    // Generate payment sequence
    const paySeqRef = db.collection('counters').doc('payments');
    const paySeqDoc = await transaction.get(paySeqRef);
    let nextPayNum = 1001;
    if (paySeqDoc.exists && paySeqDoc.data()?.current) {
      nextPayNum = paySeqDoc.data()!.current + 1;
    }
    transaction.set(paySeqRef, { current: nextPayNum }, { merge: true });

    const paymentNumber = `PAY-${format(new Date(), 'yyyy')}-${nextPayNum.toString().padStart(4, '0')}`;
    const newPayRef = db.collection('payments').doc();

    const newAmountPaid = (inv.amountPaid || 0) + amount;
    const newBalanceDue = Math.max(0, (inv.balanceDue || inv.grandTotal) - amount);
    const newStatus = newBalanceDue === 0 ? 'paid' : 'partially_paid';

    // Create payment document
    transaction.set(newPayRef, {
      id: newPayRef.id,
      paymentNumber,
      invoiceId,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerSnapshot?.companyName || 'Customer',
      amount,
      paymentDate: paymentDate || new Date().toISOString(),
      paymentMethod: paymentMethod || 'bank_transfer',
      reference: reference || 'N/A',
      notes: notes || '',
      status: 'completed',
      recordedBy: context.auth!.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update invoice balance & status
    transaction.update(invoiceRef, {
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update customer spend & outstanding balance
    const customerRef = db.collection('customers').doc(inv.customerId);
    transaction.update(customerRef, {
      totalSpent: admin.firestore.FieldValue.increment(amount),
      outstandingBalance: admin.firestore.FieldValue.increment(-amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      action: 'PAYMENT_RECORDED',
      performedBy: context.auth!.uid,
      paymentId: newPayRef.id,
      paymentNumber,
      invoiceId,
      amount,
      newStatus,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      paymentId: newPayRef.id,
      paymentNumber,
      newStatus,
      balanceDue: newBalanceDue,
    };
  });
});
