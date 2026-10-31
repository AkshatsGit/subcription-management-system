import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Invoice } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency, toMinorUnits } from '../../utils/money';
import { Receipt, Printer, CreditCard, Search, ArrowUpRight, CheckCircle2, AlertTriangle, Send, XCircle, Check, Ban } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const InvoiceList: React.FC = () => {
  const { userProfile, isCustomer } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Manual payment modal state
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmountDecimal, setPaymentAmountDecimal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'upi' | 'cheque' | 'cash'>('bank_transfer');
  const [reference, setReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    let list = await dbService.getInvoices();
    if (isCustomer) {
      const targetId = userProfile?.customerId || 'cust_acme_corp';
      list = list.filter(
        (inv) => inv.customerId === targetId || inv.customerSnapshot?.email?.toLowerCase() === userProfile?.email?.toLowerCase()
      );
    }
    setInvoices(list);
  };

  useEffect(() => {
    fetchInvoices();
  }, [isCustomer, userProfile]);

  const openPaymentModal = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentAmountDecimal(inv.balanceDue / 100);
    setPaymentMethod('bank_transfer');
    setReference(`REF-${Date.now().toString().slice(-6)}`);
    setPaymentNotes('Direct bank settlement');
    setPaymentError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    try {
      await dbService.recordPayment({
        invoiceId: paymentInvoice.id,
        amount: toMinorUnits(paymentAmountDecimal),
        paymentMethod,
        reference,
        notes: paymentNotes,
        recordedBy: userProfile?.displayName || 'Authorized User',
      });
      setPaymentInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment reconciliation failed');
    }
  };

  const handleConfirmInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await dbService.updateInvoiceStatus(invoiceId, 'confirmed');
      setActionMessage(`Invoice ${invoiceNumber} confirmed successfully and posted to active receivables.`);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm invoice');
    }
  };

  const handleCancelInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!window.confirm(`Are you sure you want to cancel invoice ${invoiceNumber}? This will mark it as void.`)) return;
    try {
      await dbService.updateInvoiceStatus(invoiceId, 'cancelled');
      setActionMessage(`Invoice ${invoiceNumber} marked as cancelled.`);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  const handleSendInvoice = (invoice: Invoice) => {
    setActionMessage(`Invoice ${invoice.invoiceNumber} successfully dispatched to ${invoice.customerSnapshot.email}.`);
  };

  const handlePrintDirect = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerSnapshot.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices & Statements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete lifecycle management: Draft → Confirmed → Paid. Confirm, cancel, send, print, and reconcile payments.
          </p>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-800 dark:text-blue-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionMessage(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or customer name..."
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'All Invoices', value: 'all' },
            { label: 'Draft', value: 'draft' },
            { label: 'Confirmed / Pending', value: 'confirmed' },
            { label: 'Paid', value: 'paid' },
            { label: 'Partially Paid', value: 'partially_paid' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Cancelled', value: 'cancelled' },
          ]}
          className="w-full sm:w-56"
        />
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((inv) => (
          <Card key={inv.id} className="p-5 hover:border-primary/40 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-foreground">{inv.invoiceNumber}</span>
                  <Badge
                    variant={
                      inv.status === 'paid'
                        ? 'success'
                        : inv.status === 'overdue'
                        ? 'danger'
                        : inv.status === 'partially_paid'
                        ? 'warning'
                        : inv.status === 'draft'
                        ? 'neutral'
                        : inv.status === 'cancelled'
                        ? 'danger'
                        : 'info'
                    }
                    size="sm"
                    className="capitalize"
                  >
                    {inv.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    Sub: {inv.subscriptionNumber || 'Direct'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-foreground">{inv.customerSnapshot.companyName}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>Issued: {new Date(inv.invoiceDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={inv.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>Terms: {inv.paymentTerms}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total / Balance Due</p>
                  <p className="text-xl font-extrabold text-foreground">{formatCurrency(inv.grandTotal)}</p>
                  <p
                    className={`text-xs font-bold ${
                      inv.balanceDue === 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {inv.status === 'cancelled'
                      ? 'Cancelled / Void'
                      : inv.balanceDue === 0
                      ? 'Fully Paid'
                      : `Balance Due: ${formatCurrency(inv.balanceDue)}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewInvoice(inv)} className="gap-1.5 text-xs h-8">
                    <Receipt className="h-3.5 w-3.5" /> Preview
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => handlePrintDirect(inv)} className="gap-1.5 text-xs h-8">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>

                  {!isCustomer && (
                    <>
                      {inv.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmInvoice(inv.id, inv.invoiceNumber)}
                          className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirm
                        </Button>
                      )}

                      {inv.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInvoice(inv)}
                          className="gap-1.5 text-xs h-8 text-slate-300 hover:text-white"
                        >
                          <Send className="h-3.5 w-3.5" /> Send
                        </Button>
                      )}

                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                          className="gap-1.5 text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                        >
                          <Ban className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      )}

                      {inv.balanceDue > 0 && inv.status !== 'cancelled' && inv.status !== 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(inv)}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold shadow-sm"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Record Payment
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Invoice Document Preview Modal */}
      {previewInvoice && (
        <Modal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          title={`Tax Invoice — ${previewInvoice.invoiceNumber}`}
          description="Official tax invoice snapshot with immutable pricing and tax breakdown."
          maxWidth="2xl"
        >
          <div className="p-6 bg-white dark:bg-slate-900 border border-border rounded-xl space-y-6 text-foreground print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-black text-primary">Brightloop Software Ltd</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Mindspace Tech Park, Airoli, Navi Mumbai</p>
                <p className="text-xs text-muted-foreground font-mono">GSTIN: 27AABCB9999P1Z1</p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold">{previewInvoice.invoiceNumber}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Date: {new Date(previewInvoice.invoiceDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(previewInvoice.dueDate).toLocaleDateString()}
                </p>
                <Badge
                  variant={previewInvoice.status === 'paid' ? 'success' : 'warning'}
                  size="sm"
                  className="mt-2 capitalize"
                >
                  {previewInvoice.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Billed To Customer */}
            <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Billed To:</p>
              <p className="font-bold text-sm text-foreground">{previewInvoice.customerSnapshot.companyName}</p>
              <p className="text-muted-foreground">Attn: {previewInvoice.customerSnapshot.contactName}</p>
              <p className="text-muted-foreground">
                {previewInvoice.customerSnapshot.billingAddress.street},{' '}
                {previewInvoice.customerSnapshot.billingAddress.city},{' '}
                {previewInvoice.customerSnapshot.billingAddress.state} -{' '}
                {previewInvoice.customerSnapshot.billingAddress.postalCode}
              </p>
              {previewInvoice.customerSnapshot.taxNumber && (
                <p className="text-muted-foreground font-mono">Tax / GSTIN: {previewInvoice.customerSnapshot.taxNumber}</p>
              )}
            </div>

            {/* Line items table */}
            <div className="border border-border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border font-semibold">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewInvoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="p-2.5">
                        <span className="font-bold">{li.description}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          Period: {new Date(previewInvoice.periodStart).toLocaleDateString()} to{' '}
                          {new Date(previewInvoice.periodEnd).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">{li.quantity}</td>
                      <td className="p-2.5 text-right">{formatCurrency(li.unitPrice)}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency(li.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                {previewInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(previewInvoice.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes:</span>
                  <span className="font-semibold">{formatCurrency(previewInvoice.taxTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-extrabold">
                  <span>Grand Total:</span>
                  <span className="text-foreground">{formatCurrency(previewInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(previewInvoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-1 text-sm font-black text-primary">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(previewInvoice.balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Actions */}
            <div className="text-[11px] text-muted-foreground border-t border-border pt-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-foreground">Terms: {previewInvoice.paymentTerms}</p>
                <p>{previewInvoice.notes}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </Button>
                <Button size="sm" onClick={() => setPreviewInvoice(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          title={`Record Payment — ${paymentInvoice.invoiceNumber}`}
          description="Record full or partial payment against this invoice with strict overpayment safeguards."
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {paymentError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total:</span>
                <span className="font-semibold">{formatCurrency(paymentInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(paymentInvoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                <span>Remaining Balance Due:</span>
                <span className="text-primary">{formatCurrency(paymentInvoice.balanceDue)}</span>
              </div>
            </div>

            <Input
              label="Payment Amount (₹)"
              type="number"
              step="0.01"
              max={paymentInvoice.balanceDue / 100}
              value={paymentAmountDecimal}
              onChange={(e) => setPaymentAmountDecimal(parseFloat(e.target.value) || 0)}
              hint={`Maximum allowed: ₹${paymentInvoice.balanceDue / 100} (prevents overpayment)`}
              required
            />

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              options={[
                { label: 'Bank Transfer (NEFT / RTGS / IMPS)', value: 'bank_transfer' },
                { label: 'Corporate Credit Card', value: 'credit_card' },
                { label: 'UPI / Immediate Payment', value: 'upi' },
                { label: 'Cheque / Demand Draft', value: 'cheque' },
                { label: 'Cash Receipt', value: 'cash' },
              ]}
            />

            <Input
              label="Transaction / Reference / UTR Number"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. HDFC-NEFT-889920"
              required
            />

            <Input
              label="Reconciliation Notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Verified against bank statement..."
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setPaymentInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm & Reconcile Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

