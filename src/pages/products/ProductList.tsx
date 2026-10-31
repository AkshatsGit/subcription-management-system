import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Product, ProductVariant, ProductType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, toMinorUnits, fromMinorUnits } from '../../utils/money';
import { Package, Plus, Search, Tag, Edit, Check, X, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProductList: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState<ProductType>('software');
  const [salesPriceDecimal, setSalesPriceDecimal] = useState<number>(0);
  const [costPriceDecimal, setCostPriceDecimal] = useState<number>(0);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Variant addition state
  const [varName, setVarName] = useState('');
  const [varDesc, setVarDesc] = useState('');
  const [varPriceDecimal, setVarPriceDecimal] = useState<number>(0);

  const fetchProducts = async () => {
    const list = await dbService.getProducts();
    setProducts(list);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCode(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription('');
    setProductType('software');
    setSalesPriceDecimal(999);
    setCostPriceDecimal(200);
    setVariants([
      {
        id: `var_${Date.now()}`,
        name: 'Odoo Enterprise Connector',
        description: 'Bi-directional sync connector',
        additionalPrice: 56000, // ₹560.00
        isActive: true,
      },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description);
    setProductType(p.productType);
    setSalesPriceDecimal(fromMinorUnits(p.salesPrice));
    setCostPriceDecimal(fromMinorUnits(p.costPrice));
    setVariants(p.variants || []);
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!varName.trim()) return;
    const newVariant: ProductVariant = {
      id: `var_${Date.now()}`,
      name: varName,
      description: varDesc,
      additionalPrice: toMinorUnits(varPriceDecimal),
      isActive: true,
    };
    setVariants([...variants, newVariant]);
    setVarName('');
    setVarDesc('');
    setVarPriceDecimal(0);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.saveProduct({
      id: editingProduct?.id,
      name,
      code,
      description,
      productType,
      salesPrice: toMinorUnits(salesPriceDecimal),
      costPrice: toMinorUnits(costPriceDecimal),
      currency: 'INR',
      variants,
      isActive: true,
    });
    setIsModalOpen(false);
    fetchProducts();
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.productType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products & Product Variants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure core catalog software, add-ons, cost baselines, and multi-variant pricing rules.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { label: 'All Product Types', value: 'all' },
            { label: 'Software', value: 'software' },
            { label: 'Service', value: 'service' },
            { label: 'Add-on', value: 'addon' },
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <Card key={product.id} className="flex flex-col justify-between hover:border-primary/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" size="sm" className="mb-2 uppercase text-[10px] tracking-wider">
                    {product.productType}
                  </Badge>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">SKU: {product.code}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-foreground">{formatCurrency(product.salesPrice)}</span>
                  <span className="text-xs text-muted-foreground block">Base Price</span>
                </div>
              </div>
              <CardDescription className="line-clamp-2 mt-2">{product.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Variants Section */}
              <div className="rounded-lg bg-muted/40 p-3 border border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Configured Variants ({product.variants?.length || 0})</span>
                </div>
                {product.variants && product.variants.length > 0 ? (
                  <div className="space-y-1.5">
                    {product.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                        <span className="font-medium text-foreground">{v.name}</span>
                        <span className="font-semibold text-primary">
                          +{formatCurrency(v.additionalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No variants configured</p>
                )}
              </div>

              {isAdmin && (
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Cost Price: {formatCurrency(product.costPrice)}</span>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} className="gap-1 h-7 text-xs">
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for Add / Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
        description="Configure product metadata, pricing, and extensible variant add-ons."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="SKU / Product Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Product Type"
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              options={[
                { label: 'Software', value: 'software' },
                { label: 'Service', value: 'service' },
                { label: 'Add-on', value: 'addon' },
              ]}
            />
            <Input
              label="Sales Price (₹)"
              type="number"
              step="0.01"
              value={salesPriceDecimal}
              onChange={(e) => setSalesPriceDecimal(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Cost Price (₹)"
              type="number"
              step="0.01"
              value={costPriceDecimal}
              onChange={(e) => setCostPriceDecimal(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <Input
            label="Product Description & Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key capabilities, SLA tier, deliverables..."
          />

          {/* Product Variant Manager within Modal */}
          <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary" /> Product Variants & Add-ons
              </h4>
              <span className="text-xs text-muted-foreground">e.g. Odoo (+₹560), SAP Bridge</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="Variant Name (e.g. Odoo)"
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
              />
              <Input
                placeholder="Additional Price (₹)"
                type="number"
                step="0.01"
                value={varPriceDecimal || ''}
                onChange={(e) => setVarPriceDecimal(parseFloat(e.target.value) || 0)}
              />
              <Button type="button" variant="secondary" onClick={handleAddVariant} className="text-xs h-10">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
              </Button>
            </div>

            {/* Configured Variants List */}
            {variants.length > 0 && (
              <div className="divide-y divide-border/60 border border-border rounded-lg bg-card overflow-hidden">
                {variants.map((v) => (
                  <div key={v.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-foreground">{v.name}</span>
                      <span className="text-muted-foreground ml-2">+{formatCurrency(v.additionalPrice)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="h-6 w-6 text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
