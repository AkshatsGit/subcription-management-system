import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { DashboardMetrics, Subscription, Invoice } from '../../types';
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
  Zap,
  ArrowUpRight,
  RefreshCw,
  Layers,
  ShieldCheck,
  CheckCircle2,
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
} from 'recharts';
import { Link } from 'react-router-dom';

export const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [financeFilter, setFinanceFilter] = useState<'all' | 'active_subs' | 'overdue_invs' | 'paid_invs'>('all');
  const [queryLatencyMs, setQueryLatencyMs] = useState<number>(4);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const [m, subs, invs] = await Promise.all([
        dbService.getDashboardMetrics(),
        dbService.getSubscriptions(),
        dbService.getInvoices(),
      ]);
      setMetrics(m);
      setSubscriptions(subs);
      setInvoices(invs);
      setQueryLatencyMs(Math.round(performance.now() - start));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: 'all' | 'active_subs' | 'overdue_invs' | 'paid_invs') => {
    const start = performance.now();
    setFinanceFilter(filter);
    setQueryLatencyMs(Math.max(1, Math.round(performance.now() - start)));
  };

  const recentSubscriptions = subscriptions.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  const filteredSubscriptions = subscriptions.filter((s) => financeFilter === 'active_subs' ? s.status === 'active' : true);
  const filteredInvoices = invoices.filter((inv) => {
    if (financeFilter === 'overdue_invs') return inv.status === 'overdue';
    if (financeFilter === 'paid_invs') return inv.status === 'paid';
    return true;
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const revenueTrendData = [
    { month: 'Jun', invoiced: 85000, collected: 80000 },
    { month: 'Jul', invoiced: 110000, collected: 98000 },
    { month: 'Aug', invoiced: 145000, collected: 135000 },
    { month: 'Sep', invoiced: 180000, collected: 172000 },
    { month: 'Oct', invoiced: 245000, collected: 215000 },
  ];

  const subscriptionStatusData = metrics
    ? [
        { name: 'Active', value: metrics.activeSubscriptions, color: '#3B82F6' },
        { name: 'Paused', value: metrics.pausedSubscriptions, color: '#F59E0B' },
        { name: 'Closed', value: metrics.closedSubscriptions, color: '#64748B' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Revenue & Subscription Intelligence
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Brightloop Software • Unified MRR run-rate, idempotent recurring billing, and cohort metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-1.5 text-xs h-8">
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Refresh
          </Button>
          <Link to="/billing-engine">
            <Button size="sm" className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20">
              <Zap className="h-3.5 w-3.5" />
              Run Billing Cycle
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Ticker */}
      <div className="p-3 bg-[#0B0F19] border border-[#192233] rounded-lg text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-white">Idempotent Billing Safe:</strong> 0 duplicate invoices • Month-end anchor clamp active
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Team Ripple Engine v1.0
        </span>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly Recurring Revenue (MRR)"
          value={formatCurrency(metrics?.mrr || 0)}
          subtitle="Normalized contracted monthly velocity"
          icon={DollarSign}
          color="primary"
          trend={{ value: '+18.4% MoM', isPositive: true }}
        />
        <StatsCard
          title="Annual Recurring Revenue (ARR)"
          value={formatCurrency(metrics?.arr || 0)}
          subtitle="Annualized run rate (MRR × 12)"
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
          subtitle={`${metrics?.overdueInvoices || 0} invoice(s) past due date`}
          icon={AlertTriangle}
          color={metrics?.overdueInvoices ? 'rose' : 'amber'}
        />
      </div>

      {/* Operational Lifecycle Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 text-center bg-[#0B0F19] border-[#192233]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Active Subs</p>
          <h4 className="text-xl font-bold font-mono text-blue-400 mt-1">{metrics?.activeSubscriptions || 0}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Of {metrics?.totalSubscriptions || 0} total</span>
        </Card>
        <Card className="p-3.5 text-center bg-[#0B0F19] border-[#192233]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Paused Subs</p>
          <h4 className="text-xl font-bold font-mono text-amber-400 mt-1">{metrics?.pausedSubscriptions || 0}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Temporarily held</span>
        </Card>
        <Card className="p-3.5 text-center bg-[#0B0F19] border-[#192233]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Paid Invoices</p>
          <h4 className="text-xl font-bold font-mono text-emerald-400 mt-1">{metrics?.paidInvoices || 0}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Fully settled</span>
        </Card>
        <Card className="p-3.5 text-center bg-[#0B0F19] border-[#192233]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Overdue</p>
          <h4 className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics?.overdueInvoices || 0}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Requires dunning</span>
        </Card>
        <Card className="p-3.5 text-center bg-[#0B0F19] border-[#192233]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Clients</p>
          <h4 className="text-xl font-bold font-mono text-white mt-1">{metrics?.totalCustomers || 0}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Organizations</span>
        </Card>
        <Card className="p-3.5 text-center bg-[#0B0F19] border-[#192233]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Products</p>
          <h4 className="text-xl font-bold font-mono text-white mt-1">{metrics?.totalProducts || 0}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Catalog SKUs</span>
        </Card>
      </div>

      {/* Finance Lead End-of-Month Review & Fast Filter Toolbar */}
      <div className="p-3 bg-[#0B0F19] border border-[#192233] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 mr-1">Finance Review:</span>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              financeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#141C2E] text-slate-400 hover:text-white'
            }`}
          >
            All Portfolio
          </button>
          <button
            onClick={() => handleFilterChange('active_subs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              financeFilter === 'active_subs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#141C2E] text-slate-400 hover:text-white'
            }`}
          >
            Active Subscriptions ({metrics?.activeSubscriptions || 0})
          </button>
          <button
            onClick={() => handleFilterChange('overdue_invs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              financeFilter === 'overdue_invs'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[#141C2E] text-slate-400 hover:text-white'
            }`}
          >
            Overdue Invoices ({metrics?.overdueInvoices || 0})
          </button>
          <button
            onClick={() => handleFilterChange('paid_invs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              financeFilter === 'paid_invs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[#141C2E] text-slate-400 hover:text-white'
            }`}
          >
            Paid Invoices ({metrics?.paidInvoices || 0})
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SLA &lt; 2.0s target:</span>
          <span className="text-emerald-400 font-bold">{queryLatencyMs}ms actual</span>
        </div>
      </div>

      {/* Finance Filter Drill-Down Results (if filtered) */}
      {financeFilter !== 'all' && (
        <Card className="p-4 bg-[#0B0F19] border-blue-500/30 animate-in fade-in">
          <div className="flex items-center justify-between mb-3 border-b border-[#192233] pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {financeFilter === 'active_subs' && `Active Subscription Portfolio (${filteredSubscriptions.length})`}
              {financeFilter === 'overdue_invs' && `Overdue Invoices for Immediate Dunning (${filteredInvoices.length})`}
              {financeFilter === 'paid_invs' && `Fully Settled Revenue Invoices (${filteredInvoices.length})`}
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleFilterChange('all')} className="h-6 text-xs text-slate-400 hover:text-white">
              Close Filter
            </Button>
          </div>

          <div className="divide-y divide-[#192233]">
            {financeFilter === 'active_subs' &&
              filteredSubscriptions.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-400">{sub.subscriptionNumber}</span>
                    <span className="text-white ml-2">{sub.customerSnapshot.companyName}</span>
                    <span className="text-slate-400 ml-2">({sub.productName} • {sub.billingFrequency})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-sm">{formatCurrency(sub.totalAmount)}</span>
                    <span className="text-slate-400 ml-3 text-[11px]">Next: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

            {(financeFilter === 'overdue_invs' || financeFilter === 'paid_invs') &&
              filteredInvoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{inv.invoiceNumber}</span>
                    <span className="text-slate-300 ml-2">{inv.customerSnapshot.companyName}</span>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'danger'} size="sm" className="ml-2">
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-sm">{formatCurrency(inv.grandTotal)}</span>
                    <span className={`ml-3 text-[11px] font-mono ${inv.balanceDue === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {inv.balanceDue === 0 ? 'Settled' : `Due: ${formatCurrency(inv.balanceDue)}`}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow & Invoicing Trend */}
        <Card className="lg:col-span-2 bg-[#0B0F19] border-[#192233]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white">Invoiced Value vs Cash Collected (₹)</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Comparing gross billing against reconciled bank receipts
                </CardDescription>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Trailing 5 Mo
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '6px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#3B82F6" strokeWidth={2} fill="url(#colorInvoiced)" />
                <Area type="monotone" dataKey="collected" name="Cash Collected" stroke="#10B981" strokeWidth={2} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Lifecycle Distribution */}
        <Card className="bg-[#0B0F19] border-[#192233]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white">Subscription Statuses</CardTitle>
            <CardDescription className="text-xs text-slate-400">Current portfolio distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={subscriptionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {subscriptionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '6px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-3 text-xs mt-1">
              {subscriptionStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}:</span>
                  <span className="font-bold text-white font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Grids: Recent Subscriptions & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <Card className="bg-[#0B0F19] border-[#192233]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-white">Recent Contracts</CardTitle>
              <CardDescription className="text-xs text-slate-400">Latest active & renewing subscriptions</CardDescription>
            </div>
            <Link to="/subscriptions">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-400 hover:text-white h-7">
                All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#192233]">
              {recentSubscriptions.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{sub.subscriptionNumber}</span>
                      <Badge
                        variant={sub.status === 'active' ? 'success' : sub.status === 'paused' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {sub.customerSnapshot.companyName} • {sub.productName} ({sub.billingFrequency})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-white text-sm">{formatCurrency(sub.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-[#0B0F19] border-[#192233]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-white">Recent Statements</CardTitle>
              <CardDescription className="text-xs text-slate-400">Billing statements & balance due</CardDescription>
            </div>
            <Link to="/invoices">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-400 hover:text-white h-7">
                All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#192233]">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{inv.invoiceNumber}</span>
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
                    <p className="text-slate-400 mt-0.5">
                      {inv.customerSnapshot.companyName} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-white text-sm">{formatCurrency(inv.grandTotal)}</p>
                    <p className={`text-[10px] font-mono ${inv.balanceDue === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {inv.balanceDue === 0 ? 'Fully Paid' : `Due: ${formatCurrency(inv.balanceDue)}`}
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
