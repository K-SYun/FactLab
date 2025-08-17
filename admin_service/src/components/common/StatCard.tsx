import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon, 
  color 
}) => {
  const getChangeIcon = () => {
    return changeType === 'increase' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  };

  return (
    <div className={`admin-stat-card ${color} admin-fade-in`}>
      <div className="admin-flex-between">
        <div>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>{title}</p>
          <p className="admin-text-2xl admin-font-bold" style={{ marginTop: '4px' }}>{value}</p>
          {change && (
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginTop: '4px' }}>
              <i className={`${getChangeIcon()} mr-1`}></i>
              {change}
            </p>
          )}
        </div>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.2)', 
          padding: '12px', 
          borderRadius: '50%' 
        }}>
          <i className={`${icon} admin-text-2xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default StatCard;