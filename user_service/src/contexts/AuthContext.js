import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 세션 타임아웃 시간 (30분 = 1800000ms)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// 인증 컨텍스트 Provider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginDate, setLoginDate] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeoutId, setTimeoutId] = useState(null);

  // 자동 로그아웃 함수
  const autoLogout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    setLoginDate(null);
    setLastActivity(null);
    
    // 로컬 스토리지에서 제거
    localStorage.removeItem('factlab_user');
    localStorage.removeItem('factlab_login_date');
    localStorage.removeItem('factlab_last_activity');
    
    // 세션 만료 알림
    alert('30분 동안 활동이 없어 자동으로 로그아웃되었습니다.');
    
    // 현재 페이지가 로그인이 필요한 페이지라면 로그인 페이지로 이동
    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  // 활동 감지 시 세션 갱신
  const resetTimeout = useCallback(() => {
    if (!isLoggedIn) return;
    
    const now = Date.now();
    setLastActivity(now);
    localStorage.setItem('factlab_last_activity', now.toString());
    
    // 기존 타이머 제거
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // 새로운 타이머 설정
    const newTimeoutId = setTimeout(() => {
      autoLogout();
    }, SESSION_TIMEOUT);
    
    setTimeoutId(newTimeoutId);
  }, [isLoggedIn, timeoutId, autoLogout]);

  // 사용자 활동 감지 이벤트 리스너
  useEffect(() => {
    if (!isLoggedIn) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoggedIn, resetTimeout, timeoutId]);

  // 컴포넌트 마운트 시 로컬 스토리지에서 인증 정보 확인
  useEffect(() => {
    const storedUser = localStorage.getItem('factlab_user');
    const storedLoginDate = localStorage.getItem('factlab_login_date');
    const storedLastActivity = localStorage.getItem('factlab_last_activity');
    
    if (storedUser && storedLoginDate && storedLastActivity) {
      const lastActivityTime = parseInt(storedLastActivity);
      const now = Date.now();
      
      // 마지막 활동으로부터 30분이 지났는지 확인
      if (now - lastActivityTime > SESSION_TIMEOUT) {
        // 세션 만료 - 로컬 스토리지 클리어
        localStorage.removeItem('factlab_user');
        localStorage.removeItem('factlab_login_date');
        localStorage.removeItem('factlab_last_activity');
        return;
      }
      
      // 세션이 유효한 경우
      setUser(JSON.parse(storedUser));
      setLoginDate(storedLoginDate);
      setLastActivity(lastActivityTime);
      setIsLoggedIn(true);
    }
  }, []);

  // 로그인 함수 (내부용)
  const login = (userData) => {
    console.log('login 함수 호출됨:', userData);
    const currentDate = new Date().toISOString();
    const now = Date.now();
    
    setUser(userData);
    setIsLoggedIn(true);
    setLoginDate(currentDate);
    setLastActivity(now);
    
    console.log('상태 설정 완료 - isLoggedIn: true, user:', userData);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('factlab_user', JSON.stringify(userData));
    localStorage.setItem('factlab_login_date', currentDate);
    localStorage.setItem('factlab_last_activity', now.toString());
    
    console.log('로컬 스토리지에 저장 완료');
    
    // 세션 타이머 시작
    const newTimeoutId = setTimeout(() => {
      autoLogout();
    }, SESSION_TIMEOUT);
    
    setTimeoutId(newTimeoutId);
  };

  // 백엔드 API를 통한 로그인 함수
  const loginWithApi = async (email, password) => {
    console.log('loginWithApi 호출됨:', { email, password });
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();
      console.log('백엔드 응답:', result);

      if (!result.success) {
        throw new Error(result.error || '로그인에 실패했습니다.');
      }

      // 백엔드 응답 데이터를 사용하여 로그인 처리
      const userData = {
        id: result.data.id,
        email: result.data.email,
        nickname: result.data.nickname,
      };

      console.log('로그인 처리할 사용자 데이터:', userData);
      login(userData);
      console.log('로그인 처리 완료, isLoggedIn:', isLoggedIn);
      return { success: true, data: userData };
      
    } catch (error) {
      console.error('로그인 오류:', error);
      return { 
        success: false, 
        error: error.message || '로그인 중 오류가 발생했습니다.' 
      };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    // 세션 타이머 정리
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setUser(null);
    setIsLoggedIn(false);
    setLoginDate(null);
    setLastActivity(null);
    
    // 로컬 스토리지에서 제거
    localStorage.removeItem('factlab_user');
    localStorage.removeItem('factlab_login_date');
    localStorage.removeItem('factlab_last_activity');
  };

  // 날짜 포맷팅 함수 (yyyy년mm월dd일 형식)
  const formatLoginDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}년${month}월${day}일접속`;
  };

  // 환영 메시지 생성
  const getWelcomeMessage = () => {
    if (!user) return '';
    return `${user.nickname}님 안녕하세요.`;
  };

  const value = {
    user,
    isLoggedIn,
    loginDate,
    login,
    loginWithApi,
    logout,
    formatLoginDate,
    getWelcomeMessage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 인증 컨텍스트를 사용하는 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;