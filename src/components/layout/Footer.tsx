import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#192233] bg-[#07090E] py-3 px-6 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto font-mono">
      <div>
        <span className="font-semibold text-slate-300">Brightloop Subscription Management System</span> • Enterprise Billing Architecture
      </div>
      <div className="text-blue-400 font-semibold flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Built by Team Ripple
      </div>
    </footer>
  );
};
