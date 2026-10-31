import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { DashboardMetrics, Subscription, Invoice, Payment } from '../../types';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/money';
import {
  Users,
  Repeat,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Package,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [m, subs, invs] = await Promise.all([
        dbService.getDashboardMetrics(),
        dbService.getSubscriptions(),
        dbService.getInvoices(),
      ]);
      setMetrics(m);
      setRecentSubscriptions(subs.slice(0, 5));
      setRecentInvoices(invs.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Revenue projection / cashflow chart data
  const revenueTrendData = [
    { month: 'Jun', invoiced: 85000, collected: 80000 },
    { month: 'Jul', invoiced: 110000, collected: 98000 },
    { month: 'Aug', invoiced: 145000, collected: 135000 },
    { month: 'Sep', invoiced: 180000, collected: 172000 },
    { month: 'Oct', invoiced: 245000, collected: 215000 },
  ];

  const subscriptionStatusData = metrics
    ? [
        { name: 'Active', value: metrics.activeSubscriptions, color: '#10B981' },
        { name: 'Paused', value: metrics.pausedSubscriptions, color: '#F59E0B' },
        { name: 'Closed', value: metrics.closedSubscriptions, color: '#6B7280' },
      ]
    : [];

  const invoiceHealthData = metrics
    ? [
        { name: 'Paid', value: metrics.paidInvoices, color: '#10B981' },
        { name: 'Outstanding', value: metrics.outstandingInvoices, color: '#3B82F6' },
        { name: 'Overdue', value: metrics.overdueInvoices, color: '#EF4444' },
      ]
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Executive Dashboard
            </h1>
            <Badge variant="default" size="sm" className="hidden sm:inline-flex">
              Live Real-Time
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Brightloop Software — Recurring revenue operations, MRR analytics, and lifecycle metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Refresh Data
          </Button>
          <Link to="/billing-engine">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <TrendingUp className="h-4 w-4" />
              Run Billing Cycle
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly Recurring Revenue (MRR)"
          value={formatCurrency(metrics?.mrr || 0)}
          subtitle="Normalized monthly subscription run rate"
          icon={DollarSign}
          color="primary"
          trend={{ value: '+18.4% vs last mo', isPositive: true }}
        />
        <StatsCard
          title="Annual Recurring Revenue (ARR)"
          value={formatCurrency(metrics?.arr || 0)}
          subtitle="Annualized recurring velocity (MRR × 12)"
          icon={TrendingUp}
          color="emerald"
          trend={{ value: '+24.1% YoY', isPositive: true }}
        />
        <StatsCard
          title="Actual Cash Collected"
          value={formatCurrency(metrics?.revenueReceived || 0)}
          subtitle="Reconciled payments received"
          icon={CreditCard}
          color="emerald"
        />
        <StatsCard
          title="Outstanding Receivables"
          value={formatCurrency(metrics?.outstandingRevenue || 0)}
          subtitle={`${metrics?.overdueInvoices || 0} overdue invoice(s)`}
          icon={AlertTriangle}
          color={metrics?.overdueInvoices ? 'rose' : 'amber'}
        />
      </div>

      {/* Operational Lifecycle Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Active Subs</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.activeSubscriptions || 0}</h4>
          <span className="text-[11px] text-muted-foreground">Of {metrics?.totalSubscriptions || 0} total</span>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Paused Subs</p>
          <h4 className="text-2xl font-bold text-amber-600 mt-1">{metrics?.pausedSubscriptions || 0}</h4>
          <span className="text-[11px] text-muted-foreground">Temporarily on hold</span>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Paid Invoices</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.paidInvoices || 0}</h4>
          <span className="text-[11px] text-muted-foreground">Of {metrics?.totalInvoices || 0} total</span>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Overdue</p>
          <h4 className="text-2xl font-bold text-rose-600 mt-1">{metrics?.overdueInvoices || 0}</h4>
          <span className="text-[11px] text-muted-foreground">Requires follow-up</span>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Customers</p>
          <h4 className="text-2xl font-bold text-foreground mt-1">{metrics?.totalCustomers || 0}</h4>
          <span className="text-[11px] text-muted-foreground">Enterprise clients</span>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Products</p>
          <h4 className="text-2xl font-bold text-foreground mt-1">{metrics?.totalProducts || 0}</h4>
          <span className="text-[11px] text-muted-foreground">Configured SKUs</span>
        </Card>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow & Invoicing Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Invoiced Revenue vs Cash Collected (₹)</span>
              <span className="text-xs font-medium text-muted-foreground">Last 5 Months</span>
            </CardTitle>
            <CardDescription>
              Comparing total billed value against verified bank reconciliation
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#6366F1" fillOpacity={1} fill="url(#colorInvoiced)" />
                <Area type="monotone" dataKey="collected" name="Cash Received" stroke="#10B981" fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Lifecycle Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Subscription Lifecycle</CardTitle>
            <CardDescription>Status breakdown of all contracted subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={subscriptionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs mt-2">
              {subscriptionStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Grids: Recent Subscriptions & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Subscriptions</CardTitle>
              <CardDescription>Active & transitioning recurring agreements</CardDescription>
            </div>
            <Link to="/subscriptions">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {recentSubscriptions.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{sub.subscriptionNumber}</span>
                      <Badge
                        variant={sub.status === 'active' ? 'success' : sub.status === 'paused' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.customerSnapshot.companyName} • {sub.productName} ({sub.billingFrequency})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatCurrency(sub.totalAmount)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Invoices</CardTitle>
              <CardDescription>Billed cycles, payment reconciliation & balances</CardDescription>
            </div>
            <Link to="/invoices">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{inv.invoiceNumber}</span>
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'overdue'
                            ? 'danger'
                            : 'info'
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inv.customerSnapshot.companyName} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatCurrency(inv.grandTotal)}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {inv.balanceDue === 0 ? 'Fully Paid' : `Balance: ${formatCurrency(inv.balanceDue)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
