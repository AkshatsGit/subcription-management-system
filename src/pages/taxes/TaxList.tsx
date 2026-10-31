import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { TaxRule, Product } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Landmark, Plus, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TaxList: React.FC = () => {
  const { isAdmin } = useAuth();
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [ratePercentage, setRatePercentage] = useState<number>(18.0);
  const [taxType, setTaxType] = useState<'percentage' | 'fixed'>('percentage');
  const [applicableProductIds, setApplicableProductIds] = useState<string[]>([]);

  const fetchTaxes = async () => {
    const [tList, pList] = await Promise.all([dbService.getTaxRules(), dbService.getProducts()]);
    setTaxRules(tList);
    setProducts(pList);
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const openCreateModal = () => {
    setName('');
    setRatePercentage(18.0);
    setTaxType('percentage');
    setApplicableProductIds([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.saveTaxRule({
      name,
      ratePercentage,
      taxType,
      fixedAmount: null,
      applicableProductIds,
      startDate: new Date().toISOString(),
      endDate: null,
      isActive: true,
    });
    setIsModalOpen(false);
    fetchTaxes();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tax Rules & Compliance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administer multi-component tax jurisdictions (e.g. GST 18%, Cess) with backend precision calculations.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Add Tax Rule
          </Button>
        )}
      </div>

      {/* Taxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {taxRules.map((tax) => (
          <Card key={tax.id} className="p-5 hover:border-primary/40 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" size="sm" className="mb-2">
                  {tax.taxType.toUpperCase()}
                </Badge>
                <h3 className="text-lg font-bold text-foreground">{tax.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applies to: {tax.applicableProductIds.length === 0 ? 'All Products & Plans' : `${tax.applicableProductIds.length} Products`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-primary">{tax.ratePercentage}%</span>
                <span className="text-[10px] text-muted-foreground block">Rate</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Status: Active</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Enforced in billing
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tax Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Tax Rule"
        description="Configure tax percentage and scope of product applicability."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tax Rule Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GST 18% (Standard SaaS)"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rate Percentage (%)"
              type="number"
              step="0.01"
              value={ratePercentage}
              onChange={(e) => setRatePercentage(parseFloat(e.target.value) || 0)}
              required
            />
            <Select
              label="Tax Type"
              value={taxType}
              onChange={(e) => setTaxType(e.target.value as any)}
              options={[
                { label: 'Percentage', value: 'percentage' },
                { label: 'Fixed Rate', value: 'fixed' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Tax Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

