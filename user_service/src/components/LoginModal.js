import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginModal.css';

const LoginModal = ({ isOpen, onClose, initialEmail = '', onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginWithApi } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 비밀번호 보기/숨기기 토글
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginWithApi(formData.email, formData.password);
      console.log('로그인 API 결과:', result);

      if (result.success) {
        console.log('로그인 성공! 사용자 데이터:', result.data);
        alert(`${result.data.nickname}님, 로그인이 완료되었습니다!`);
        
        // 모달 닫기
        onClose();
        
        // 로그인 성공 콜백 호출 (있는 경우)
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // 메인 페이지로 이동 (현재 페이지가 메인이 아닌 경우)
          if (window.location.pathname !== '/') {
            navigate('/');
          }
        }
      } else {
        console.error('로그인 실패:', result.error);
        alert(result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = () => {
    console.log('카카오 로그인');
    // 카카오 로그인 로직
  };

  const handleGoogleLogin = () => {
    console.log('구글 로그인');
    // 구글 로그인 로직
  };

  const handleNaverLogin = () => {
    console.log('네이버 로그인');
    // 네이버 로그인 로직
  };

  const handleRegisterClick = () => {
    onClose();
    navigate('/register');
  };

  // initialEmail이 변경될 때 formData 업데이트
  useEffect(() => {
    if (initialEmail) {
      setFormData(prev => ({
        ...prev,
        email: initialEmail
      }));
    }
  }, [initialEmail]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">로그인</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input 
                type="email" 
                name="email"
                className="form-input" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <div className="password-input-group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  className="form-input" 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  required 
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label="비밀번호 보기/숨기기"
                >
                  <span className="password-toggle-icon">
                    {showPassword ? (
                      // 눈 뜬 상태 (보이기)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    ) : (
                      // 눈 감은 상태 (숨기기)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" />
                <span>로그인 상태 유지</span>
              </label>
              <a href="#" className="forgot-password">비밀번호 찾기</a>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
          
          <div className="divider">
            <span>또는</span>
          </div>
          
          <div className="social-login">
            <button className="btn btn-social btn-kakao" onClick={handleKakaoLogin}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 3.58 0 8C0 10.84 1.64 13.34 4.16 14.9L3.2 18.4C3.04 19.02 3.76 19.52 4.3 19.18L8.54 16.72C9.02 16.78 9.5 16.8 10 16.8C15.52 16.8 20 13.22 20 8C20 3.58 15.52 0 10 0Z" fill="#3C1E1E"/>
              </svg>
              카카오로 로그인
            </button>
            
            <button className="btn btn-social btn-google" onClick={handleGoogleLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글로 로그인
            </button>
            
            <button className="btn btn-social btn-naver" onClick={handleNaverLogin}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="3" fill="#03C75A"/>
                <path d="M13 6.5L11.5 9.25V6.5H9.5V13.5H11L12.5 10.75V13.5H14.5V6.5H13Z" fill="white"/>
                <path d="M6.5 6.5V10.25L8 7.5H6.5Z" fill="white"/>
                <path d="M6.5 10.75V13.5H8.5V9.5L6.5 10.75Z" fill="white"/>
              </svg>
              네이버로 로그인
            </button>
          </div>
          
          <div className="register-link">
            <span>아직 계정이 없으신가요?</span>
            <button type="button" className="link-btn" onClick={handleRegisterClick}>
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;