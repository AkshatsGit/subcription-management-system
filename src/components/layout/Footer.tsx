import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-4 px-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
      <div>
        <span className="font-semibold text-foreground">Brightloop Subscription Management System</span> — Enterprise Subscription & Recurring Billing Architecture
      </div>
      <div className="font-semibold text-primary">
        Built by Team Ripple
      </div>
    </footer>
  );
};
