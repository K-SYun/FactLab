import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../styles/AdminLogin.css';

interface LoginForm {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 저장된 계정 정보 불러오기
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setFormData(prev => ({
        ...prev,
        username: savedUsername
      }));
      setRememberMe(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axiosInstance.post('/admin/auth/login', formData);
      
      const data = response.data;
      if (data.success) {
        // JWT 토큰과 사용자 정보 저장
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.data.user));
        
        // Remember Me 기능 처리
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', formData.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        
        navigate('/dashboard');
      } else {
        setErrorMessage(data.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      if (error.response) {
        // 서버에서 응답은 받았지만 4xx, 5xx 에러
        const errorData = error.response.data;
        setErrorMessage(errorData.message || '로그인에 실패했습니다.');
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못함
        setErrorMessage('서버 연결에 실패했습니다.');
      } else {
        // 요청 설정 중 에러 발생
        setErrorMessage('요청 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>FactLab 관리자</h1>
            <p>관리자 로그인</p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label htmlFor="username">관리자 ID</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="관리자 ID를 입력하세요"
                autoComplete="username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="admin-form-group admin-remember-me">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="admin-checkbox-text">계정 기억하기 (24시간)</span>
              </label>
            </div>

            {errorMessage && (
              <div className="admin-error-message">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>FactLab 관리자 전용 시스템입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;