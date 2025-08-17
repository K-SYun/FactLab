// API 테스트용 유틸리티
import { getDashboardStats, getRecentActivities } from '../api/dashboard';

export const testAdminApi = async () => {
  console.log('🧪 어드민 API 테스트 시작...');
  
  try {
    // 대시보드 통계 테스트
    console.log('📊 대시보드 통계 API 테스트...');
    const stats = await getDashboardStats();
    console.log('✅ 대시보드 통계:', stats);
    
    // 최근 활동 테스트
    console.log('📝 최근 활동 API 테스트...');
    const activities = await getRecentActivities(5);
    console.log('✅ 최근 활동:', activities);
    
    console.log('🎉 모든 API 테스트 완료!');
    return true;
  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
    return false;
  }
};

// 개발 환경에서만 실행
if (process.env.NODE_ENV === 'development') {
  // 콘솔에서 testAdminApi() 함수를 호출할 수 있도록 전역으로 설정
  (window as any).testAdminApi = testAdminApi;
}