import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { BillingJobLog, Subscription } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/money';
import { isSubscriptionDueForBilling } from '../../utils/billing';
import { Zap, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, History, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BillingOperations: React.FC = () => {
  const [jobs, setJobs] = useState<BillingJobLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [latestJobResult, setLatestJobResult] = useState<BillingJobLog | null>(null);

  const loadData = async () => {
    const [jList, sList] = await Promise.all([dbService.getBillingJobs(), dbService.getSubscriptions()]);
    setJobs(jList);
    setSubscriptions(sList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const dueSubscriptions = subscriptions.filter((s) => isSubscriptionDueForBilling(s.nextBillingDate, new Date(), s.status));

  const handleTriggerBilling = async () => {
    setIsRunning(true);
    setLatestJobResult(null);
    try {
      const result = await dbService.runAutomatedBillingJob(new Date());
      setLatestJobResult(result);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Billing job failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Automated Recurring Billing Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Idempotent batch processing, deterministic period locks, and duplicate invoice prevention safeguards.
          </p>
        </div>
        <Button
          onClick={handleTriggerBilling}
          isLoading={isRunning}
          className="gap-2 bg-gradient-to-r from-primary to-violet-600 shadow-md shadow-primary/20"
        >
          <Zap className="h-4 w-4" /> Run Automated Billing Cycle Now
        </Button>
      </div>

      {/* Safeguards Architecture Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-muted/30 border-border/70">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary mb-1">
            <ShieldCheck className="h-4 w-4" /> Idempotent Invoicing
          </div>
          <p className="text-xs text-muted-foreground">
            Invoices are keyed by deterministic IDs (`BP_subId_YYYY-MM-DD`). Re-triggering the scheduler will never
            produce duplicate invoices.
          </p>
        </Card>

        <Card className="p-4 bg-muted/30 border-border/70">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-600 mb-1">
            <Clock className="h-4 w-4" /> Leap & Month-End Clamping
          </div>
          <p className="text-xs text-muted-foreground">
            31st anchor days automatically step into 28/29 on Feb and return to 31st on March, ensuring exact calendar
            reconciliation.
          </p>
        </Card>

        <Card className="p-4 bg-muted/30 border-border/70">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-600 mb-1">
            <RefreshCw className="h-4 w-4" /> Fault-Tolerant Batches
          </div>
          <p className="text-xs text-muted-foreground">
            Individual subscription errors are captured in audit logs without halting subsequent subscriptions in the
            batch queue.
          </p>
        </Card>
      </div>

      {/* Immediate Execution Result Alert */}
      {latestJobResult && (
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-foreground">
                Billing Job Completed: {latestJobResult.id}
              </h3>
            </div>
            <Badge variant={latestJobResult.status === 'success' ? 'success' : 'warning'}>
              Status: {latestJobResult.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block">Evaluated</span>
              <span className="text-lg font-bold text-foreground">{latestJobResult.subscriptionsEvaluated}</span>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block">Invoices Generated</span>
              <span className="text-lg font-bold text-emerald-600">{latestJobResult.invoicesGenerated}</span>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block">Skipped (Idempotent)</span>
              <span className="text-lg font-bold text-foreground">{latestJobResult.skippedCount}</span>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg">
              <span className="text-muted-foreground block">Errors</span>
              <span className="text-lg font-bold text-rose-600">{latestJobResult.errors.length}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link to="/invoices">
              <Button size="sm" variant="outline" className="text-xs">
                Inspect Generated Invoices →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Subscriptions Due for Billing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Subscriptions Due for Billing ({dueSubscriptions.length})</span>
            <span className="text-xs text-muted-foreground font-normal">
              Target date: Today ({new Date().toLocaleDateString()})
            </span>
          </CardTitle>
          <CardDescription>
            Active subscriptions whose contract billing date has arrived and await recurring invoice generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dueSubscriptions.length > 0 ? (
            <div className="divide-y divide-border/60">
              {dueSubscriptions.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{sub.subscriptionNumber}</span>
                      <Badge variant="warning" size="sm">
                        Due Now
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {sub.customerSnapshot.companyName} • {sub.productName} ({sub.billingFrequency})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-sm">{formatCurrency(sub.totalAmount)}</p>
                    <p className="text-muted-foreground">Due: {new Date(sub.nextBillingDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All subscriptions are up to date! Next cycle dates are scheduled in the future.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Billing Jobs Execution Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Billing Jobs Execution History</CardTitle>
          <CardDescription>Immutable record of scheduled and manual recurring billing executions</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <div className="divide-y divide-border/60">
              {jobs.map((job) => (
                <div key={job.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{job.id}</span>
                      <Badge variant={job.status === 'success' ? 'success' : 'warning'} size="sm">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      Started: {new Date(job.startedAt).toLocaleString()} • Completed:{' '}
                      {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'In Progress'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-bold text-emerald-600 text-sm">+{job.invoicesGenerated}</span>
                      <span className="text-muted-foreground block text-[10px]">Invoices</span>
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">{job.skippedCount}</span>
                      <span className="text-muted-foreground block text-[10px]">Skipped (Duplicate Lock)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No historical jobs found. Trigger a billing cycle above to begin logging.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
