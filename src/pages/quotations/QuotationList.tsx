import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db';
import { Quotation, Customer, Product, SubscriptionPlan, TaxRule, DiscountRule, QuotationTemplate } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, toMinorUnits } from '../../utils/money';
import { calculateTaxes } from '../../utils/tax';
import { calculateDiscounts } from '../../utils/discount';
import { FileText, Plus, ArrowRight, Printer, Sparkles, AlertCircle, CheckCircle2, BookmarkCheck, Calendar, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const QuotationList: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);

  const [activeTab, setActiveTab] = useState<'quotations' | 'templates'>('quotations');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New quotation form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentTerms, setPaymentTerms] = useState('Net 15 days');
  const [notes, setNotes] = useState('Thank you for choosing Brightloop Software.');
  const [validityDays, setValidityDays] = useState(30);

  const fetchData = async () => {
    const [qList, tmplList, cList, pList, plList, tList, dList] = await Promise.all([
      dbService.getQuotations(),
      dbService.getQuotationTemplates(),
      dbService.getCustomers(),
      dbService.getProducts(),
      dbService.getPlans(),
      dbService.getTaxRules(),
      dbService.getDiscountRules(),
    ]);
    setQuotations(qList);
    setTemplates(tmplList);
    setCustomers(cList);
    setProducts(pList);
    setPlans(plList);
    setTaxes(tList);
    setDiscounts(dList);

    if (cList.length > 0 && !selectedCustomerId) setSelectedCustomerId(cList[0].id);
    if (pList.length > 0 && !selectedProductId) setSelectedProductId(pList[0].id);
    if (plList.length > 0 && !selectedPlanId) setSelectedPlanId(plList[0].id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;

    setValidityDays(tmpl.defaultValidityDays || 30);
    setPaymentTerms(tmpl.defaultTerms || 'Net 30 days');
    setNotes(tmpl.defaultNotes || 'Thank you for choosing Brightloop Software.');

    if (tmpl.lineItems && tmpl.lineItems.length > 0) {
      const line = tmpl.lineItems[0];
      if (line.productId) setSelectedProductId(line.productId);
      if (line.variantId) setSelectedVariantId(line.variantId);
      if (line.planId) setSelectedPlanId(line.planId);
      if (line.quantity) setQuantity(line.quantity);
    }
  };

  const handleUseTemplate = (template: QuotationTemplate) => {
    handleSelectTemplate(template.id);
    setIsCreateModalOpen(true);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const product = products.find((p) => p.id === selectedProductId);
    const plan = plans.find((pl) => pl.id === selectedPlanId);
    if (!customer || !product || !plan) return;

    const variant = product.variants?.find((v) => v.id === selectedVariantId);
    const unitPrice = plan.salesPrice + (variant ? variant.additionalPrice : 0);
    const lineSubtotal = unitPrice * quantity;

    // Apply active discounts & taxes
    const { discountSnapshots, discountTotal } = calculateDiscounts(lineSubtotal, discounts, quantity, product.id);
    const taxableBase = Math.max(0, lineSubtotal - discountTotal);
    const { taxSnapshots, taxTotal } = calculateTaxes(taxableBase, taxes, product.id);
    const grandTotal = taxableBase + taxTotal;

    const now = new Date();
    const expiryDate = new Date(now.getTime() + validityDays * 86400000).toISOString();

    const newQuotation = await dbService.saveQuotation({
      customerId: customer.id,
      customerSnapshot: {
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        taxNumber: customer.taxNumber,
      },
      quotationDate: now.toISOString(),
      expiryDate,
      status: 'confirmed',
      lineItems: [
        {
          id: `qli_${Date.now()}`,
          productId: product.id,
          productName: product.name,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          planId: plan.id,
          planName: plan.name,
          quantity,
          unitPrice,
          subtotal: lineSubtotal,
          taxAmount: taxTotal,
          discountAmount: discountTotal,
          total: grandTotal,
        },
      ],
      subtotal: lineSubtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      paymentTerms,
      notes,
      createdBy: userProfile?.uid || 'staff_1',
    });

    setIsCreateModalOpen(false);
    setActionSuccess(`Quotation ${newQuotation.quotationNumber} successfully created and ready for conversion.`);
    fetchData();
  };

  const handleConvert = async (quotationId: string) => {
    try {
      const sub = await dbService.convertQuotationToSubscription(
        quotationId,
        userProfile?.uid || 'staff_1'
      );
      setActionSuccess(`Quotation converted! Subscription ${sub.subscriptionNumber} is now Active.`);
      fetchData();
      setTimeout(() => {
        navigate('/subscriptions');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quotations & Proposals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create multi-line proposals with taxes & discounts. Convert directly into recurring subscriptions in 1 click.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Quotation
        </Button>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-1">
        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'quotations'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Active Quotations ({quotations.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookmarkCheck className="h-3.5 w-3.5" />
          Preconfigured Templates ({templates.length})
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionSuccess(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Templates Tab View */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="p-5 border-[#1E293B] bg-[#0C101A] hover:border-blue-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="h-4 w-4 text-blue-400" />
                    <span className="font-bold text-white text-base">{tmpl.name}</span>
                  </div>
                  <Badge variant="info" size="sm">
                    {tmpl.defaultValidityDays} Days Validity
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">{tmpl.description}</p>
                <div className="p-3 bg-[#07090E] rounded-lg border border-[#192233] space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Default Terms:</span>
                    <span className="font-mono">{tmpl.defaultTerms}</span>
                  </div>
                  {tmpl.lineItems?.map((li, idx) => (
                    <div key={idx} className="flex justify-between text-blue-400 font-mono text-[11px] pt-1 border-t border-[#192233]">
                      <span>{li.description}</span>
                      <span>{formatCurrency(li.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-[#192233] flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(tmpl)}
                  className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Use This Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quotations List Tab View */}
      {activeTab === 'quotations' && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in">
          {quotations.map((q) => {
          const isExpired = new Date(q.expiryDate).getTime() < Date.now();
          const canConvert = q.status === 'confirmed' && !isExpired;

          return (
            <Card key={q.id} className="hover:border-primary/40 transition-all p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">{q.quotationNumber}</span>
                    <Badge
                      variant={
                        q.status === 'converted'
                          ? 'success'
                          : isExpired
                          ? 'danger'
                          : q.status === 'confirmed'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {q.status === 'converted' ? 'Converted to Subscription' : isExpired ? 'Expired' : q.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{q.customerSnapshot?.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    Issued: {new Date(q.quotationDate).toLocaleDateString()} • Valid Until:{' '}
                    {new Date(q.expiryDate).toLocaleDateString()} ({q.paymentTerms})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Total Amount</p>
                    <p className="text-xl font-extrabold text-foreground">{formatCurrency(q.grandTotal)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Sub: {formatCurrency(q.subtotal)} | Tax: {formatCurrency(q.taxTotal)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewQuotation(q)} className="gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" /> Preview
                    </Button>

                    {canConvert && (
                      <Button
                        size="sm"
                        onClick={() => handleConvert(q.id)}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Convert to Subscription
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Quotation"
        description="Select customer, software products, add-on variants, or start from a pre-configured template."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          {/* Template Pre-fill Selector */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <BookmarkCheck className="h-3.5 w-3.5" /> Fast-Start: Choose Quotation Template (Optional)
              </span>
              <span className="text-[10px] text-slate-400">Auto-populates items, Odoo variants & terms</span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full text-xs bg-[#0F172A] border border-[#1E293B] rounded-md px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Start from scratch (Empty Lines) --</option>
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.defaultValidityDays} days validity)
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Customer"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            options={customers.map((c) => ({ label: `${c.companyName} (${c.contactName})`, value: c.id }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={products.map((p) => ({ label: `${p.name} (${formatCurrency(p.salesPrice)})`, value: p.id }))}
              required
            />

            <Select
              label="Subscription Plan / Cadence"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              options={plans.map((pl) => ({
                label: `${pl.name} (${formatCurrency(pl.salesPrice)} / ${pl.billingFrequency})`,
                value: pl.id,
              }))}
              required
            />
          </div>

          {/* Variant Selector */}
          {products.find((p) => p.id === selectedProductId)?.variants?.length ? (
            <Select
              label="Product Variant / Add-on"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
            >
              <option value="">None (Standard Edition)</option>
              {products
                .find((p) => p.id === selectedProductId)!
                .variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (+{formatCurrency(v.additionalPrice)})
                  </option>
                ))}
            </Select>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Quantity (Seats/Licenses)"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            <Input
              label="Validity (Days)"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
              required
            />
            <Input
              label="Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. Net 15"
              required
            />
          </div>

          <Input label="Notes & Terms" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate Quotation</Button>
          </div>
        </form>
      </Modal>

      {/* Quotation Preview Modal */}
      {previewQuotation && (
        <Modal
          isOpen={!!previewQuotation}
          onClose={() => setPreviewQuotation(null)}
          title={`Quotation Preview — ${previewQuotation.quotationNumber}`}
          description="Official quotation preview with line items, tax breakdown, and terms."
          maxWidth="2xl"
        >
          <div className="p-6 bg-white dark:bg-slate-900 border border-border rounded-xl space-y-6 text-foreground print:p-0">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-black text-primary">Brightloop Software</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Enterprise Subscription Solutions</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{previewQuotation.quotationNumber}</span>
                <p className="text-xs text-muted-foreground">
                  Date: {new Date(previewQuotation.quotationDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valid Until: {new Date(previewQuotation.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Customer block */}
            <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
              <p className="font-bold text-foreground">Prepared For:</p>
              <p className="font-semibold text-sm">{previewQuotation.customerSnapshot.companyName}</p>
              <p className="text-muted-foreground">Attn: {previewQuotation.customerSnapshot.contactName}</p>
              <p className="text-muted-foreground">
                {previewQuotation.customerSnapshot.billingAddress.street},{' '}
                {previewQuotation.customerSnapshot.billingAddress.city}
              </p>
              {previewQuotation.customerSnapshot.taxNumber && (
                <p className="text-muted-foreground font-mono">GSTIN/Tax: {previewQuotation.customerSnapshot.taxNumber}</p>
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
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewQuotation.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="p-2.5">
                        <span className="font-bold">{li.productName}</span>
                        {li.variantName && (
                          <span className="block text-[11px] text-primary">Add-on: {li.variantName}</span>
                        )}
                        <span className="block text-[11px] text-muted-foreground">{li.planName}</span>
                      </td>
                      <td className="p-2.5 text-center">{li.quantity}</td>
                      <td className="p-2.5 text-right">{formatCurrency(li.unitPrice)}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency(li.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(previewQuotation.subtotal)}</span>
                </div>
                {previewQuotation.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(previewQuotation.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes:</span>
                  <span className="font-semibold">{formatCurrency(previewQuotation.taxTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-black">
                  <span>Grand Total:</span>
                  <span className="text-primary">{formatCurrency(previewQuotation.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
              <p className="font-bold text-foreground">Terms & Conditions:</p>
              <p>{previewQuotation.paymentTerms}. {previewQuotation.notes}</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print / Save PDF
              </Button>
              <Button size="sm" onClick={() => setPreviewQuotation(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

