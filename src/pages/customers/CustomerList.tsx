import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Customer, Product, SubscriptionPlan } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/money';
import { Users, Plus, Search, Mail, Phone, MapPin, Building2, Repeat, CheckCircle2 } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Assign Subscription Modal state
  const [assignCustomer, setAssignCustomer] = useState<Customer | null>(null);
  const [assignProductId, setAssignProductId] = useState('');
  const [assignVariantId, setAssignVariantId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignQuantity, setAssignQuantity] = useState(1);
  const [assignTerms, setAssignTerms] = useState('Net 15 days');

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [taxNumber, setTaxNumber] = useState('');

  const fetchCustomers = async () => {
    const [cList, pList, plList] = await Promise.all([
      dbService.getCustomers(),
      dbService.getProducts(),
      dbService.getPlans(),
    ]);
    setCustomers(cList);
    setProducts(pList);
    setPlans(plList);
    if (pList.length > 0 && !assignProductId) setAssignProductId(pList[0].id);
    if (plList.length > 0 && !assignPlanId) setAssignPlanId(plList[0].id);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAssignModal = (c: Customer) => {
    setAssignCustomer(c);
    setAssignQuantity(1);
    setAssignTerms('Net 15 days');
    if (products.length > 0) setAssignProductId(products[0].id);
    if (plans.length > 0) setAssignPlanId(plans[0].id);
  };

  const handleAssignSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCustomer || !assignProductId || !assignPlanId) return;

    try {
      const newSub = await dbService.createSubscription({
        customerId: assignCustomer.id,
        productId: assignProductId,
        variantId: assignVariantId || null,
        planId: assignPlanId,
        quantity: assignQuantity,
        paymentTerms: assignTerms,
        notes: `Direct assignment to ${assignCustomer.companyName}`,
      });

      setAssignCustomer(null);
      setSuccessMsg(`Subscription ${newSub.subscriptionNumber} created and activated for ${assignCustomer.companyName}!`);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to assign subscription');
    }
  };

  const openCreateModal = () => {
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setStreet('');
    setCity('Mumbai');
    setState('Maharashtra');
    setPostalCode('400001');
    setTaxNumber('27AABCZ' + Math.floor(1000 + Math.random() * 9000) + 'Q1Z2');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.createCustomer({
      companyName,
      contactName,
      email,
      phone,
      billingAddress: {
        street,
        city,
        state,
        postalCode,
        country,
      },
      taxNumber,
      status: 'active',
    });
    setIsModalOpen(false);
    fetchCustomers();
  };

  const filtered = customers.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enterprise clients, primary billing contacts, addresses, tax IDs, and lifetime spend records.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMsg(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, contact, or email..."
          className="pl-9"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <Card key={c.id} className="p-5 hover:border-primary/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">{c.companyName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {c.contactName}
                  </p>
                </div>
                <Badge variant={c.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {c.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {c.email}
                </p>
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {c.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {c.billingAddress?.city}, {c.billingAddress?.country}
                </p>
                {c.taxNumber && <p className="font-mono text-[11px]">GST/Tax: {c.taxNumber}</p>}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Total Spent</span>
                <span className="font-bold text-foreground">{formatCurrency(c.totalSpent)}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Balance Due</span>
                <span className={`font-bold ${c.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatCurrency(c.outstandingBalance)}
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border/60 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAssignModal(c)}
                className="gap-1.5 text-xs h-7 text-blue-400 hover:text-white hover:bg-blue-600/20 border-blue-500/20"
              >
                <Repeat className="h-3 w-3" /> Assign Subscription
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Customer Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer Account"
        description="Provide legal entity details, billing address, and tax identification."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Innovations"
              required
            />
            <Input
              label="Contact Person"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Rahul Verma"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Billing Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@acme.com"
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98200 00000"
            />
          </div>

          <Input
            label="Street Address"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Plot 42, Bandra Kurla Complex"
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input label="State" value={state} onChange={(e) => setState(e.target.value)} required />
            <Input label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
          </div>

          <Input
            label="Tax / GSTIN / VAT ID"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            placeholder="e.g. 27AABCA1234F1Z5"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Customer</Button>
          </div>
        </form>
      </Modal>

      {/* Direct Assign Subscription Modal */}
      {assignCustomer && (
        <Modal
          isOpen={!!assignCustomer}
          onClose={() => setAssignCustomer(null)}
          title={`Assign Subscription — ${assignCustomer.companyName}`}
          description={`Provision a live software subscription and generate initial billing invoice.`}
          maxWidth="lg"
        >
          <form onSubmit={handleAssignSubscription} className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-white">Target Account:</span>
              <p className="text-slate-300">
                {assignCustomer.companyName} ({assignCustomer.contactName} • {assignCustomer.email})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Product Suite"
                value={assignProductId}
                onChange={(e) => {
                  setAssignProductId(e.target.value);
                  setAssignVariantId('');
                }}
                options={products.map((p) => ({
                  label: `${p.name} (${formatCurrency(p.salesPrice)})`,
                  value: p.id,
                }))}
                required
              />

              <Select
                label="Billing Cadence & Plan"
                value={assignPlanId}
                onChange={(e) => setAssignPlanId(e.target.value)}
                options={plans.map((pl) => ({
                  label: `${pl.name} (${formatCurrency(pl.salesPrice)} / ${pl.billingFrequency})`,
                  value: pl.id,
                }))}
                required
              />
            </div>

            {/* Variant Selector */}
            {products.find((p) => p.id === assignProductId)?.variants?.length ? (
              <Select
                label="Product Variant / Add-on"
                value={assignVariantId}
                onChange={(e) => setAssignVariantId(e.target.value)}
              >
                <option value="">None (Standard Base Edition)</option>
                {products
                  .find((p) => p.id === assignProductId)!
                  .variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (+{formatCurrency(v.additionalPrice)})
                    </option>
                  ))}
              </Select>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Seats / Quantity"
                type="number"
                min="1"
                value={assignQuantity}
                onChange={(e) => setAssignQuantity(parseInt(e.target.value) || 1)}
                required
              />
              <Select
                label="Payment Terms"
                value={assignTerms}
                onChange={(e) => setAssignTerms(e.target.value)}
                options={[
                  { label: 'Net 15 days', value: 'Net 15 days' },
                  { label: 'Net 30 days', value: 'Net 30 days' },
                  { label: 'Immediate / Due on Receipt', value: 'Immediate' },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAssignCustomer(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                Activate Subscription & Issue Invoice
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

