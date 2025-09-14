import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import News from './pages/News';
import UserManagement from './pages/UserManagement';
import AIManagement from './pages/AIManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import AdManagement from './pages/AdManagement';
import BoardManagement from './pages/BoardManagement';
import BillManagement from './pages/BillManagement';
import NoticeManagement from './pages/NoticeManagement';
import NoticeDetail from './pages/NoticeDetail';
import PopupManagement from './pages/PopupManagement';
import { verifyToken } from './api/auth';
import './styles/AdminCommon.css';

// 실제 인증 로직이 포함된 ProtectedRoute
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          navigate('/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []); // navigate 의존성 제거

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-loading-spinner">
          <div className="spinner"></div>
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

function App() {
  // 환경에 따라 basename 설정
  // nginx를 통한 접근 (polradar.com 또는 IP:80)이면 /admin, 직접 접근 (포트 3001)이면 빈 문자열
  const isDirectAccess = window.location.port === '3001';
  const basename = isDirectAccess ? '' : '/admin';

  console.log('Current location:', window.location);
  console.log('Using basename:', basename);

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/news" element={<News />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/ai" element={<AIManagement />} />
                <Route path="/admin-users" element={<AdminUserManagement />} />
                <Route path="/bills" element={<BillManagement />} />
                <Route path="/ads" element={<AdManagement />} />
                <Route path="/boards" element={<BoardManagement />} />
                <Route path="/notices" element={<NoticeManagement />} />
                <Route path="/notices/:id" element={<NoticeDetail />} />
                <Route path="/popups" element={<PopupManagement />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
