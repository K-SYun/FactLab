import React from 'react';
import '../../styles/Charts.css';

interface DoughnutChartProps {
  data: any;
  height?: number;
  title?: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, height = 200, title }) => {
  // 차트 데이터에서 값 추출
  const datasets = data?.datasets?.[0];
  const labels = data?.labels || [];
  const values = datasets?.data || [];
  const colors = datasets?.backgroundColor || [];

  const total = values.reduce((sum: number, val: number) => sum + val, 0);

  return (
    <div className="admin-chart-container" style={{ height }}>
      {title && (
        <h4 className="admin-chart-title">
          {title}
        </h4>
      )}
      
      <div className="admin-chart-content">
        <div className="admin-chart-bars">
          {labels.map((label: string, index: number) => {
            const value = values[index] || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            
            return (
              <div key={index} className="admin-chart-bar-item">
                <div className="admin-chart-bar-label">
                  <span>{label}</span>
                  <span>{value} ({percentage}%)</span>
                </div>
                <div className="admin-chart-bar-track">
                  <div 
                    className="admin-chart-bar-fill"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: colors[index] || '#64748b'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="admin-chart-total">
          <div className="admin-chart-total-number">
            {total}
          </div>
          <div className="admin-chart-total-label">
            전체
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoughnutChart;