import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, UserCircle, Bell, Search, Command } from 'lucide-react';

export const Header: React.FC = () => {
  const { userProfile, role, logout } = useAuth();

  return (
    <header className="h-14 border-b border-[#192233] bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#0E1526] border border-[#1E293B] rounded-md text-xs text-slate-400">
          <Search className="h-3.5 w-3.5" />
          <span>Search resources, invoices, or subscriptions...</span>
          <kbd className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded ml-4 border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-right pl-3 border-l border-[#192233]">
          <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold font-mono text-xs border border-blue-500/20">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserCircle className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">{userProfile?.displayName || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-mono capitalize">{role} Account</p>
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
