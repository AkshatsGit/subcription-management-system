import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Payment } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/money';
import { CreditCard, Search, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentList: React.FC = () => {
  const { userProfile, isCustomer } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    let list = await dbService.getPayments();
    if (isCustomer && userProfile?.customerId) {
      list = list.filter((p) => p.customerId === userProfile.customerId);
    }
    setPayments(list);
  };

  useEffect(() => {
    fetchPayments();
  }, [isCustomer, userProfile]);

  const filtered = payments.filter((p) => {
    return (
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments & Reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manual and automated payment journals, transaction references, and bank reconciliation history.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by payment #, invoice #, customer or UTR..."
          className="pl-9"
        />
      </div>

      {/* Payments Table / List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Payment #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Invoice Ref</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Reference / UTR</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-foreground">{p.paymentNumber}</td>
                    <td className="p-3.5 font-semibold text-foreground">{p.customerName}</td>
                    <td className="p-3.5 font-mono text-primary font-medium">{p.invoiceNumber}</td>
                    <td className="p-3.5 text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="p-3.5 uppercase font-medium text-muted-foreground tracking-wider">
                      {p.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">{p.reference}</td>
                    <td className="p-3.5 text-right font-bold text-foreground text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant={p.status === 'completed' ? 'success' : 'danger'} size="sm">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
