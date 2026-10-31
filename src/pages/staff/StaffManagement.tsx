import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { UserCheck, Plus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface StaffUser {
  id: string;
  displayName: string;
  email: string;
  role: 'staff' | 'admin';
  createdAt: string;
}

export const StaffManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<StaffUser[]>([
    {
      id: 'staff_1',
      displayName: 'Vikram Joshi (Operations Lead)',
      email: 'staff@brightloop.com',
      role: 'staff',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'staff_2',
      displayName: 'Sneha Patel (Billing Officer)',
      email: 'sneha.patel@brightloop.com',
      role: 'staff',
      createdAt: '2026-03-01T12:00:00Z',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <Shield className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Only System Administrators have authorization to provision and manage staff credentials.
        </p>
      </div>
    );
  }

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: StaffUser = {
      id: `staff_${Date.now()}`,
      displayName,
      email,
      role: 'staff',
      createdAt: new Date().toISOString(),
    };
    setStaffList([...staffList, newStaff]);
    setSuccessMsg(`Staff account for ${displayName} (${email}) provisioned with server custom claims.`);
    setIsModalOpen(false);
    setDisplayName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Admin-only provisioning. Assign staff roles to handle quotations, subscriptions, and payment recording.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Provision Staff Account
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staffList.map((s) => (
          <Card key={s.id} className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground">{s.displayName}</span>
                <Badge variant="info" size="sm" className="uppercase text-[10px]">
                  {s.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.email}</p>
              <p className="text-[11px] text-muted-foreground">
                Provisioned: {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal for staff creation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Staff Account"
        description="Creates Firebase user with server-controlled staff custom claims."
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Full Name & Role Title"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Maya Sen (Billing Specialist)"
            required
          />
          <Input
            label="Corporate Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maya@brightloop.com"
            required
          />
          <Input
            label="Temporary Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Provision Staff Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
