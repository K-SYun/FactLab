import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = '로딩 중...', 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'admin-w-4 admin-h-4',
    medium: 'admin-w-6 admin-h-6', 
    large: 'admin-w-8 admin-h-8'
  };

  return (
    <div className="admin-flex-center" style={{ padding: '40px' }}>
      <div className="admin-text-center">
        <div 
          className={`admin-animate-spin admin-rounded-full admin-border-2 admin-border-gray-300 admin-border-t-blue-600 ${sizeClasses[size]} admin-mx-auto admin-mb-4`}
        ></div>
        <p className="admin-text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;