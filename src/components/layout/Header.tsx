import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, UserCircle, Search, Shield, Briefcase, Building2 } from 'lucide-react';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, role, logout, switchSimulatedRole } = useAuth();

  const handleRoleToggle = (newRole: UserRole) => {
    if (switchSimulatedRole) {
      switchSimulatedRole(newRole);
      if (newRole === 'customer') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <header className="h-14 border-b border-[#192233] bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Search / Command palette */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[#0E1526] border border-[#1E293B] rounded-md text-xs text-slate-400">
          <Search className="h-3.5 w-3.5" />
          <span>Search resources, invoices, or subscriptions...</span>
          <kbd className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded ml-4 border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Role Persona Quick Switcher (Direct User Requirement) */}
      <div className="flex items-center gap-1.5 bg-[#0B0F19] border border-[#192233] p-1 rounded-lg">
        <span className="text-[10px] font-mono uppercase text-slate-400 px-2 hidden sm:inline">Role View:</span>
        <button
          type="button"
          onClick={() => handleRoleToggle('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            role === 'admin'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#141C2E]'
          }`}
          title="Switch to Admin View (Full Access)"
        >
          <Shield className="h-3 w-3" />
          <span>Admin</span>
        </button>
        <button
          type="button"
          onClick={() => handleRoleToggle('staff')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            role === 'staff'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#141C2E]'
          }`}
          title="Switch to Staff View (Operations & Billing)"
        >
          <Briefcase className="h-3 w-3" />
          <span>Staff</span>
        </button>
        <button
          type="button"
          onClick={() => handleRoleToggle('customer')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            role === 'customer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#141C2E]'
          }`}
          title="Switch to Client/Customer View (Customer Portal)"
        >
          <Building2 className="h-3 w-3" />
          <span>Client Portal</span>
        </button>
      </div>

      {/* Profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-right pl-3 border-l border-[#192233]">
          <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold font-mono text-xs border border-blue-500/20">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserCircle className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">{userProfile?.displayName || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-mono capitalize">{role} Active</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 text-xs h-7 px-2.5 border-[#1E293B] text-slate-300 hover:text-white">
          <LogOut className="h-3 w-3" />
          <span>Exit</span>
        </Button>
      </div>
    </header>
  );
};
