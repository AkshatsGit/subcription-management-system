import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Subscription, Invoice, Payment, Customer, Product, SubscriptionPlan } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/money';
import { useAuth } from '../../contexts/AuthContext';
import { Repeat, Receipt, CreditCard, Shield, Download, ExternalLink, Calendar, CheckCircle2, Building2, Plus, Printer, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerPortal: React.FC = () => {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomerId, setActiveCustomerId] = useState<string>('cust_acme_corp');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Self-Subscribe Modal State
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    const [cList, allSubs, allInvs, allPays, pList, plList] = await Promise.all([
      dbService.getCustomers(),
      dbService.getSubscriptions(),
      dbService.getInvoices(),
      dbService.getPayments(),
      dbService.getProducts(),
      dbService.getPlans(),
    ]);

    setCustomers(cList);
    setProducts(pList);
    setPlans(plList);

    if (pList.length > 0 && !selectedProductId) setSelectedProductId(pList[0].id);
    if (plList.length > 0 && !selectedPlanId) setSelectedPlanId(plList[0].id);

    // Determine target customer
    let targetId = activeCustomerId;
    if (userProfile?.customerId && cList.some((c) => c.id === userProfile.customerId)) {
      targetId = userProfile.customerId;
    } else if (userProfile?.email) {
      const match = cList.find((c) => c.email.toLowerCase() === userProfile.email.toLowerCase());
      if (match) targetId = match.id;
    }

    if (!cList.some((c) => c.id === targetId) && cList.length > 0) {
      targetId = cList[0].id;
    }

    setActiveCustomerId(targetId);
    filterCustomerRecords(targetId, allSubs, allInvs, allPays);
  };

  const filterCustomerRecords = (custId: string, subs: Subscription[], invs: Invoice[], pays: Payment[]) => {
    setSubscriptions(subs.filter((s) => s.customerId === custId));
    setInvoices(invs.filter((i) => i.customerId === custId));
    setPayments(pays.filter((p) => p.customerId === custId));
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const handleOrganizationChange = async (custId: string) => {
    setActiveCustomerId(custId);
    const [subs, invs, pays] = await Promise.all([
      dbService.getSubscriptions(),
      dbService.getInvoices(),
      dbService.getPayments(),
    ]);
    filterCustomerRecords(custId, subs, invs, pays);
  };

  const handleSelfSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerId || !selectedProductId || !selectedPlanId) return;

    try {
      await dbService.createSubscription({
        customerId: activeCustomerId,
        productId: selectedProductId,
        variantId: selectedVariantId || null,
        planId: selectedPlanId,
        quantity,
        paymentTerms: 'Net 15 days',
        notes: 'Self-service client subscription.',
        performedByUid: userProfile?.displayName || 'Client Self-Service',
      });

      setIsSubscribeModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Subscription failed');
    }
  };

  const activeCustomer = customers.find((c) => c.id === activeCustomerId);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Portal Header */}
      <div className="border-b border-[#1E293B] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Customer Self-Service Portal</h1>
            <Badge variant="success" size="sm">
              Secure Client Portal
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Client Workspace • Review software licenses, upcoming renewals, and tax invoices.
          </p>
        </div>

        {/* Client Account Switcher */}
        <div className="flex items-center gap-2.5 bg-[#0B0F19] border border-[#192233] p-2 rounded-xl">
          <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
          <div className="text-left">
            <label className="block text-[10px] font-mono uppercase text-slate-400">Account Organization</label>
            <select
              value={activeCustomerId}
              onChange={(e) => handleOrganizationChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0B0F19] text-white">
                  {c.companyName} ({c.contactName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-[#0B0F19] border-[#192233]">
          <p className="text-xs uppercase font-semibold text-slate-400">Active Subscriptions</p>
          <h3 className="text-3xl font-extrabold text-blue-400 font-mono mt-2">
            {subscriptions.filter((s) => s.status === 'active').length}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Live software entitlements</p>
        </Card>

        <Card className="p-5 bg-[#0B0F19] border-[#192233]">
          <p className="text-xs uppercase font-semibold text-slate-400">Total Invoices</p>
          <h3 className="text-3xl font-extrabold text-white font-mono mt-2">{invoices.length}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {invoices.filter((i) => i.status === 'paid').length} settled statements
          </p>
        </Card>

        <Card className="p-5 bg-[#0B0F19] border-[#192233]">
          <p className="text-xs uppercase font-semibold text-slate-400">Current Balance Due</p>
          <h3 className={`text-3xl font-extrabold font-mono mt-2 ${totalOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatCurrency(totalOutstanding)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {totalOutstanding === 0 ? 'All accounts up to date' : 'Payment pending reconciliation'}
          </p>
        </Card>
      </div>

      {/* Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-400" /> Active Subscriptions & Licenses
          </h2>
          <Button
            size="sm"
            onClick={() => setIsSubscribeModalOpen(true)}
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Subscribe to New Plan
          </Button>
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="p-5 flex flex-col justify-between bg-[#0B0F19] border-[#192233]">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant={sub.status === 'active' ? 'success' : 'warning'} size="sm" className="mb-2">
                        {sub.status.toUpperCase()}
                      </Badge>
                      <h4 className="text-base font-bold text-white">{sub.productName}</h4>
                      {sub.variantName && <p className="text-xs text-blue-400 font-medium">Add-on: {sub.variantName}</p>}
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{sub.subscriptionNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-white font-mono">{formatCurrency(sub.totalAmount)}</span>
                      <span className="text-xs text-slate-400 block capitalize">per {sub.billingFrequency}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#070A11] border border-[#192233] rounded-lg space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Active Seats:</span>
                      <span className="font-bold text-white">{sub.quantity} license(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Started On:</span>
                      <span>{new Date(sub.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-white">
                      <span>Next Renewal / Billing:</span>
                      <span className="text-blue-400">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-[#0B0F19] border-[#192233]">
            <p className="text-slate-300 font-semibold text-sm">No active subscriptions found for this account.</p>
            <p className="text-xs text-slate-400 mt-1">Click the button below to subscribe to a software plan.</p>
            <Button
              size="sm"
              onClick={() => setIsSubscribeModalOpen(true)}
              className="mt-4 gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Subscribe to Software Plan
            </Button>
          </Card>
        )}
      </div>

      {/* Invoices & Statements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-400" /> Invoices & Billing Statements
          </h2>
        </div>

        <Card className="bg-[#0B0F19] border-[#192233]">
          <CardContent className="p-0">
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070A11] border-b border-[#192233] text-slate-400 font-semibold">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-right">Balance Due</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#192233]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#0E1526]">
                        <td className="p-3.5 font-bold font-mono text-white">{inv.invoiceNumber}</td>
                        <td className="p-3.5 text-slate-400">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="p-3.5 text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right font-bold font-mono text-white">{formatCurrency(inv.grandTotal)}</td>
                        <td className="p-3.5 text-right font-bold font-mono text-blue-400">{formatCurrency(inv.balanceDue)}</td>
                        <td className="p-3.5 text-center">
                          <Badge
                            variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'info'}
                            size="sm"
                            className="capitalize"
                          >
                            {inv.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewInvoice(inv)}
                            className="gap-1 text-xs h-7 text-slate-300 hover:text-white"
                          >
                            <FileText className="h-3 w-3" /> View Tax Invoice
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No billing statements generated yet for this organization account.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Self-Subscribe Modal */}
      <Modal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        title="Subscribe to Software Suite"
        description={`Activate subscription entitlement for ${activeCustomer?.companyName || 'your organization'}.`}
        maxWidth="lg"
      >
        <form onSubmit={handleSelfSubscribe} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Suite"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedVariantId('');
              }}
              options={products.map((p) => ({
                label: `${p.name} (${formatCurrency(p.salesPrice)})`,
                value: p.id,
              }))}
              required
            />

            <Select
              label="Billing Plan / Cadence"
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
              <option value="">None (Standard Base Edition)</option>
              {products
                .find((p) => p.id === selectedProductId)!
                .variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (+{formatCurrency(v.additionalPrice)})
                  </option>
                ))}
            </Select>
          ) : null}

          <Input
            label="Licenses / Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsSubscribeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Confirm & Activate Subscription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Document Preview Modal */}
      {previewInvoice && (
        <Modal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          title={`Tax Invoice — ${previewInvoice.invoiceNumber}`}
          description="Official tax invoice snapshot with immutable pricing and tax breakdown."
          maxWidth="2xl"
        >
          <div className="p-6 bg-[#0B0F19] border border-[#192233] rounded-xl space-y-6 text-white">
            <div className="flex justify-between items-start border-b border-[#192233] pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-400">Brightloop Software Ltd</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mindspace Tech Park, Airoli, Navi Mumbai</p>
                <p className="text-xs text-slate-400 font-mono">GSTIN: 27AABCB9999P1Z1</p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold font-mono">{previewInvoice.invoiceNumber}</span>
                <p className="text-xs text-slate-400 mt-1">
                  Date: {new Date(previewInvoice.invoiceDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-400">
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

            <div className="p-4 bg-[#070A11] rounded-lg border border-[#192233] text-xs space-y-1">
              <span className="font-bold text-white block uppercase text-[10px]">Billed To:</span>
              <p className="font-bold text-white text-sm">{previewInvoice.customerSnapshot.companyName}</p>
              <p className="text-slate-400">{previewInvoice.customerSnapshot.contactName}</p>
              <p className="text-slate-400">{previewInvoice.customerSnapshot.email}</p>
              {previewInvoice.customerSnapshot.taxNumber && (
                <p className="text-slate-400 font-mono">GSTIN/Tax: {previewInvoice.customerSnapshot.taxNumber}</p>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[11px] font-bold uppercase text-slate-400 border-b border-[#192233] pb-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {previewInvoice.lineItems.map((li) => (
                <div key={li.id} className="grid grid-cols-12 text-xs py-1 border-b border-[#192233]/40">
                  <div className="col-span-6 text-white">{li.description}</div>
                  <div className="col-span-2 text-center text-slate-400">{li.quantity}</div>
                  <div className="col-span-2 text-right font-mono text-slate-300">{formatCurrency(li.unitPrice)}</div>
                  <div className="col-span-2 text-right font-mono font-bold text-white">{formatCurrency(li.total)}</div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (18%):</span>
                  <span className="font-mono text-white">{formatCurrency(previewInvoice.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-[#192233] pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-400">{formatCurrency(previewInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-[#192233] pt-1">
                  <span>Balance Due:</span>
                  <span className={`font-mono ${previewInvoice.balanceDue === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatCurrency(previewInvoice.balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#192233]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" /> Print / Save PDF
              </Button>
              <Button size="sm" onClick={() => setPreviewInvoice(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

