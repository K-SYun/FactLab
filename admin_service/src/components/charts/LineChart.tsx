import React from 'react';
import '../../styles/Charts.css';

interface LineChartProps {
  data: any;
  height?: number;
  title?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, height = 300, title }) => {
  // 차트 데이터에서 값 추출
  const datasets = data?.datasets?.[0];
  const labels = data?.labels || [];
  const values = datasets?.data || [];
  const borderColor = datasets?.borderColor || '#3b82f6';

  if (!values.length) return null;

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  return (
    <div className="admin-chart-container" style={{ height }}>
      {title && (
        <h4 className="admin-chart-title">
          {title}
        </h4>
      )}
      
      <div className="admin-line-chart-container">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 400 200"
          className="admin-line-chart-svg"
        >
          {/* 배경 그리드 */}
          {[0, 1, 2, 3, 4].map(i => (
            <line 
              key={`grid-${i}`}
              x1="40" 
              y1={40 + (i * 32)} 
              x2="360" 
              y2={40 + (i * 32)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          
          {/* 데이터 라인 */}
          <polyline
            fill="none"
            stroke={borderColor}
            strokeWidth="3"
            points={values.map((value: number, index: number) => {
              const x = 40 + (index * (320 / (values.length - 1)));
              const y = 40 + (1 - (value - minValue) / (maxValue - minValue || 1)) * 128;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* 데이터 포인트 */}
          {values.map((value: number, index: number) => {
            const x = 40 + (index * (320 / (values.length - 1)));
            const y = 40 + (1 - (value - minValue) / (maxValue - minValue || 1)) * 128;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={borderColor}
              />
            );
          })}
          
          {/* X축 라벨 */}
          {labels.map((label: string, index: number) => {
            const x = 40 + (index * (320 / (labels.length - 1)));
            return (
              <text
                key={index}
                x={x}
                y="190"
                textAnchor="middle"
                fontSize="12"
                fill="#64748b"
              >
                {label.length > 8 ? label.substring(0, 8) + '...' : label}
              </text>
            );
          })}
        </svg>
        
        <div className="admin-chart-legend">
          <div className="admin-legend-item">
            <div 
              className="admin-legend-color"
              style={{ backgroundColor: borderColor }}
            />
            <span>{datasets?.label || '데이터'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChart;