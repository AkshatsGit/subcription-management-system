import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Customer } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/money';
import { Users, Plus, Search, Mail, Phone, MapPin, Building2 } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const list = await dbService.getCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
    </div>
  );
};
