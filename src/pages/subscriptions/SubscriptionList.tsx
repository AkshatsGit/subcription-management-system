import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Subscription, SubscriptionStatus } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/money';
import { canTransitionSubscription } from '../../utils/status';
import { Repeat, Play, Pause, XCircle, RotateCcw, Clock, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const SubscriptionList: React.FC = () => {
  const { userProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<SubscriptionStatus>('active');
  const [transitionReason, setTransitionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historySub, setHistorySub] = useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    const list = await dbService.getSubscriptions();
    setSubscriptions(list);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const openTransitionModal = (sub: Subscription, status: SubscriptionStatus) => {
    setSelectedSub(sub);
    setTargetStatus(status);
    setTransitionReason(
      status === 'paused'
        ? 'Customer requested temporary pause during business migration.'
        : status === 'active'
        ? 'Customer resumed subscription operations.'
        : status === 'closed'
        ? 'Early contract termination as requested.'
        : 'Status update'
    );
    setErrorMsg(null);
    setIsTransitionModalOpen(true);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      await dbService.updateSubscriptionStatus(
        selectedSub.id,
        targetStatus,
        transitionReason,
        userProfile?.displayName || 'Authorized User'
      );
      setIsTransitionModalOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transition blocked by lifecycle business rules.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions Lifecycle</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Finite state machine: Draft → Quotation → Confirmed → Active → Closed (plus Paused). Full audit logs.
          </p>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 gap-4">
        {subscriptions.map((sub) => {
          return (
            <Card key={sub.id} className="p-5 hover:border-primary/40 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">{sub.subscriptionNumber}</span>
                    <Badge
                      variant={
                        sub.status === 'active'
                          ? 'success'
                          : sub.status === 'paused'
                          ? 'warning'
                          : sub.status === 'closed'
                          ? 'neutral'
                          : 'info'
                      }
                      size="sm"
                      className="capitalize"
                    >
                      {sub.status}
                    </Badge>
                    <Badge variant="outline" size="sm" className="capitalize text-[11px]">
                      {sub.billingFrequency} (Anchor Day: {sub.anchorDay})
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {sub.customerSnapshot?.companyName} • {sub.productName}
                    {sub.variantName && <span className="text-primary font-normal"> (+{sub.variantName})</span>}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>Started: {new Date(sub.startDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground">
                      Next Due Billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>Terms: {sub.paymentTerms}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Recurring Rate</p>
                    <p className="text-xl font-extrabold text-foreground">{formatCurrency(sub.totalAmount)}</p>
                    <p className="text-[11px] text-muted-foreground">Qty: {sub.quantity} seat(s)</p>
                  </div>

                  {/* Controlled Lifecycle Actions */}
                  <div className="flex items-center gap-2">
                    {sub.status === 'active' && sub.allowPause && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTransitionModal(sub, 'paused')}
                        className="gap-1 text-xs"
                      >
                        <Pause className="h-3.5 w-3.5 text-amber-500" /> Pause
                      </Button>
                    )}

                    {sub.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTransitionModal(sub, 'active')}
                        className="gap-1 text-xs text-emerald-600 border-emerald-200"
                      >
                        <Play className="h-3.5 w-3.5" /> Resume
                      </Button>
                    )}

                    {sub.status !== 'closed' && sub.allowEarlyClosure && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTransitionModal(sub, 'closed')}
                        className="gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Close Early
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistorySub(sub)}
                      className="gap-1 text-xs text-muted-foreground"
                    >
                      <History className="h-3.5 w-3.5" /> History
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Transition Confirmation Modal */}
      {selectedSub && (
        <Modal
          isOpen={isTransitionModalOpen}
          onClose={() => setIsTransitionModalOpen(false)}
          title={`Transition Subscription: ${selectedSub.subscriptionNumber}`}
          description={`Change status from '${selectedSub.status}' to '${targetStatus}'.`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteTransition} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-foreground">Current Customer:</p>
              <p>{selectedSub.customerSnapshot.companyName}</p>
              <p className="text-muted-foreground">Product: {selectedSub.productName}</p>
            </div>

            <Input
              label="Mandatory Reason for Transition (Audit Logged)"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsTransitionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={targetStatus === 'closed' ? 'danger' : 'primary'}
              >
                Confirm {targetStatus.toUpperCase()} Transition
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Audit Trail Modal */}
      {historySub && (
        <Modal
          isOpen={!!historySub}
          onClose={() => setHistorySub(null)}
          title={`Audit History — ${historySub.subscriptionNumber}`}
          description="Complete chronological lifecycle events and state transitions."
          maxWidth="lg"
        >
          <div className="space-y-4">
            {historySub.history && historySub.history.length > 0 ? (
              <div className="relative pl-6 border-l border-border space-y-4">
                {historySub.history.map((h, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <span className="capitalize">{h.fromStatus}</span>
                        <span>→</span>
                        <span className="capitalize text-primary">{h.toStatus}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{h.reason}</p>
                      <p className="text-[10px] text-muted-foreground/75 mt-1">
                        By {h.performedBy} on {new Date(h.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No historical transitions recorded yet.</p>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <Button size="sm" onClick={() => setHistorySub(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

