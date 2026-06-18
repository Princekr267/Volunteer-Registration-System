import React from 'react';

export interface ChartData {
  label: string;
  value: number;
}

interface SvgChartProps {
  data: ChartData[];
  title: string;
  yLabel?: string;
}

const SvgChart: React.FC<SvgChartProps> = ({ data, title, yLabel = 'Hours' }) => {
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 45;
  const paddingY = 20;
  
  const maxValue = Math.max(...data.map(d => d.value), 5);
  const graphHeight = chartHeight - paddingY * 2;
  const graphWidth = chartWidth - paddingX - 20;
  
  return (
    <div className="glass-panel chart-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h4>
      {data.length === 0 ? (
        <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: '#6B7280' }}>
          No data available
        </div>
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto' }}>
            {/* Y Axis Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingY + graphHeight * (1 - ratio);
              const val = Math.round(maxValue * ratio);
              return (
                <g key={index}>
                  <line x1={paddingX} y1={y} x2={chartWidth - 20} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                  <text x={paddingX - 8} y={y + 3} textAnchor="end" className="chart-text" style={{ fontSize: '9px' }}>
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Render Bars */}
            {data.map((item, index) => {
              const spacing = graphWidth / data.length;
              const barWidth = Math.min(26, spacing * 0.6);
              const x = paddingX + index * spacing + (spacing - barWidth) / 2;
              const barHeight = (item.value / maxValue) * graphHeight;
              const y = paddingY + graphHeight - barHeight;

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={3}
                    className="chart-bar"
                  >
                    <title>{`${item.label}: ${item.value} ${yLabel}`}</title>
                  </rect>
                  
                  {/* Labels */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="chart-text"
                    style={{ fontSize: '8px' }}
                  >
                    {item.label.length > 12 ? `${item.label.substring(0, 10)}...` : item.label}
                  </text>
                </g>
              );
            })}
            
            {/* Baseline */}
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - 20}
              y2={chartHeight - paddingY}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SvgChart;
