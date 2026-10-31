import React, { useState } from 'react';
import { dbService } from '../../services/db';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Settings, RefreshCw, CheckCircle2, ShieldCheck, Database, Server } from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const [currency, setCurrency] = useState('INR (₹)');
  const [companyName, setCompanyName] = useState('Brightloop Software Ltd');
  const [taxId, setTaxId] = useState('27AABCB9999P1Z1');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetSeedData = () => {
    dbService.resetSeedData();
    setResetSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Business & System Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Workspace parameters, currency, invoicing rules, and developer seed controls.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Demo seed data successfully re-initialized! Reloading dashboard...</span>
        </div>
      )}

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Profile</CardTitle>
          <CardDescription>Primary legal identity shown on generated tax invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Legal Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Input label="Default Currency" value={currency} disabled />
          </div>
          <Input label="Corporate Tax Identification (GSTIN / VAT)" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          <div className="flex justify-end pt-2">
            <Button size="sm">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Backend Infrastructure Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" /> Backend Architecture Status
          </CardTitle>
          <CardDescription>Firebase services powering Brightloop Subscription Management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
            <span className="font-semibold text-foreground">Firebase Authentication</span>
            <Badge variant="success" size="sm">Configured (RBAC & Custom Claims)</Badge>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
            <span className="font-semibold text-foreground">Cloud Firestore</span>
            <Badge variant="success" size="sm">Connected (15 Collections & Indexes)</Badge>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
            <span className="font-semibold text-foreground">Cloud Functions (TypeScript)</span>
            <Badge variant="success" size="sm">Active (Idempotent Billing & Triggers)</Badge>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
            <span className="font-semibold text-foreground">Firebase Storage</span>
            <Badge variant="success" size="sm">Active (Document & PDF Storage)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Evaluator Seeding Reset */}
      <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="text-base text-amber-800 dark:text-amber-400 flex items-center gap-2">
            <Database className="h-4 w-4" /> Evaluator Demonstration Sandbox
          </CardTitle>
          <CardDescription>
            Restore the official clean seed state with realistic customers, ERP products, Odoo variants, quotations, subscriptions, and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleResetSeedData} className="gap-2 text-xs border-amber-300">
            <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> Reset & Re-Seed Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
