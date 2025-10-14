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

  const handleKakaoLogin = async () => {
    try {
      setIsSubmitting(true);

      // 카카오 OAuth URL 직접 생성
      const kakaoClientId = process.env.REACT_APP_KAKAO_CLIENT_ID || '1305175';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/kakao/callback`);
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${kakaoClientId}&redirect_uri=${redirectUri}&state=login`;

      console.log('카카오 로그인 URL:', kakaoAuthUrl);

      // 카카오 OAuth 페이지로 리디렉션
      window.location.href = kakaoAuthUrl;

    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      alert('카카오 로그인 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);

      // 구글 OAuth URL 직접 생성
      const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '659317981186-pshhp9ho77oknpr9lv4ppr3ucshmff4g.apps.googleusercontent.com';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
      const scope = encodeURIComponent('openid email profile');
      const googleAuthUrl = `https://accounts.google.com/oauth/authorize?response_type=code&client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&state=login`;

      console.log('구글 로그인 URL:', googleAuthUrl);

      // 구글 OAuth 페이지로 리디렉션
      window.location.href = googleAuthUrl;

    } catch (error) {
      console.error('구글 로그인 오류:', error);
      alert('구글 로그인 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  const handleNaverLogin = async () => {
    try {
      setIsSubmitting(true);

      // 네이버 OAuth URL 직접 생성
      const naverClientId = process.env.REACT_APP_NAVER_CLIENT_ID || 'iSuHncyfn142oOIe99NO';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/naver/callback`);
      const state = Math.random().toString(36).substring(2, 15) + '_login'; // 로그인 구분을 위해 _login 추가
      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${redirectUri}&state=${state}`;

      console.log('네이버 로그인 URL:', naverAuthUrl);

      // 네이버 OAuth 페이지로 리디렉션
      window.location.href = naverAuthUrl;

    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      alert('네이버 로그인 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
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
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      // 눈 감은 상태 (숨기기)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
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
          
                    {/* <div className="divider">
                      <span>또는</span>
                    </div>
          
                    <div className="social-login">
                      <button
                        className="btn btn-social btn-naver"
                        onClick={handleNaverLogin}
                        disabled={isSubmitting}
                      >
                        <img src="/images/naver.svg" alt="Naver logo" className="social-logo" />
                        {isSubmitting ? '연결 중...' : '네이버로 로그인'}
                      </button>
                      <button
                        className="btn btn-social btn-kakao"
                        onClick={handleKakaoLogin}
                        disabled={isSubmitting}
                      >
                        <img src="/images/kakao.svg" alt="Kakao logo" className="social-logo" />
                        {isSubmitting ? '연결 중...' : '카카오로 로그인'}
                      </button>
          
                      <button
                        className="btn btn-social btn-google"
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                      >
                        <img src="/images/google.svg" alt="Google logo" className="social-logo" />
                        {isSubmitting ? '연결 중...' : '구글로 로그인'}
                      </button>
                    </div> */}
                    
                    <div className="register-link">            <span>아직 계정이 없으신가요?</span>
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