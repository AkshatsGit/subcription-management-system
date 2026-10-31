import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { DashboardMetrics, Invoice, Payment, Subscription } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/money';
import { BarChart3, TrendingUp, Download, PieChart as PieIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Reports: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const load = async () => {
      const [m, invs, pays] = await Promise.all([
        dbService.getDashboardMetrics(),
        dbService.getInvoices(),
        dbService.getPayments(),
      ]);
      setMetrics(m);
      setInvoices(invs);
      setPayments(pays);
    };
    load();
  }, []);

  const monthlyGrowthData = [
    { month: 'Jun', activeSubs: 12, newSubs: 4, churned: 1 },
    { month: 'Jul', activeSubs: 16, newSubs: 5, churned: 1 },
    { month: 'Aug', activeSubs: 21, newSubs: 6, churned: 1 },
    { month: 'Sep', activeSubs: 28, newSubs: 8, churned: 1 },
    { month: 'Oct', activeSubs: 35, newSubs: 9, churned: 2 },
  ];

  const paymentMethodData = [
    { name: 'Bank Transfer (NEFT/RTGS)', value: 65, color: '#6366F1' },
    { name: 'Corporate Credit Card', value: 20, color: '#10B981' },
    { name: 'UPI', value: 10, color: '#3B82F6' },
    { name: 'Cheque', value: 5, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Revenue Analytics & Executive Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cash collected vs recognized invoiced run rate, subscription cohort growth, and payment methods.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 text-xs">
          <Download className="h-4 w-4" /> Export Report (PDF)
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Revenue Invoiced</span>
          <p className="text-2xl font-black text-foreground mt-1">
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Cash Reconciled</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(metrics?.revenueReceived || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Outstanding Receivables</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(metrics?.outstandingRevenue || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Collection Efficiency</span>
          <p className="text-2xl font-black text-primary mt-1">
            {invoices.length > 0
              ? `${Math.round(
                  ((metrics?.revenueReceived || 1) /
                    Math.max(1, (metrics?.revenueReceived || 0) + (metrics?.outstandingRevenue || 0))) *
                    100
                )}%`
              : '100%'}
          </p>
        </Card>
      </div>

      {/* Monthly Subscription Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Subscription Portfolio Growth & Net Additions</span>
            <span className="text-xs font-normal text-muted-foreground">Historical Trajectory</span>
          </CardTitle>
          <CardDescription>Active subscription expansion vs new bookings and terminations</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyGrowthData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="activeSubs" name="Total Active Contracts" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="newSubs" name="New Onboardings" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="churned" name="Contract Closures" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods Utilization</CardTitle>
            <CardDescription>Reconciled payments segmented by financial channel</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 text-xs mt-2 justify-center">
              {paymentMethodData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Discount & Coupon Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discount & Incentive ROI</CardTitle>
            <CardDescription>Performance of active promotion rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-foreground">
                <span>RIPPLE20 (20% Launch Promo)</span>
                <span className="text-emerald-600">14 / 100 Redeemed</span>
              </div>
              <p className="text-muted-foreground">Generated ₹3.5L in new enterprise bookings with 20% margin incentive.</p>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-foreground">
                <span>FLAT500 (Onboarding Credit)</span>
                <span className="text-emerald-600">8 / 50 Redeemed</span>
              </div>
              <p className="text-muted-foreground">Stimulated trial-to-paid conversion for monthly software subscribers.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

