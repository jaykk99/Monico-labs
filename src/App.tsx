import { useEffect, useState } from 'react';
import AnalyticsCharts from './components/AnalyticsCharts';
import ShieldAnalytics from './components/ShieldAnalytics';
import { AnalyticsMetric, CoreWebVitals, ThreatIncident, WafRule } from './types';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { DashboardCardConfig } from './types';
import { Zap, Activity, ShieldAlert, Cpu, AlertCircle, BarChart3, Cloud, HardDrive, Network, GitBranch, Database, Key, Users, Plug } from 'lucide-react';

// Mock Data Generators (replace with real API calls)
const generateMockMetric = (timestamp: string): AnalyticsMetric => ({
  timestamp,
  requests: Math.floor(Math.random() * 1000) + 200, // 200-1200 requests/min
  bandwidth: parseFloat((Math.random() * 500).toFixed(2)) + 100, // 100-600 MB
  errors: Math.floor(Math.random() * 10), // 0-9 errors
  latency: parseFloat((Math.random() * 100).toFixed(2)) + 20, // 20-120 ms
});

const generateMockWebVitals = (): CoreWebVitals => ({
  lcp: {
    value: parseFloat((Math.random() * 2 + 1).toFixed(2)),
    rating: Math.random() > 0.8 ? 'poor' : Math.random() > 0.3 ? 'needs-improvement' : 'good',
  },
  fid: {
    value: Math.floor(Math.random() * 100) + 10,
    rating: Math.random() > 0.7 ? 'poor' : Math.random() > 0.4 ? 'needs-improvement' : 'good',
  },
  cls: {
    value: parseFloat((Math.random() * 0.1 + 0.05).toFixed(2)),
    rating: Math.random() > 0.6 ? 'poor' : Math.random() > 0.2 ? 'needs-improvement' : 'good',
  },
});

const generateMockThreatIncident = (timestamp: string): ThreatIncident => {
  const ips = ['192.168.1.1', '203.0.113.45', '172.16.0.10', '10.0.0.5'];
  const countries = ['USA', 'Germany', 'China', 'Russia', 'Brazil'];
  const threatTypes = ['SQL Injection', 'XSS', 'DDoS', 'Malware'];
  const actions = ['blocked', 'challenged', 'allowed'];

  return {
    id: `incident-${Date.now()}-${Math.random()}`,
    timestamp,
    ip: ips[Math.floor(Math.random() * ips.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    flag: '🇺🇸', // Simplified, could map to country
    threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    query: '/api/v1/data?param=' + Math.random().toString(36).substring(7),
  };
};

function App() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [vitals, setVitals] = useState<CoreWebVitals>(generateMockWebVitals());
  const [threatIncidents, setThreatIncidents] = useState<ThreatIncident[]>([]);

  const initialWafRules: WafRule[] = [
    { id: '1', field: 'ip', operator: 'eq', value: '1.2.3.4', action: 'block', isEnabled: true },
    { id: '2', field: 'country', operator: 'eq', value: 'CN', action: 'challenge', isEnabled: true },
  ];

  const [wafRules, setWafRules] = useState<WafRule[]>(initialWafRules);
  const [totalThreatsBlocked, setTotalThreatsBlocked] = useState<number>(1240);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
      setMetrics((prevMetrics) => {
        const newMetrics = [...prevMetrics, generateMockMetric(timestamp)];
        return newMetrics.slice(-60); // Keep last 60 minutes of data
      });
      setVitals(generateMockWebVitals());

      if (Math.random() > 0.7) { // Simulate a new threat incident occasionally
        setThreatIncidents((prev) => {
          const newIncident = generateMockThreatIncident(timestamp);
          if (newIncident.action === 'blocked') {
            setTotalThreatsBlocked((prev) => prev + 1);
          }
          return [newIncident, ...prev].slice(0, 50); // Keep last 50 incidents
        });
      }
    }, 2000); // Update every 2 seconds for a more "live" feel

    return () => clearInterval(interval);
  }, []);

  // Define a default dashboard configuration
  const defaultDashboardConfig: DashboardCardConfig[] = [
    {
      type: 'LiveTelemetryHeader',
      props: {},
      layout: { className: 'col-span-full' }, // Occupy full width
    },
    {
      type: 'CoreWebVitalsCard',
      props: {},
      layout: { className: 'lg:col-span-1' },
    },
    {
      type: 'AnalyticsChartCard',
      props: {
        title: "Requests Per Minute",
        maxKey: "requests",
        valueKey: "requests",
        unit: "/m",
        gradientId: "reqGrad",
        lineColor: "#6366f1",
        hoverColor: "#818cf8",
        icon: <Zap className="h-4 w-4 text-purple-400" />,
        description: "Measures incoming request volume",
        chartHeight: 140,
        showHoverDetails: true,
      },
      layout: { className: 'lg:col-span-2' },
    },
    {
      type: 'SparklineCard',
      props: {
        title: "Outgoing Bandwidth",
        maxKey: "bandwidth",
        valueKey: "bandwidth",
        unit: "GB",
        lineColor: "#10b981",
      },
      layout: { className: 'lg:col-span-1' }, // Placed under the main chart, taking 1/3
    },
    {
      type: 'SparklineCard',
      props: {
        title: "Average Response Latency",
        maxKey: "latency",
        valueKey: "latency",
        unit: "ms",
        lineColor: "#f59e0b",
      },
      layout: { className: 'lg:col-span-1' }, // Next to bandwidth, taking 1/3
    },
    // Example of a generic MetricCard
    {
      type: 'MetricCard',
      props: {
        title: 'Total Errors',
        value: metrics.length > 0 ? metrics[metrics.length - 1].errors