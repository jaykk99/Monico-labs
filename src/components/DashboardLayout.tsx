import React from 'react';
import { DashboardCardConfig } from '../types';
import { AnalyticsChartCard, CoreWebVitalsCard, SparklineCard, LiveTelemetryHeader } from './AnalyticsCharts';
import MetricCard from './MetricCard'; // Generic metric card if needed

interface DashboardLayoutProps {
  cards: DashboardCardConfig[];
  metrics: any; // AnalyticsMetric[]
  vitals: any; // CoreWebVitals
}

const renderCard = (card: DashboardCardConfig, metrics: any, vitals: any) => {
  switch (card.type) {
    case 'CoreWebVitalsCard':
      return <CoreWebVitalsCard vitals={vitals} />;
    case 'AnalyticsChartCard':
      return (
        <AnalyticsChartCard
          metrics={metrics}
          title={card.props.title}
          maxKey={card.props.maxKey}
          valueKey={card.props.valueKey}
          unit={card.props.unit}
          gradientId={card.props.gradientId}
          lineColor={card.props.lineColor}
          hoverColor={card.props.hoverColor}
          icon={card.props.icon}
          description={card.props.description}
          chartHeight={card.props.chartHeight}
          showHoverDetails={card.props.showHoverDetails}
          activeMetric={metrics[metrics.length - 1]} // Assuming latest for activeMetric display in header for now
        />
      );
    case 'SparklineCard':
      return (
        <SparklineCard
          metrics={metrics}
          title={card.props.title}
          maxKey={card.props.maxKey}
          valueKey={card.props.valueKey}
          unit={card.props.unit}
          lineColor={card.props.lineColor}
        />
      );
    case 'MetricCard':
      return <MetricCard {...card.props} />;
    case 'LiveTelemetryHeader':
      return <LiveTelemetryHeader metrics={metrics} />;
    // Add more cases for other card types
    default:
      return null;
  }
};

export default function DashboardLayout({ cards, metrics, vitals }: DashboardLayoutProps) {
  if (metrics.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 py-16">
        <span>Waiting for telemetry signals from the Active Edge router...</span>
      </div>
    );
  }

  // A very basic grid layout for now. Advanced layout customization would involve a drag-and-drop library.
  return (
    <div className="space-y-6">
      {cards.map((card, index) => (
        <div key={index} className={card.layout?.className || ''}> {/* Apply layout class if provided */}
          {renderCard(card, metrics, vitals)}
        </div>
      ))}
    </div>
  );
}