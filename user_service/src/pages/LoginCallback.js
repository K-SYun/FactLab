import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('user_id');
      const nickname = searchParams.get('nickname');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('소셜 로그인 오류:', error);
        navigate('/login', { 
          state: { 
            error: '소셜 로그인에 실패했습니다. 다시 시도해주세요.' 
          } 
        });
        return;
      }
      
      if (token && userId && nickname) {
        // 로그인 정보 저장
        const userData = {
          id: parseInt(userId),
          nickname: nickname,
          token: token
        };
        
        login(userData);
        
        // 메인 페이지로 리다이렉트하면서 성공 메시지 표시
        navigate('/', { 
          state: { 
            message: `${nickname}님, 환영합니다!`,
            type: 'success'
          } 
        });
      } else {
        console.error('필수 콜백 파라미터가 누락되었습니다.');
        navigate('/login', { 
          state: { 
            error: '로그인 처리 중 오류가 발생했습니다.' 
          } 
        });
      }
    };
    
    handleCallback();
  }, [searchParams, navigate, login]);
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div style={{
        fontSize: '18px',
        marginBottom: '20px'
      }}>
        로그인 처리 중...
      </div>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginCallback;