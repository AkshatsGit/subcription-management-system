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
    primary: 'bg-primary/10 text-primary border-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  };

  return (
    <Card className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <h4 className="text-2xl font-bold tracking-tight text-foreground mt-2">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorStyles[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold flex items-center gap-1 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
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
