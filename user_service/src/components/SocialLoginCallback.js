import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SocialLoginCallback = () => {
  const [searchParams] = useSearchParams();
  const { provider } = useParams();
  const navigate = useNavigate();
  const { loginWithSocialToken } = useAuth();
  const [status, setStatus] = useState('처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');
        
        // state를 통해 회원가입인지 로그인인지 구분
        const isSignup = state === 'signup' || (state && state.includes('_signup'));
        const isLogin = state === 'login' || (state && state.includes('_login'));
        
        if (error) {
          setStatus(isSignup ? '회원가입이 취소되었습니다.' : '로그인이 취소되었습니다.');
          setTimeout(() => {
            navigate(isSignup ? '/register' : '/');
          }, 2000);
          return;
        }

        if (!code) {
          setStatus(isSignup ? '회원가입 코드가 없습니다.' : '로그인 코드가 없습니다.');
          setTimeout(() => {
            navigate(isSignup ? '/register' : '/');
          }, 2000);
          return;
        }

        setStatus(isSignup ? '회원가입 처리 중...' : '로그인 처리 중...');

        // 백엔드에 코드 전송하여 토큰 교환 및 사용자 정보 획득
        try {
          const apiUrl = isSignup ? `/api/auth/${provider}/signup` : `/api/auth/${provider}/callback`;
          const response = await fetch(`${apiUrl}?code=${code}&state=${state}`);
          const result = await response.json();

          if (result.success && result.data) {
            setStatus(isSignup ? '회원가입 성공! 메인 페이지로 이동합니다...' : '로그인 성공! 메인 페이지로 이동합니다...');
            
            // AuthContext의 로그인 함수 호출
            if (loginWithSocialToken) {
              await loginWithSocialToken(result.data);
            }
            
            alert(`${result.data.nickname}님, ${isSignup ? '회원가입 및 로그인' : '로그인'}이 완료되었습니다!`);
            
            // 메인 페이지로 리디렉션
            setTimeout(() => {
              navigate('/');
            }, 1000);
          } else {
            setStatus(result.error || (isSignup ? '회원가입에 실패했습니다.' : '로그인에 실패했습니다.'));
            setTimeout(() => {
              navigate(isSignup ? '/register' : '/');
            }, 3000);
          }
        } catch (backendError) {
          console.warn('백엔드 API 미구현 - 데모 모드로 진행:', backendError);
          
          // 백엔드 API가 없는 경우 데모 데이터로 처리
          const demoUserData = {
            id: Math.floor(Math.random() * 1000),
            email: `${provider}user@example.com`,
            nickname: `${provider.charAt(0).toUpperCase() + provider.slice(1)} 사용자`,
            provider: provider,
            socialId: code.substring(0, 10),
            profileImage: null
          };

          setStatus(isSignup ? '데모 회원가입 성공! 메인 페이지로 이동합니다...' : '데모 로그인 성공! 메인 페이지로 이동합니다...');
          
          // AuthContext의 로그인 함수 호출
          if (loginWithSocialToken) {
            await loginWithSocialToken(demoUserData);
          }
          
          alert(`${demoUserData.nickname}님, 데모 ${isSignup ? '회원가입 및 로그인' : '로그인'}이 완료되었습니다!`);
          
          // 메인 페이지로 리디렉션
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      } catch (error) {
        console.error('소셜 로그인 콜백 처리 오류:', error);
        setStatus('로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, provider, navigate, loginWithSocialToken]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '18px',
        color: '#0066cc',
        marginBottom: '20px'
      }}>
        {provider === 'kakao' && '카카오'}
        {provider === 'google' && '구글'}
        {provider === 'naver' && '네이버'} 
        로그인
      </div>
      
      <div style={{
        fontSize: '16px',
        color: '#333',
        marginBottom: '20px'
      }}>
        {status}
      </div>
      
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #0066cc',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SocialLoginCallback;