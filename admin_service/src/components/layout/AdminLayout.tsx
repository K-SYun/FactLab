import React, { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;