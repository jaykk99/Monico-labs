import React, { useState } from "react";
import { Zap, Activity, ShieldAlert, Cpu, AlertCircle, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { AnalyticsMetric, CoreWebVitals } from "../types";
import MetricCard from "./MetricCard"; // Assuming MetricCard is a general component

// These are now individual "card" components that can be composed into a dashboard
interface CoreWebVitalsCardProps {
  vitals: CoreWebVitals;
}

export function CoreWebVitalsCard({ vitals }: CoreWebVitalsCardProps) {
  const getRatingBadge = (rating: "good" | "needs-improvement" | "poor" | "measuring") => {
    if (rating === "measuring") {
      return (
        <span className="bg-neutral-700/20 text-neutral-400 border border-neutral-600/30 px-2 py-0.5 rounded text-[10px] font-semibold uppercase animate-pulse">
          Measuring
        </span>
      );
    }
    if (rating === "good") {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
          Good
        </span>
      );
    }
    if (rating === "needs-improvement") {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
          Warning
        </span>
      );
    }
    return (
      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase animate-pulse">
        Poor
      </span>
    );
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-6 lg:col-span-1 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" />
          Core Web Vitals Telemetry
        </h4>
        <span className="text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700/50 px-2 py-0.5 rounded font-mono uppercase">
          Edge Live
        </span>
      </div>

      <div className="space-y-4">
        {/* LCP metric */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/60 hover:border-neutral-800 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-200 tracking-wide">Largest Contentful Paint (LCP)</span>
            <p className="text-[10px] text-neutral-500">Measures visual loader performance</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-bold font-mono text-neutral-100">{vitals.lcp.value}s</div>
            {getRatingBadge(vitals.lcp.rating)}
          </div>
        </div>

        {/* FID metric */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/60 hover:border-neutral-800 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-200 tracking-wide">First Input Delay (FID)</span>
            <p className="text-[10px] text-neutral-500">Measures responsive hover latencies</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-bold font-mono text-neutral-100">{vitals.fid.value}ms</div>
            {getRatingBadge(vitals.fid.rating)}
          </div>
        </div>

        {/* CLS metric */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/60 hover:border-neutral-800 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-200 tracking-wide">Cumulative Layout Shift (CLS)</span>
            <p className="text-[10px] text-neutral-500">Measures UI layout visual stability</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-bold font-mono text-neutral-100">{vitals.cls.value}</div>
            {getRatingBadge(vitals.cls.rating)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsChartCardProps {
  metrics: AnalyticsMetric[];
  title: string;
  maxKey: 'requests' | 'bandwidth' | 'latency';
  valueKey: 'requests' | 'bandwidth' | 'latency';
  unit: string;
  gradientId: string;
  lineColor: string;
  hoverColor: string;
  icon: React.ReactNode;
  description: string;
  chartHeight: number;
  showHoverDetails: boolean;
  activeMetric: AnalyticsMetric;
}

export function AnalyticsChartCard({
  metrics,
  title,
  maxKey,
  valueKey,
  unit,
  gradientId,
  lineColor,
  hoverColor,
  icon,
  description,
  chartHeight,
  showHoverDetails,
  activeMetric,
}: AnalyticsChartCardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Find max values to dynamically scale the custom SVG graph paths
  const maxValue = Math.max(...metrics.map((m) => m[maxKey]), 1);

  // SVG dimensions
  const width = 580;
  const height = chartHeight; // Use dynamic height

  // Function to map coordinates for SVG polyline/path points
  const getPoints = (values: number[], max: number) => {
    if (values.length <= 1) {
      return values.map((val) => ({ x: width / 2, y: height - (val / max) * (height - 30) - 15 }));
    }
    return values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * (width - 40) + 20;
        const y = height - (val / max) * (height - 30) - 15;
        return { x, y };
      });
  };

  // Convert points to SVG SVGPath strings
  const getPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "M 0 0";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  };

  const getAreaPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "M 0 0";
    const linePath = getPathString(points);
    return `${linePath} L ${points[points.length - 1].x} ${height - 5} L ${points[0].x} ${height - 5} Z`;
  };

  const points = getPoints(metrics.map((m) => m[valueKey]), maxValue);

  return (
    <div className="space-y-2 relative">
      <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
        <span>{title.toUpperCase()}</span>
        <span>Peak: {maxValue}{unit}</span>
      </div>
      <div className="h-[140px] bg-neutral-950/40 rounded-lg border border-neutral-800/40 relative">
        <svg className="w-full h-full overflow-visible">
          {/* Gradients */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line x1="20" y1={height/2} x2={width-20} y2={height/2} stroke="#333" strokeDasharray="3 3" />

          {/* Shaded Area */}
          <path d={getAreaPathString(points)} fill={`url(#${gradientId})`} />
          {/* Top Line */}
          <path d={getPathString(points)} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" />

          {/* Interactive vertical hover interception line */}
          {showHoverDetails && hoverIndex !== null && (
            <line
              x1={points[hoverIndex].x}
              y1="5"
              x2={points[hoverIndex].x}
              y2={height-5}
              stroke={hoverColor}
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* Hotspots */}
          {showHoverDetails && points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === idx ? "5" : "3.5"}
              fill={hoverIndex === idx ? lineColor : "#171717"}
              stroke={hoverColor}
              strokeWidth="1.5"
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer transition-all duration-150"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}


interface SparklineCardProps {
  metrics: AnalyticsMetric[];
  title: string;
  maxKey: 'requests' | 'bandwidth' | 'latency';
  valueKey: 'requests' | 'bandwidth' | 'latency';
  unit: string;
  lineColor: string;
}

export function SparklineCard({ metrics, title, maxKey, valueKey, unit, lineColor }: SparklineCardProps) {
  const maxValue = Math.max(...metrics.map((m) => m[maxKey]), 1);

  // SVG dimensions for sparklines (smaller)
  const width = 280;
  const height = 75;

  const getPoints = (values: number[], max: number) => {
    if (values.length <= 1) {
      return values.map((val) => ({ x: width / 2, y: height - (val / max) * (height - 15) - 7.5 }));
    }
    return values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * (width - 10) + 5;
        const y = height - (val / max) * (height - 15) - 7.5;
        return { x, y };
      });
  };

  const getPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "M 0 0";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  };

  const getAreaPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "M 0 0";
    const linePath = getPathString(points);
    return `${linePath} L ${points[points.length - 1].x} ${height - 2} L ${points[0].x} ${height - 2} Z`;
  };

  const points = getPoints(metrics.map((m) => m[valueKey]), maxValue);

  return (
    <div className="p-4 bg-neutral-950/40 border border-neutral-800/45 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
        <span>{title.toUpperCase()}</span>
        <span>Max: {maxValue}{unit}</span>
      </div>
      <div className="h-[75px] w-full bg-neutral-950/50 rounded-lg relative overflow-hidden">
        <svg className="w-full h-full overflow-hidden" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <path
            d={getAreaPathString(points)}
            fill={lineColor}
            fillOpacity="0.08"
          />
          <path
            d={getPathString(points)}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}


interface LiveTelemetryHeaderProps {
  metrics: AnalyticsMetric[]; // Only needed to get the latest active metric
}

export function LiveTelemetryHeader({ metrics }: LiveTelemetryHeaderProps) {
  const activeMetric = metrics[metrics.length - 1]; // Always show the latest for the header

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-400" />
          Live Edge Telemetry
        </h3>
        <p className="text-xs text-neutral-500 max-w-lg">
          Requests, bandwidth, errors and latency are aggregated from the server's real request log; Core Web Vitals are measured live in your browser.
        </p>
      </div>
      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-mono uppercase flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" /> Live
      </span>
    </div>
  );
}


// The original AnalyticsCharts component now serves as an example of a predefined dashboard
// It composes the new, smaller card components.
interface AnalyticsChartsProps {
  metrics: AnalyticsMetric[];
  vitals: CoreWebVitals;
  isSpikeActive?: boolean; // No longer directly used here, but kept for compatibility if needed elsewhere
  onToggleSpike?: () => void; // No longer directly used here
  isLoading?: boolean; // No longer directly used here
}

export default function AnalyticsCharts({
  metrics,
  vitals,
}: AnalyticsChartsProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (metrics.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 py-16">
        <Activity className="h-8 w-8 text-neutral-700 mx-auto mb-3 animate-pulse" />
        <span>Waiting for telemetry signals from the Active Edge router...</span>
      </div>
    );
  }

  const activeMetric = hoverIndex !== null ? metrics[hoverIndex] : metrics[metrics.length - 1];

  return (
    <div className="space-y-6">
      <LiveTelemetryHeader metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CoreWebVitalsCard vitals={vitals} />

        <div className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-800/50 pb-3 flex-wrap gap-2">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" />
                Edge CDN Performance Metrics
              </h4>
              <p className="text-[10px] text-neutral-500">Hover graph endpoints to scan specific chronological records.</p>
            </div>

            {/* Selected Intercept Details */}
            <div className="flex gap-4 text-xs font-mono text-neutral-400">
              <div>Time: <span className="text-neutral-200">{activeMetric.timestamp}</span></div>
              <div>Requests: <span className="text-purple-400 font-bold">{activeMetric.requests}/m</span></div>
              <div>Bandwidth: <span className="text-indigo-400 font-bold">{activeMetric.bandwidth}MB</span></div>
              <div>Latency: <span className="text-amber-400 font-bold">{activeMetric.latency}ms</span></div>
            </div>
          </div>

          <div className="space-y-6 py-2">
            <AnalyticsChartCard
              metrics={metrics}
              title="Requests Per Minute"
              maxKey="requests"
              valueKey="requests"
              unit="/m"
              gradientId="reqGrad"
              lineColor="#6366f1"
              hoverColor="#818cf8"
              icon={<Zap className="h-4 w-4 text-purple-400" />}
              description="Measures incoming request volume"
              chartHeight={140}
              showHoverDetails={true}
              activeMetric={activeMetric} // This prop is just for the hover details, not used by the chart directly
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SparklineCard
                metrics={metrics}
                title="Outgoing Bandwidth"
                maxKey="bandwidth"
                valueKey="bandwidth"
                unit="GB"
                lineColor="#10b981"
              />
              <SparklineCard
                metrics={metrics}
                title="Average Response Latency"
                maxKey="latency"
                valueKey="latency"
                unit="ms"
                lineColor="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}