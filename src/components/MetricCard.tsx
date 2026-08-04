import React from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function MetricCard({
  id,
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  onDelete,
  onEdit,
}: MetricCardProps) {
  return (
    <div
      id={id}
      className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 hover:border-neutral-700/80 transition-all duration-200 shadow-sm flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">{title}</p>
          <h4 className="text-2xl font-semibold text-neutral-100 tracking-tight">{value}</h4>
        </div>
        <div className="p-2 bg-neutral-800/60 rounded-lg text-neutral-400 border border-neutral-700/30">
          {icon}
        </div>
        {onDelete && (
          <button
            className="text-neutral-500 hover:text-neutral-300"
            onClick={onDelete}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>
        )}
        {onEdit && (
          <button
            className="text-neutral-500 hover:text-neutral-300"
            onClick={onEdit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C8.1 2 5 5.1 5 9s3.1 7 7 7 7-3.1 7-7S16.9 2 12 2z"/>
              <path d="M12 12h.01M12 12v.01"/>
            </svg>
          </button>
        )}
      </div>
      {(change || subtitle) && (
        <div className="mt-4 pt-3 border-t border-neutral-800/50 flex items-center justify-between">
          {change ? (
            <span
              className={`text-xs font-mono font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {isPositive ? '↑' : '↓'} {change}
            </span>
          ) : (
            <span className="text-xs text-neutral-500">{subtitle}</span>
          )}
          {subtitle && change && (
            <span className="text-[10px] text-neutral-500 font-medium">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
