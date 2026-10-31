import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, UserCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { userProfile, role, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Workspace:</span>
        <span className="text-sm font-bold text-foreground">Brightloop Software HQ</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-right">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-foreground leading-tight">{userProfile?.displayName || 'User'}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{role} Account</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 text-xs">
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
};

