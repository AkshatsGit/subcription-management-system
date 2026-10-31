import React from 'react';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'sky';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
}) => {
  const colorStyles = {
    primary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };

  return (
    <Card className="p-4 flex flex-col justify-between hover:border-blue-500/30 transition-all bg-[#0B0F19] border-[#192233]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <h4 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
            {value}
          </h4>
        </div>
        <div className={`p-2 rounded-md border ${colorStyles[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-[#192233]">
          {subtitle && <span className="truncate mr-2">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono font-semibold shrink-0 flex items-center gap-0.5 ${
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
