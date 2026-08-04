import React, { useState } from 'react';
import MetricCard from './MetricCard';

interface MetricCardContainerProps {
  metrics: {
    id: string;
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    icon: React.ReactNode;
    subtitle?: string;
  }[];
  onAddMetric: () => void;
  onRemoveMetric: (id: string) => void;
  onEditMetric: (id: string) => void;
}

export default function MetricCardContainer({ metrics, onAddMetric, onRemoveMetric, onEditMetric }: MetricCardContainerProps) {
  const [dragging, setDragging] = useState(false);
  const [ metricOrder, setMetricOrder ] = useState(metrics.map((metric, index) => ({ id: metric.id, order: index }));

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    setDragging(true);
    event.dataTransfer.setData('id', id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    const draggedId = event.dataTransfer.getData('id');
    if (draggedId !== id) {
      const newOrder = metricOrder.slice();
      const draggedIndex = newOrder.findIndex((metric) => metric.id === draggedId);
      const targetIndex = newOrder.findIndex((metric) => metric.id === id);
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, { id: draggedId, order: targetIndex });
      setMetricOrder(newOrder);
    }
    setDragging(false);
  };

  return (
    <div className="flex flex-col">
      {metrics
        .sort((a, b) => metricOrder.find((metric) => metric.id === a.id).order - metricOrder.find((metric) => metric.id === b.id).order)
        .map((metric) => (
          <MetricCard
            key={metric.id}
            id={metric.id}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            isPositive={metric.isPositive}
            icon={metric.icon}
            subtitle={metric.subtitle}
            onDelete={() => onRemoveMetric(metric.id)}
            onEdit={() => onEditMetric(metric.id)}
            draggable
            onDragStart={(event) => handleDragStart(event, metric.id)}
            onDragOver={(event) => handleDragOver(event)}
            onDrop={(event) => handleDrop(event, metric.id)}
          />
        ))}
      <button className="text-neutral-500 hover:text-neutral-300" onClick={onAddMetric}>Add Metric</button>
    </div>
  );
}
