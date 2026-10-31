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
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';

// Bespoke Geometric Logo for Brightloop / Team Ripple
export const BrightloopLogo: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="32" height="32" rx="8" fill="#1E293B" />
    <circle cx="16" cy="16" r="10" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
    <circle cx="16" cy="16" r="6" stroke="#60A5FA" strokeWidth="2.5" />
    <circle cx="16" cy="16" r="2.5" fill="#93C5FD" />
  </svg>
);

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { role, isAdmin, isStaff, isCustomer, switchSimulatedRole } = useAuth();

  const adminStaffNavItems: NavItem[] = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products & SKUs', path: '/products', icon: Package },
    { label: 'Subscription Plans', path: '/plans', icon: CalendarCheck },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { label: 'Billing Engine', path: '/billing-engine', icon: Zap, badge: 'Automated' },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payments & UTR', path: '/payments', icon: CreditCard },
    { label: 'Discounts', path: '/discounts', icon: Percent },
    { label: 'Tax Rules', path: '/taxes', icon: Landmark },
    { label: 'Revenue Analytics', path: '/reports', icon: BarChart3 },
    ...(isAdmin ? [{ label: 'Staff Directory', path: '/staff', icon: UserCheck }] : []),
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const customerNavItems: NavItem[] = [
    { label: 'My Subscriptions', path: '/portal', icon: Repeat },
    { label: 'Invoices & Receipts', path: '/invoices', icon: Receipt },
    { label: 'Payment Ledger', path: '/payments', icon: CreditCard },
    { label: 'Account Profile', path: '/settings', icon: Settings },
  ];

  const navItems = isCustomer ? customerNavItems : adminStaffNavItems;

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-[#192233] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#192233]">
        <div className="flex items-center gap-3">
          <BrightloopLogo className="h-8 w-8 shrink-0 shadow-md shadow-blue-500/20" />
          <div className="min-w-0">
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Brightloop
              <span className="text-[10px] font-mono px-1 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                SaaS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate">Subscription Engine</p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="mt-3.5 flex items-center justify-between pt-3 border-t border-[#192233]/70 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Active Node</span>
          </div>
          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800/80">
            {role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Perspective Switcher for Reviewers */}
      {switchSimulatedRole && (
        <div className="p-3 mx-3 mb-2 bg-[#0E1526] border border-[#1E293B] rounded-lg text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Persona Lens
            </span>
            <span className="text-[9px] text-blue-400 font-mono">Quick Switch</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchSimulatedRole('admin')}
              className={`py-1 rounded text-[10px] font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchSimulatedRole('staff')}
              className={`py-1 rounded text-[10px] font-semibold transition-all ${
                role === 'staff'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => switchSimulatedRole('customer')}
              className={`py-1 rounded text-[10px] font-semibold transition-all ${
                role === 'customer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Client
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Footer with Attribution */}
      <div className="p-3.5 border-t border-[#192233] bg-[#090D16] text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-mono text-[10px]">v1.0.4-prod</span>
        <span className="font-semibold text-slate-300 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Team Ripple
        </span>
      </div>
    </aside>
  );
};
