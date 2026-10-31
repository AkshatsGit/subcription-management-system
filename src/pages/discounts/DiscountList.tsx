import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { DiscountRule } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, toMinorUnits } from '../../utils/money';
import { Percent, Plus, Tag, Check, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const DiscountList: React.FC = () => {
  const { isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(20);
  const [minimumPurchaseDecimal, setMinimumPurchaseDecimal] = useState<number>(1000);
  const [minimumQuantity, setMinimumQuantity] = useState(1);
  const [maxUsages, setMaxUsages] = useState(100);

  const fetchDiscounts = async () => {
    const list = await dbService.getDiscountRules();
    setDiscounts(list);
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const openCreateModal = () => {
    setCode('PROMO' + Math.floor(10 + Math.random() * 90));
    setName('');
    setDiscountType('percentage');
    setValue(15);
    setMinimumPurchaseDecimal(500);
    setMinimumQuantity(1);
    setMaxUsages(50);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.saveDiscountRule({
      code: code.toUpperCase().trim(),
      name,
      discountType,
      value: discountType === 'percentage' ? value : toMinorUnits(value),
      minimumPurchaseAmount: toMinorUnits(minimumPurchaseDecimal),
      minimumQuantity,
      maxUsages,
      currentUsages: 0,
      startDate: new Date().toISOString(),
      endDate: null,
      applicableProductIds: [],
      applicableSubscriptionIds: [],
      isActive: true,
    });
    setIsModalOpen(false);
    fetchDiscounts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Discount Coupons & Promotions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure percentage or fixed credits, minimum order values, and hard usage caps.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Create Discount Rule
          </Button>
        )}
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((disc) => (
          <Card key={disc.id} className="p-5 hover:border-primary/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-lg border border-primary/20 mb-2">
                    {disc.code}
                  </span>
                  <h3 className="text-base font-bold text-foreground">{disc.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-foreground">
                    {disc.discountType === 'percentage' ? `${disc.value}%` : formatCurrency(disc.value)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block capitalize">{disc.discountType} off</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Minimum Purchase:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(disc.minimumPurchaseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum Seats:</span>
                  <span className="font-semibold text-foreground">{disc.minimumQuantity} unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage Progress:</span>
                  <span className="font-semibold text-foreground">
                    {disc.currentUsages} / {disc.maxUsages === 0 ? '∞' : disc.maxUsages} used
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
              <Badge variant={disc.isActive ? 'success' : 'neutral'} size="sm">
                {disc.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-muted-foreground text-[11px]">Auto-applied on billing</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Discount Rule"
        description="Define discount code, percentage or fixed discount, and eligibility rules."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Coupon Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. FLASH25"
              required
            />
            <Select
              label="Discount Type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              options={[
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Fixed Amount (₹)', value: 'fixed' },
              ]}
            />
          </div>

          <Input
            label="Promotion Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual Growth Partner Credit"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={discountType === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Min Order Subtotal (₹)"
              type="number"
              step="0.01"
              value={minimumPurchaseDecimal}
              onChange={(e) => setMinimumPurchaseDecimal(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Seats / Quantity"
              type="number"
              value={minimumQuantity}
              onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 1)}
              required
            />
            <Input
              label="Max Usages Limit (0 for unlimited)"
              type="number"
              value={maxUsages}
              onChange={(e) => setMaxUsages(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Discount Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

