import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { SubscriptionPlan, Product, BillingFrequency } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, toMinorUnits, fromMinorUnits } from '../../utils/money';
import { CalendarCheck, Plus, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PlanList: React.FC = () => {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form states
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [salesPriceDecimal, setSalesPriceDecimal] = useState<number>(0);
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [minimumQuantity, setMinimumQuantity] = useState(1);
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [autoCloseOnExpiry, setAutoCloseOnExpiry] = useState(false);

  const fetchPlans = async () => {
    const [pList, prList] = await Promise.all([dbService.getPlans(), dbService.getProducts()]);
    setPlans(pList);
    setProducts(prList);
    if (prList.length > 0 && !productId) {
      setProductId(prList[0].id);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setSalesPriceDecimal(1999);
    setBillingFrequency('monthly');
    setMinimumQuantity(1);
    setAllowEarlyClosure(true);
    setAllowPause(true);
    setAllowRenewal(true);
    setAutoCloseOnExpiry(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProd = products.find((p) => p.id === productId);

    await dbService.savePlan({
      id: editingPlan?.id,
      productId,
      productName: selectedProd?.name || 'Selected Product',
      name,
      description,
      salesPrice: toMinorUnits(salesPriceDecimal),
      billingFrequency,
      minimumQuantity,
      availableFrom: new Date(availableFrom).toISOString(),
      availableUntil: null,
      allowEarlyClosure,
      allowPause,
      allowRenewal,
      autoCloseOnExpiry,
      isActive: true,
    });

    setIsModalOpen(false);
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage contract frequencies (Daily, Weekly, Monthly, Yearly) and lifecycle rule permissions.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        )}
      </div>

      {/* Month-End Clamping Notice Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 dark:text-indigo-200">
          <p className="font-bold">Automated Month-End Clamping & Leap Year Billing Engine Active</p>
          <p className="mt-0.5 opacity-90">
            Subscriptions commencing on the 31st of any month automatically clamp to the final valid day of shorter
            months (e.g. Feb 28 or Feb 29 in leap years), preserving the anchor day so subsequent full months
            automatically restore to the 31st.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col justify-between hover:border-primary/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="default" size="sm" className="mb-2 uppercase text-[10px] tracking-wider">
                    {plan.billingFrequency}
                  </Badge>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Product: {plan.productName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-foreground">{formatCurrency(plan.salesPrice)}</span>
                  <span className="text-xs text-muted-foreground block capitalize">per {plan.billingFrequency}</span>
                </div>
              </div>
              <CardDescription className="mt-2 line-clamp-2">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Lifecycle Permissions Checklist */}
              <div className="rounded-lg bg-muted/40 p-3 border border-border/60 space-y-1.5 text-xs">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] mb-1">
                  Lifecycle Policies:
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${plan.allowPause ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {plan.allowPause ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Allow Pause</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${plan.allowEarlyClosure ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {plan.allowEarlyClosure ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Early Closure</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${plan.allowRenewal ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {plan.allowRenewal ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Allow Renewal</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${plan.autoCloseOnExpiry ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {plan.autoCloseOnExpiry ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Auto-Close</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                <span>Min Quantity: {plan.minimumQuantity} unit(s)</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for Plan Creation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Plan"
        description="Set billing cadence, minimum seat requirements, and lifecycle permissions."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Associated Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            options={products.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))}
            required
          />

          <Input label="Plan Name" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Billing Frequency"
              value={billingFrequency}
              onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
              options={[
                { label: 'Daily (24-hour cycle)', value: 'daily' },
                { label: 'Weekly (7-day cycle)', value: 'weekly' },
                { label: 'Monthly (Calendar month with clamping)', value: 'monthly' },
                { label: 'Yearly (365 days / Leap-aware)', value: 'yearly' },
              ]}
            />
            <Input
              label="Base Plan Price (₹)"
              type="number"
              step="0.01"
              value={salesPriceDecimal}
              onChange={(e) => setSalesPriceDecimal(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Quantity"
              type="number"
              value={minimumQuantity}
              onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 1)}
              required
            />
            <Input
              label="Available From"
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              required
            />
          </div>

          <Input
            label="Plan Description & Terms"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Standard tier for scaling engineering teams..."
          />

          {/* Permissions toggles */}
          <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Configured Permissions</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEarlyClosure}
                  onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Allow Early Closure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Allow Subscription Pausing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRenewal}
                  onChange={(e) => setAllowRenewal(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Allow Automatic Renewal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCloseOnExpiry}
                  onChange={(e) => setAutoCloseOnExpiry(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Auto-Close on Expiry</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Plan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
