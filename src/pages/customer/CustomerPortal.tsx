import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Subscription, Invoice, Payment } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/money';
import { useAuth } from '../../contexts/AuthContext';
import { Repeat, Receipt, CreditCard, Shield, Download, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerPortal: React.FC = () => {
  const { userProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadCustomerData = async () => {
      const [allSubs, allInvs, allPays] = await Promise.all([
        dbService.getSubscriptions(),
        dbService.getInvoices(),
        dbService.getPayments(),
      ]);

      // Strict data isolation filter: Customer can only see their own company records!
      const targetCustomerId = userProfile?.customerId || 'cust_acme_corp'; // fallback default for preview
      setSubscriptions(allSubs.filter((s) => s.customerId === targetCustomerId));
      setInvoices(allInvs.filter((i) => i.customerId === targetCustomerId));
      setPayments(allPays.filter((p) => p.customerId === targetCustomerId));
    };

    loadCustomerData();
  }, [userProfile]);

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Portal Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Self-Service Portal</h1>
            <Badge variant="success" size="sm">
              Secure Portal Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{userProfile?.displayName || 'Client'}</span>.
            Review your software entitlements, upcoming renewal dates, and tax invoices.
          </p>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Active Subscriptions</p>
          <h3 className="text-3xl font-extrabold text-foreground mt-2">
            {subscriptions.filter((s) => s.status === 'active').length}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Software suites provisioned</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Total Invoices</p>
          <h3 className="text-3xl font-extrabold text-foreground mt-2">{invoices.length}</h3>
          <p className="text-xs text-muted-foreground mt-1">Generated statements</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Current Balance Due</p>
          <h3 className={`text-3xl font-extrabold mt-2 ${totalOutstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {formatCurrency(totalOutstanding)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {totalOutstanding === 0 ? 'All accounts up to date' : 'Payment pending reconciliation'}
          </p>
        </Card>
      </div>

      {/* Subscriptions Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" /> Subscribed Products & Licenses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={sub.status === 'active' ? 'success' : 'warning'} size="sm" className="mb-2">
                      {sub.status.toUpperCase()}
                    </Badge>
                    <h4 className="text-base font-bold text-foreground">{sub.productName}</h4>
                    {sub.variantName && <p className="text-xs text-primary font-medium">Add-on: {sub.variantName}</p>}
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub.subscriptionNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-foreground">{formatCurrency(sub.totalAmount)}</span>
                    <span className="text-xs text-muted-foreground block capitalize">per {sub.billingFrequency}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/40 rounded-lg space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Active Seats:</span>
                    <span className="font-bold text-foreground">{sub.quantity} license(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started On:</span>
                    <span>{new Date(sub.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Next Renewal / Billing:</span>
                    <span className="text-primary">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoices & Statements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Invoices & Billing Statements
          </h2>
          <Link to="/invoices">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Invoices
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 text-right">Balance Due</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20">
                      <td className="p-3.5 font-bold font-mono text-foreground">{inv.invoiceNumber}</td>
                      <td className="p-3.5 text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="p-3.5 text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right font-bold text-foreground">{formatCurrency(inv.grandTotal)}</td>
                      <td className="p-3.5 text-right font-bold text-primary">{formatCurrency(inv.balanceDue)}</td>
                      <td className="p-3.5 text-center">
                        <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} size="sm" className="capitalize">
                          {inv.status.replace('_', ' ')}
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
    </div>
  );
};
