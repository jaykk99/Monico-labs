import React from "react";

interface MetricCardProps {
  id?: string; // Made optional as some cards might not need a specific ID for customization
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string; // Allow custom styling for layout
  onClick?: () => void; // For potential interactivity
}

export default function MetricCard({
  id,
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  className = "",
  onClick,
}: MetricCardProps) {
  return (
    <div
      id={id}
      className={`bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 hover:border-neutral-700/80 transition-all duration-200 shadow-sm flex flex-col justify-between ${className}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">{title}</p>
          <h4 className="text-2xl font-semibold text-neutral-100 tracking-tight">{value}</h4>
        </div>
        <div className="p-2 bg-neutral-800/60 rounded-lg text-neutral-400 border border-neutral-700/30">
          {icon}
        </div>
      </div>
      
      {(change || subtitle) && (
        <div className="mt-4 pt-3 border-t border-neutral-800/50 flex items-center justify-between">
          {change ? (
            <span
              className={`text-xs font-mono font-medium flex items-center gap-1 ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? "↑" : "↓"} {change}
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
