import React, { useState } from "react";
import { Zap, Activity, ShieldAlert, Cpu, AlertCircle, BarChart3 } from "lucide-react";
import { AnalyticsMetric, CoreWebVitals } from "../types";

interface AnalyticsChartsProps {
  metrics: AnalyticsMetric[];
  vitals: CoreWebVitals;
  isSpikeActive: boolean;
  onToggleSpike: () => void;
  isLoading: boolean;
}

export default function AnalyticsCharts({
  metrics,
  vitals,
  isSpikeActive,
  onToggleSpike,
  isLoading,
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

  // Find max values to dynamically scale the custom SVG graph paths
  const maxRequests = Math.max(...metrics.map((m) => m.requests), 1);
  const maxBandwidth = Math.max(...metrics.map((m) => m.bandwidth), 1);
  const maxLatency = Math.max(...metrics.map((m) => m.latency), 1);

  // SVG dimensions
  const width = 580;
  const height = 140;

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

  const reqPoints = getPoints(metrics.map((m) => m.requests), maxRequests);
  const bandPoints = getPoints(metrics.map((m) => m.bandwidth), maxBandwidth);
  const latPoints = getPoints(metrics.map((m) => m.latency), maxLatency);

  // Convert points to SVG SVGPath strings
  const getPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  };

  const getAreaPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    const linePath = getPathString(points);
    return `${linePath} L ${points[points.length - 1].x} ${height - 5} L ${points[0].x} ${height - 5} Z`;
  };

  const activeMetric = hoverIndex !== null ? metrics[hoverIndex] : metrics[metrics.length - 1];

  const getRatingBadge = (rating: "good" | "needs-improvement" | "poor") => {
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
    <div className="space-y-6">
      {/* Simulation Controls banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm hover:border-neutral-750/90 transition-all">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            Vortex Edge Traffic Simulator
          </h3>
          <p className="text-xs text-neutral-500 max-w-lg">
            Toggle a stress simulation containing real-time request bursts, latency spikes, and page processing errors to inspect active edge scalability.
          </p>
        </div>

        <button
          onClick={onToggleSpike}
          className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all shadow-md flex items-center gap-1.5 ${
            isSpikeActive
              ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
              : "bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          {isSpikeActive ? "SURGE ACTIVE: ON" : "SIMULATE SURGE: OFF"}
        </button>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Web Vitals Panel */}
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

          {isSpikeActive && (
            <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg text-[11px] text-rose-400 flex items-start gap-2 animate-pulse">
              <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>Surged payloads discovered page compilation lag, pushing LCP and FID metrics to caution limits.</span>
            </div>
          )}
        </div>

        {/* Live Traffic Interactive Charts Display */}
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

          {/* SVG Interactive Graphs */}
          <div className="space-y-6 py-2">
            {/* 1. Requests Area Graph */}
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                <span>REQUESTS PER MINUTE</span>
                <span>Peak: {maxRequests}/m</span>
              </div>
              <div className="h-[140px] bg-neutral-950/40 rounded-lg border border-neutral-800/40 relative">
                <svg className="w-full h-full overflow-visible">
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="20" y1={height/2} x2={width-20} y2={height/2} stroke="#333" strokeDasharray="3 3" />

                  {/* Shaded Area */}
                  <path d={getAreaPathString(reqPoints)} fill="url(#reqGrad)" />
                  {/* Top Line */}
                  <path d={getPathString(reqPoints)} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />

                  {/* Interactive vertical hover interception line */}
                  {hoverIndex !== null && (
                    <line
                      x1={reqPoints[hoverIndex].x}
                      y1="5"
                      x2={reqPoints[hoverIndex].x}
                      y2={height-5}
                      stroke="#818cf8"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Hotspots */}
                  {reqPoints.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverIndex === idx ? "5" : "3.5"}
                      fill={hoverIndex === idx ? "#6366f1" : "#171717"}
                      stroke="#818cf8"
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(null)}
                      className="cursor-pointer transition-all duration-150"
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* 2. Bandwidth & Latency Small Sparklines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bandwidth SPARK */}
              <div className="p-4 bg-neutral-950/40 border border-neutral-800/45 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                  <span>OUTGOING BANDWIDTH</span>
                  <span>Max: {maxBandwidth} GB</span>
                </div>
                <div className="h-[75px] w-full bg-neutral-950/50 rounded-lg relative overflow-hidden">
                  <svg className="w-full h-full overflow-hidden" viewBox="0 0 280 75" preserveAspectRatio="none">
                    <path
                      d={getAreaPathString(getPoints(metrics.map((m) => m.bandwidth), maxBandwidth).map(p => ({ x: p.x/2, y: p.y/2 })))}
                      fill="#10b981"
                      fillOpacity="0.08"
                    />
                    <path
                      d={getPathString(getPoints(metrics.map((m) => m.bandwidth), maxBandwidth).map(p => ({ x: p.x/2, y: p.y/2 })))}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Latency SPARK */}
              <div className="p-4 bg-neutral-950/40 border border-neutral-800/45 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                  <span>AVERAGE RESPONSE LATENCY</span>
                  <span>Peak: {maxLatency}ms</span>
                </div>
                <div className="h-[75px] w-full bg-neutral-950/50 rounded-lg relative overflow-hidden">
                  <svg className="w-full h-full overflow-hidden" viewBox="0 0 280 75" preserveAspectRatio="none">
                    <path
                      d={getAreaPathString(getPoints(metrics.map((m) => m.latency), maxLatency).map(p => ({ x: p.x/2, y: p.y/2 })))}
                      fill="#f59e0b"
                      fillOpacity="0.08"
                    />
                    <path
                      d={getPathString(getPoints(metrics.map((m) => m.latency), maxLatency).map(p => ({ x: p.x/2, y: p.y/2 })))}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
