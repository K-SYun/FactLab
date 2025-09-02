import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';
import '../styles/Common.css';

const FactlabRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    agreeAll: false,
    agreeTerms: false,
    agreePrivacy: false
  });
  
  const [validationState, setValidationState] = useState({
    email: { isValid: null, message: '', isChecking: false },
    nickname: { isValid: null, message: '', isChecking: false },
    password: { isValid: null, message: '' }
  });

  // 이메일 인증 상태
  const [emailVerification, setEmailVerification] = useState({
    step: 'input', // 'input' -> 'sendCode' -> 'code' -> 'verified'
    code: '',
    timer: 0,
    isVerified: false,
    isSending: false
  });

  // 비밀번호 보기/숨기기 상태
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 이메일 유효성 검증
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 비밀번호 강도 검증
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!minLength) return { isValid: false, message: '비밀번호는 8자 이상이어야 합니다.' };
    if (!hasLetter) return { isValid: false, message: '영문자를 포함해야 합니다.' };
    if (!hasNumber) return { isValid: false, message: '숫자를 포함해야 합니다.' };
    if (!hasSpecial) return { isValid: false, message: '특수문자를 포함하는 것이 좋습니다.' };
    
    return { isValid: true, message: '안전한 비밀번호입니다.' };
  };

  // 닉네임 유효성 검증
  const validateNickname = (nickname) => {
    const nicknameRegex = /^[가-힣A-Za-z0-9]{2,10}$/;
    return nicknameRegex.test(nickname);
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // 전체 동의 체크박스 처리
    if (name === 'agreeAll') {
      setFormData(prev => ({
        ...prev,
        agreeAll: checked,
        agreeTerms: checked,
        agreePrivacy: checked
      }));
    } 
    // 개별 약관 체크박스 처리
    else if (name === 'agreeTerms' || name === 'agreePrivacy') {
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: checked
        };
        
        // 개별 약관이 모두 체크되면 전체 동의도 체크
        if (name === 'agreeTerms') {
          newFormData.agreeAll = checked && prev.agreePrivacy;
        } else if (name === 'agreePrivacy') {
          newFormData.agreeAll = checked && prev.agreeTerms;
        }
        
        // 개별 약관이 하나라도 해제되면 전체 동의 해제
        if (!checked) {
          newFormData.agreeAll = false;
        }
        
        return newFormData;
      });
    }
    // 기타 입력 필드 처리
    else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }

    // 실시간 유효성 검사
    if (name === 'password' && value) {
      const passwordValidation = validatePassword(value);
      setValidationState(prev => ({
        ...prev,
        password: passwordValidation
      }));
    }

    if (name === 'email' && value) {
      const isValidFormat = validateEmail(value);
      setValidationState(prev => ({
        ...prev,
        email: { 
          ...prev.email, 
          isValid: isValidFormat ? null : false, // 형식이 맞으면 null, 틀리면 false
          message: isValidFormat ? '' : '올바른 이메일 형식이 아닙니다.'
        }
      }));
      
      // 이메일이 변경되면 인증 상태 초기화
      setEmailVerification(prev => ({
        ...prev,
        step: 'input',
        code: '',
        timer: 0,
        isVerified: false,
        isSending: false
      }));
    }

    if (name === 'nickname' && value) {
      setValidationState(prev => ({
        ...prev,
        nickname: { 
          ...prev.nickname, 
          isValid: validateNickname(value) ? null : false,
          message: validateNickname(value) ? '' : '한글, 영문, 숫자 2-10자까지 가능합니다.'
        }
      }));
    }
  }, []);

  // 이메일 중복 확인
  const checkEmailDuplicate = async () => {
    // 이메일 형식 검증을 여기서 처리
    if (!formData.email) {
      setValidationState(prev => ({
        ...prev,
        email: { isValid: false, message: '이메일을 입력해주세요.', isChecking: false }
      }));
      return;
    }

    if (!validateEmail(formData.email)) {
      setValidationState(prev => ({
        ...prev,
        email: { isValid: false, message: '올바른 이메일 형식이 아닙니다.', isChecking: false }
      }));
      return;
    }

    setValidationState(prev => ({
      ...prev,
      email: { ...prev.email, isChecking: true, message: '' }
    }));

    try {
      const response = await axios.get(`/api/auth/check-email?email=${formData.email}`);
      const isAvailable = response.data.success && response.data.data.available;
      
      setValidationState(prev => ({
        ...prev,
        email: { 
          isValid: isAvailable, 
          message: isAvailable ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.',
          isChecking: false 
        }
      }));
      
      // 이메일이 사용 가능하면 인증 단계로 진행
      if (isAvailable) {
        setEmailVerification(prev => ({
          ...prev,
          step: 'sendCode'
        }));
      }
      
      showToast(isAvailable ? '이메일 인증을 진행해주세요.' : '이미 사용 중인 이메일입니다.', 
               isAvailable ? 'info' : 'error');
    } catch (error) {
      console.error('이메일 중복 확인 실패:', error);
      setValidationState(prev => ({
        ...prev,
        email: { isValid: false, message: '중복 확인 중 오류가 발생했습니다.', isChecking: false }
      }));
      showToast('중복 확인 중 오류가 발생했습니다.', 'error');
    }
  };

  // 이메일 인증 코드 발송
  const sendVerificationCode = async () => {
    if (!validationState.email.isValid) {
      showToast('먼저 이메일 중복확인을 완료해주세요.', 'error');
      return;
    }

    setEmailVerification(prev => ({ ...prev, isSending: true }));

    try {
      // 임시로 직접 localhost:8080으로 요청
      const response = await axios.post('http://localhost:8080/api/auth/send-verification', {
        email: formData.email
      });

      if (response.data.success) {
        setEmailVerification(prev => ({
          ...prev,
          step: 'code',
          timer: 300, // 5분
          isSending: false
        }));
        
        // 5분 타이머 시작
        const interval = setInterval(() => {
          setEmailVerification(prev => {
            if (prev.timer <= 1) {
              clearInterval(interval);
              return { ...prev, timer: 0, step: 'sendCode' };
            }
            return { ...prev, timer: prev.timer - 1 };
          });
        }, 1000);

        showToast('인증 코드가 발송되었습니다.', 'success');
      } else {
        throw new Error(response.data.error || '인증 코드 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 코드 발송 실패:', error);
      setEmailVerification(prev => ({ ...prev, isSending: false }));
      showToast(error.response?.data?.error || '인증 코드 발송에 실패했습니다.', 'error');
    }
  };

  // 이메일 인증 코드 확인
  const verifyEmailCode = async () => {
    if (!emailVerification.code || emailVerification.code.length !== 6) {
      showToast('6자리 인증 코드를 입력해주세요.', 'error');
      return;
    }

    try {
      console.log('이메일 인증 요청 데이터:', {
        email: formData.email,
        code: emailVerification.code
      });
      
      // 테스트용 엔드포인트 사용
      const response = await axios.post('http://localhost:8080/api/auth/test-verify-email', {
        email: formData.email,
        code: emailVerification.code
      });

      console.log('이메일 인증 응답:', response.data);

      if (response.data.success) {
        setEmailVerification(prev => ({
          ...prev,
          step: 'verified',
          isVerified: true
        }));
        showToast('이메일 인증이 완료되었습니다!', 'success');
      } else {
        throw new Error(response.data.error || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('이메일 인증 실패:', error);
      console.error('에러 응답:', error.response?.data);
      showToast(error.response?.data?.error || '인증 코드가 올바르지 않거나 만료되었습니다.', 'error');
    }
  };

  // 인증 코드 입력 처리
  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // 숫자만 6자리까지
    setEmailVerification(prev => ({
      ...prev,
      code: value
    }));
  };

  // 시간 포맷팅 (초를 mm:ss 형태로)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 비밀번호 보기/숨기기 토글
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 닉네임 중복 확인
  const checkNicknameDuplicate = async () => {
    if (!formData.nickname || !validateNickname(formData.nickname)) {
      showToast('올바른 닉네임을 입력해주세요.', 'error');
      return;
    }

    setValidationState(prev => ({
      ...prev,
      nickname: { ...prev.nickname, isChecking: true }
    }));

    try {
      const response = await axios.get(`/api/auth/check-nickname?nickname=${formData.nickname}`);
      const isAvailable = response.data.success && response.data.data.available;
      
      setValidationState(prev => ({
        ...prev,
        nickname: { 
          isValid: isAvailable, 
          message: isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
          isChecking: false 
        }
      }));
      
      showToast(isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.', 
               isAvailable ? 'success' : 'error');
    } catch (error) {
      console.error('닉네임 중복 확인 실패:', error);
      setValidationState(prev => ({
        ...prev,
        nickname: { isValid: false, message: '중복 확인 중 오류가 발생했습니다.', isChecking: false }
      }));
      showToast('중복 확인 중 오류가 발생했습니다.', 'error');
    }
  };

  // 토스트 메시지 표시
  const showToast = (message, type = 'info') => {
    // 간단한 토스트 구현 (추후 Toast 컴포넌트로 교체 가능)
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transition: all 0.3s ease;
      ${type === 'success' ? 'background-color: #28a745;' : ''}
      ${type === 'error' ? 'background-color: #dc3545;' : ''}
      ${type === 'info' ? 'background-color: #007bff;' : ''}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  // 소셜 회원가입 핸들러
  const handleGoogleSignup = async () => {
    try {
      const response = await fetch('/api/auth/google/login-url');
      const result = await response.json();
      
      if (result.success) {
        window.location.href = result.data;
      } else {
        showToast('구글 로그인 URL을 가져올 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      showToast('구글 로그인 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleNaverSignup = async () => {
    try {
      const response = await fetch('/api/auth/naver/login-url');
      const result = await response.json();
      
      if (result.success) {
        window.location.href = result.data;
      } else {
        showToast('네이버 로그인 URL을 가져올 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      showToast('네이버 로그인 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleKakaoSignup = async () => {
    try {
      const response = await fetch('/api/auth/kakao/login-url');
      const result = await response.json();
      
      if (result.success) {
        window.location.href = result.data;
      } else {
        showToast('카카오 로그인 URL을 가져올 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      showToast('카카오 로그인 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 기본 유효성 검사
    if (!formData.email || !formData.password || !formData.nickname) {
      showToast('모든 필수 항목을 입력해주세요.', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    if (!formData.agreeTerms) {
      showToast('이용약관에 동의해주세요.', 'error');
      return;
    }

    if (!formData.agreePrivacy) {
      showToast('개인정보처리방침에 동의해주세요.', 'error');
      return;
    }

    // 이메일 인증 확인 여부 검사
    if (!emailVerification.isVerified) {
      showToast('이메일 인증을 완료해주세요.', 'error');
      return;
    }

    if (validationState.nickname.isValid !== true) {
      showToast('닉네임 중복 확인을 해주세요.', 'error');
      return;
    }

    // 비밀번호 강도 확인
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      showToast(passwordValidation.message, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname
      });

      if (response.data.success) {
        showToast('회원가입이 완료되었습니다! 메인화면으로 이동합니다.', 'success');
        setTimeout(() => {
          navigate('/', { 
            state: { 
              showLoginModal: true,
              message: '회원가입이 완료되었습니다. 로그인해주세요.', 
              email: formData.email 
            } 
          });
        }, 1500);
      } else {
        throw new Error(response.data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || '회원가입 중 오류가 발생했습니다.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo">
            <img src="/Logo.png" alt="PolRadar" className="logo-img" />
          </a>
          <div className="nav-menu">
            <a href="/">홈</a>
            <a href="/news_feed">뉴스</a>
            <a href="/board_list">커뮤니티</a>
          </div>
        </div>
      </header>

      <div className="container register-container">
        <div className="page-title">회원가입</div>
        
          <div className="terms-section">
            <h3>약관 동의</h3>
            
            {/* 전체 동의 체크박스 */}
            <div className="checkbox-group checkbox-group-all">
              <label className="checkbox-label checkbox-label-all">
                <input 
                  type="checkbox" 
                  name="agreeAll" 
                  checked={formData.agreeAll}
                  onChange={handleInputChange}
                />
                <span className="terms-text-all">전체 이용약관 동의</span>
              </label>
            </div>
            
            {/* 구분선 */}
            <div className="terms-divider"></div>
            
            {/* 개별 약관 동의 */}
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="agreeTerms" 
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                />
                <span className="required">[필수]</span> 
                <span className="terms-text">이용약관</span>
                <a href="#" className="terms-link-inline">보기</a>
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="agreePrivacy" 
                  checked={formData.agreePrivacy}
                  onChange={handleInputChange}
                />
                <span className="required">[필수]</span> 
                <span className="terms-text">개인정보처리방침</span>
                <a href="#" className="terms-link-inline">보기</a>
              </label>
            </div>
          </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이메일 <span className="required">*</span></label>
            <div className="input-group">
              <input 
                type="email" 
                name="email"
                className={`form-input ${validationState.email.isValid === true ? 'valid' : validationState.email.isValid === false ? 'invalid' : ''}`}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
                disabled={emailVerification.isVerified}
                required 
              />
              <button 
                type="button" 
                className="btn btn-small"
                onClick={checkEmailDuplicate}
                disabled={emailVerification.isVerified || validationState.email.isChecking || !formData.email || !validateEmail(formData.email)}
              >
                {validationState.email.isChecking ? '확인중...' : '중복확인'}
              </button>
            </div>
            {validationState.email.message && (
              <div className={`form-help ${validationState.email.isValid === true ? 'success' : validationState.email.isValid === false ? 'error' : ''}`}>
                {validationState.email.message}
              </div>
            )}

            {/* 이메일 인증 섹션 */}
            {validationState.email.isValid === true && (
              <div className="verification-section">
                {emailVerification.step === 'sendCode' && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-small verification-btn"
                    onClick={sendVerificationCode}
                    disabled={emailVerification.isSending}
                  >
                    {emailVerification.isSending ? '발송중...' : '인증 코드 발송'}
                  </button>
                )}
                
                {emailVerification.step === 'code' && (
                  <div className="verification-input-group">
                    <div className="verification-info">
                      <span className="verification-text">인증 코드를 입력해주세요</span>
                      <span className="verification-timer">{formatTime(emailVerification.timer)}</span>
                    </div>
                    <div className="input-group">
                      <input 
                        type="text" 
                        className="form-input verification-code-input"
                        value={emailVerification.code}
                        onChange={handleVerificationCodeChange}
                        placeholder="6자리 숫자 입력"
                        maxLength={6}
                      />
                      <button 
                        type="button" 
                        className="btn btn-small"
                        onClick={verifyEmailCode}
                        disabled={emailVerification.code.length !== 6}
                      >
                        인증확인
                      </button>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-text btn-small"
                      onClick={sendVerificationCode}
                      disabled={emailVerification.timer > 240} // 1분 후 재발송 가능
                    >
                      코드 재발송
                    </button>
                  </div>
                )}
                
                {emailVerification.step === 'verified' && (
                  <div className="verification-success">
                    <span className="verification-success-text">✓ 이메일 인증 완료</span>
                  </div>
                )}
              </div>
            )}
          </div>
            {/* 이메일 인증 안내 메시지 */}
            {!emailVerification.isVerified && (
              <div className="verification-notice">
                <span className="verification-notice-text">
                  ⚠️ 이메일 인증을 완료해야 나머지 정보를 입력할 수 있습니다.
                </span>
              </div>
            )}
          <div className="form-group">
            <label className="form-label">비밀번호 <span className="required">*</span></label>
            <div className="password-input-group">
              <input 
                type={showPassword.password ? "text" : "password"} 
                name="password"
                className={`form-input ${validationState.password.isValid === true ? 'valid' : validationState.password.isValid === false ? 'invalid' : ''}`}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="8자 이상 영문, 숫자, 특수문자 포함"
                autoComplete="new-password"
                disabled={!emailVerification.isVerified}
                required 
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('password')}
                disabled={!emailVerification.isVerified}
                aria-label="비밀번호 보기/숨기기"
              >
                <span className="password-toggle-icon">
                  {showPassword.password ? (
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
            {validationState.password.message && (
              <div className={`form-help ${validationState.password.isValid === true ? 'success' : validationState.password.isValid === false ? 'error' : ''}`}>
                {validationState.password.message}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">비밀번호 확인 <span className="required">*</span></label>
            <div className="password-input-group">
              <input 
                type={showPassword.confirmPassword ? "text" : "password"} 
                name="confirmPassword"
                className={`form-input ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'valid' : formData.confirmPassword ? 'invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
                disabled={!emailVerification.isVerified}
                required 
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                disabled={!emailVerification.isVerified}
                aria-label="비밀번호 확인 보기/숨기기"
              >
                <span className="password-toggle-icon">
                  {showPassword.confirmPassword ? (
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
            {formData.confirmPassword && (
              <div className={`form-help ${formData.password === formData.confirmPassword ? 'success' : 'error'}`}>
                {formData.password === formData.confirmPassword ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">닉네임 <span className="required">*</span></label>
            <div className="input-group">
              <input 
                type="text" 
                name="nickname"
                className={`form-input ${validationState.nickname.isValid === true ? 'valid' : validationState.nickname.isValid === false ? 'invalid' : ''}`}
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="닉네임을 입력하세요"
                disabled={!emailVerification.isVerified}
                required 
              />
              <button 
                type="button" 
                className="btn btn-small"
                onClick={checkNicknameDuplicate}
                disabled={!emailVerification.isVerified || validationState.nickname.isChecking || !formData.nickname || !validateNickname(formData.nickname)}
              >
                {validationState.nickname.isChecking ? '확인중...' : '중복확인'}
              </button>
            </div>
            {validationState.nickname.message && (
              <div className={`form-help ${validationState.nickname.isValid === true ? 'success' : validationState.nickname.isValid === false ? 'error' : ''}`}>
                {validationState.nickname.message}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting || !emailVerification.isVerified}
            >
              {isSubmitting ? '회원가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
        
        <div className="divider">
          <span>또는</span>
        </div>
        
        <div className="social-signup">
          <div className="social-signup-title">소셜 계정으로 회원가입</div>
          
          <button className="btn btn-social btn-google" onClick={handleGoogleSignup}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글로 회원가입
          </button>
          
          <button className="btn btn-social btn-naver" onClick={handleNaverSignup}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="3" fill="#03C75A"/>
              <path d="M13 6.5L11.5 9.25V6.5H9.5V13.5H11L12.5 10.75V13.5H14.5V6.5H13Z" fill="white"/>
              <path d="M6.5 6.5V10.25L8 7.5H6.5Z" fill="white"/>
              <path d="M6.5 10.75V13.5H8.5V9.5L6.5 10.75Z" fill="white"/>
            </svg>
            네이버로 회원가입
          </button>
          
          <button className="btn btn-social btn-kakao" onClick={handleKakaoSignup}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 0C4.48 0 0 3.58 0 8C0 10.84 1.64 13.34 4.16 14.9L3.2 18.4C3.04 19.02 3.76 19.52 4.3 19.18L8.54 16.72C9.02 16.78 9.5 16.8 10 16.8C15.52 16.8 20 13.22 20 8C20 3.58 15.52 0 10 0Z" fill="#FEE500"/>
            </svg>
            카카오로 회원가입
          </button>
        </div>
        
        <div className="auth-links">
          <span>이미 계정이 있으신가요?</span>
          <a href="/login" className="auth-link">로그인</a>
        </div>
      </div>
    </div>
  );
};

export default FactlabRegister;
