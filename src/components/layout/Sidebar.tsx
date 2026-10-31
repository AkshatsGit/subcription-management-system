import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarCheck,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Landmark,
  BarChart3,
  UserCheck,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';

export const Sidebar: React.FC = () => {
  const { role, isAdmin, isStaff, isCustomer, switchSimulatedRole } = useAuth();

  const adminStaffNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Plans', path: '/plans', icon: CalendarCheck },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { label: 'Billing Engine', path: '/billing-engine', icon: Zap },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Discounts', path: '/discounts', icon: Percent },
    { label: 'Taxes', path: '/taxes', icon: Landmark },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    ...(isAdmin ? [{ label: 'Staff Management', path: '/staff', icon: UserCheck }] : []),
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const customerNavItems = [
    { label: 'My Subscriptions', path: '/portal', icon: Repeat },
    { label: 'My Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payment History', path: '/payments', icon: CreditCard },
    { label: 'Account Profile', path: '/settings', icon: Settings },
  ];

  const navItems = isCustomer ? customerNavItems : adminStaffNavItems;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-white shadow-md shadow-primary/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-foreground leading-tight">
              Brightloop
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Subscription System
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant={isAdmin ? 'default' : isStaff ? 'info' : 'success'}
            size="sm"
            className="capitalize"
          >
            Role: {role}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-medium">Team Ripple</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Role Switcher Sandbox Widget for Evaluators */}
      {switchSimulatedRole && (
        <div className="p-3 mx-3 mb-3 bg-muted/60 border border-border rounded-xl text-xs space-y-2">
          <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
            Switch Perspective:
          </p>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchSimulatedRole('admin')}
              className={`py-1 rounded text-[11px] font-semibold transition-all ${
                role === 'admin' ? 'bg-primary text-white shadow-xs' : 'bg-background hover:bg-card text-muted-foreground'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchSimulatedRole('staff')}
              className={`py-1 rounded text-[11px] font-semibold transition-all ${
                role === 'staff' ? 'bg-primary text-white shadow-xs' : 'bg-background hover:bg-card text-muted-foreground'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => switchSimulatedRole('customer')}
              className={`py-1 rounded text-[11px] font-semibold transition-all ${
                role === 'customer' ? 'bg-primary text-white shadow-xs' : 'bg-background hover:bg-card text-muted-foreground'
              }`}
            >
              Customer
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Brightloop v1.0</span>
        <span className="font-semibold text-foreground/80">Built by Team Ripple</span>
      </div>
    </aside>
  );
};
