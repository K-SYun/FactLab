import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import News from './pages/News';
import UserManagement from './pages/UserManagement';
import CommunityMonitoring from './pages/CommunityMonitoring';
import AIManagement from './pages/AIManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import AdManagement from './pages/AdManagement';
import BoardManagement from './pages/BoardManagement';
import NoticeManagement from './pages/NoticeManagement';
import PopupManagement from './pages/PopupManagement';
import { verifyToken } from './api/auth';
import './styles/AdminCommon.css';

// 인증 제거 - 모든 라우트 허용
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

function App() {
  // 환경에 따라 basename 설정
  // 포트 80(nginx)을 통한 접근이면 /admin, 포트 3001(직접)이면 빈 문자열
  const basename = window.location.port === '80' || window.location.port === '' ? '/admin' : '';
  
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/news" element={<News />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/community" element={<CommunityMonitoring />} />
              <Route path="/ai" element={<AIManagement />} />
              <Route path="/admin-users" element={<AdminUserManagement />} />
              <Route path="/ads" element={<AdManagement />} />
              <Route path="/boards" element={<BoardManagement />} />
              <Route path="/notices" element={<NoticeManagement />} />
              <Route path="/popups" element={<PopupManagement />} />
            </Routes>
          </AdminLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
