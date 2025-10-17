import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdLayout } from '../components/ads';
import { commentApi } from '../services/commentApi';
import { mypageApi } from '../services/userApi';
import { boardService } from '../services/boardApi';
import { useAuth } from '../contexts/AuthContext';
import { formatToKST } from '../utils/dateFormatter';
import '../styles/Common.css';
import '../styles/Main.css';
import '../styles/News.css';
import '../styles/Mypage.css';

const FactlabMypage = () => {
  const [activeSection, setActiveSection] = useState('posts');
  const [profileData, setProfileData] = useState({
    nickname: '',
    email: '',
    intro: '',
    gender: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    level: 1,
    activityScore: 0,
    joinDate: '',
    lastLogin: ''
  });

  // 프로필 이미지 상태 관리
  const [profileImage, setProfileImage] = useState(null);

  // 사용자 활동 데이터 상태 관리
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userComments, setUserComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [userLikedPosts, setUserLikedPosts] = useState([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [userVoteHistory, setUserVoteHistory] = useState([]);
  const [voteHistoryLoading, setVoteHistoryLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 소셜 계정 관리 상태
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);

  // 페이지네이션 상태
  const [commentsPagination, setCommentsPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });

  const { user, loading: authLoading } = useAuth();

  // 레벨별 타이틀 반환
  const getLevelTitle = (level) => {
    const titles = {
      1: '새내기',
      2: '뉴비',
      3: '일반 회원',
      4: '활동적인 회원',
      5: '활발한 토론자',
      6: '베테랑',
      7: '전문가',
      8: '고급 전문가',
      9: '마스터',
      10: '그랜드마스터'
    };
    return titles[level] || '회원';
  };

  // 다음 레벨까지 필요한 점수 계산
  const getPointsToNextLevel = (currentScore) => {
    const levelThreshold = 500; // 레벨당 필요 점수
    const nextLevelScore = Math.ceil(currentScore / levelThreshold) * levelThreshold;
    return nextLevelScore - currentScore;
  };

  // 사용자 프로필 정보 로드
  useEffect(() => {
    // 사용자 정보 디버깅
    console.log('마이페이지 로드 - 현재 사용자:', user);
    console.log('로컬 스토리지 사용자:', localStorage.getItem('factlab_user'));
    console.log('액세스 토큰:', localStorage.getItem('accessToken'));

    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        const response = await mypageApi.getUserProfile(user.id);
        if (response.data.success) {
          const profile = response.data.data;
          setProfileData({
            nickname: profile.nickname || '',
            email: profile.email || '',
            intro: profile.intro || '',
            gender: profile.gender || '',
            birthDate: profile.birthDate || '',
            level: profile.level || 1,
            activityScore: profile.activityScore || 0,
            joinDate: profile.joinDate || '',
            lastLogin: profile.lastLogin || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });

          if (profile.profileImageUrl) {
            setProfileImage(profile.profileImageUrl);
          }
        }
      } catch (error) {
        console.error('프로필 정보 로드 오류:', error);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  useEffect(() => {
    // 레벨 애니메이션
    if (profileData.activityScore > 0) {
      const levelProgress = document.querySelector('.news-mypage-level-progress');
      if (levelProgress) {
        levelProgress.style.width = '0%';
        setTimeout(() => {
          const percentage = ((profileData.activityScore % 500) / 500) * 100;
          levelProgress.style.width = `${percentage}%`;
        }, 500);
      }
    }
  }, [profileData.activityScore]);

  // 사용자 게시글 로드
  useEffect(() => {
    const loadUserPosts = async () => {
      if (!user?.id) {
        console.log('사용자 ID가 없음:', user);
        return;
      }

      console.log('사용자 게시글 로드 시작 - 사용자 ID:', user.id, '전체 사용자 객체:', user);
      setPostsLoading(true);

      try {
        const response = await boardService.getUserPosts(user.id, 0, 20);
        console.log('사용자 게시글 API 응답:', response.data);

        if (response.data && response.data.success) {
          const posts = Array.isArray(response.data.data) ? response.data.data :
            Array.isArray(response.data.data?.content) ? response.data.data.content : [];
          console.log('로드된 게시글 수:', posts.length);
          setUserPosts(posts);
        } else {
          console.log('게시글 조회 실패:', response.data?.message);
          setUserPosts([]);
        }
      } catch (error) {
        console.error('사용자 게시글 로드 오류 상세:', error);
        console.log('오류 상태 코드:', error.response?.status);
        console.log('오류 응답:', error.response?.data);

        // 안전하게 빈 배열로 설정
        setUserPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    if (activeSection === 'posts') {
      loadUserPosts();
    }
  }, [user?.id, activeSection]);

  // 사용자 댓글 로드 함수
  const loadUserComments = async (page = 0) => {
    if (!user?.id) return;

    setCommentsLoading(true);
    try {
      // commentApi를 사용하여 실제 뉴스 제목이 포함된 댓글 조회
      const response = await commentApi.getUserComments(user.id, page, 20);
      console.log('사용자 댓글 API 응답:', response);

      // 응답 데이터 형태 확인하고 설정
      if (Array.isArray(response)) {
        setUserComments(response);
        setCommentsPagination({
          currentPage: 0,
          totalPages: response.length > 0 ? 1 : 0,
          totalElements: response.length,
          size: 20
        });
      } else if (response && typeof response === 'object') {
        // Page 객체인 경우
        setUserComments(response.content || []);
        setCommentsPagination({
          currentPage: response.number || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0,
          size: response.size || 20
        });
      } else {
        setUserComments([]);
        setCommentsPagination({
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
          size: 20
        });
      }
    } catch (error) {
      console.error('사용자 댓글 로드 오류:', error);
      setUserComments([]);
      setCommentsPagination({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        size: 20
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  // 사용자 댓글 로드
  useEffect(() => {
    if (activeSection === 'comments') {
      loadUserComments(0);
    }
  }, [user?.id, activeSection]);

  // 사용자 좋아요 목록 로드
  useEffect(() => {
    const loadUserLikedPosts = async () => {
      if (!user?.id) return;

      setLikedPostsLoading(true);
      // TODO: API 구현 후 실제 데이터 로드
      // 현재는 빈 배열로 설정 (API 미구현)
      setUserLikedPosts([]);
      console.log('좋아요 목록 API 미구현 - 빈 데이터 표시');
      setLikedPostsLoading(false);
    };

    if (activeSection === 'likes') {
      loadUserLikedPosts();
    }
  }, [user?.id, activeSection]);

  // 사용자 투표 기록 로드
  useEffect(() => {
    const loadUserVoteHistory = async () => {
      if (!user?.id) return;

      setVoteHistoryLoading(true);
      // TODO: API 구현 후 실제 데이터 로드
      // 현재는 빈 배열로 설정 (API 미구현)
      setUserVoteHistory([]);
      console.log('투표 기록 API 미구현 - 빈 데이터 표시');
      setVoteHistoryLoading(false);
    };

    if (activeSection === 'votes') {
      loadUserVoteHistory();
    }
  }, [user?.id, activeSection]);

  // 사용자 통계 로드
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;

      setStatsLoading(true);
      // TODO: 사용자별 통계 API 구현 후 실제 데이터 로드
      // 현재는 기본 통계 정보로 설정 (사용자별 API 미구현)
      setUserStats({
        postsCount: user?.postsCount || 0,
        commentsCount: user?.commentsCount || 0,
        likesReceived: 0,
        totalViews: 0
      });
      console.log('사용자 통계 API 미구현 - 기본 데이터 표시');
      setStatsLoading(false);
    };

    if (activeSection === 'stats') {
      loadUserStats();
    }
  }, [user?.id, activeSection]);

  // 소셜 계정 로드
  useEffect(() => {
    const loadSocialAccounts = async () => {
      if (!user?.id) return;

      setSocialLoading(true);
      // TODO: 소셜 계정 API 구현 후 실제 데이터 로드
      // 현재는 빈 배열로 설정 (API 미구현)
      setSocialAccounts([]);
      console.log('소셜 계정 API 미구현 - 빈 데이터 표시');
      setSocialLoading(false);
    };

    if (activeSection === 'social') {
      loadSocialAccounts();
    }
  }, [user?.id, activeSection]);

  // 메뉴 클릭 핸들러
  const handleMenuClick = (section, e) => {
    if (e) e.preventDefault();
    setActiveSection(section);
  };

  // 프로필 이미지 변경 핸들러
  const changeProfileImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
          alert('프로필 이미지 파일 크기는 5MB를 초과할 수 없습니다.');
          return;
        }

        try {
          const formData = new FormData();
          formData.append('profileImage', file);

          const response = await mypageApi.uploadProfileImage(user.id, formData);
          if (response.data.success) {
            setProfileImage(response.data.data.profileImageUrl);
            alert('프로필 이미지가 업로드되었습니다.');
          } else {
            alert('프로필 이미지 업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('프로필 이미지 업로드 오류:', error);
          alert('프로필 이미지 업로드 중 오류가 발생했습니다.');
        }
      }
    };
    input.click();
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 프로필 저장 핸들러
  const saveProfile = async () => {
    if (!profileData.nickname.trim()) {
      alert('닉네임을 입력하세요.');
      return;
    }

    // 비밀번호 변경 유효성 검사
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        alert('현재 비밀번호를 입력하세요.');
        return;
      }
      if (profileData.newPassword !== profileData.confirmPassword) {
        alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
      if (profileData.newPassword.length < 6) {
        alert('새 비밀번호는 6자 이상이어야 합니다.');
        return;
      }
    }

    try {
      // 프로필 정보 업데이트
      const updateData = {
        nickname: profileData.nickname,
        intro: profileData.intro,
        gender: profileData.gender,
        birthDate: profileData.birthDate
      };

      const response = await mypageApi.updateUserProfile(user.id, updateData);

      if (response.data.success) {
        // 비밀번호 변경 요청이 있으면 처리
        if (profileData.newPassword) {
          const passwordData = {
            currentPassword: profileData.currentPassword,
            newPassword: profileData.newPassword
          };

          const passwordResponse = await mypageApi.changePassword(user.id, passwordData);
          if (passwordResponse.data.success) {
            alert('프로필 정보와 비밀번호가 업데이트되었습니다.');
            // 비밀번호 필드 초기화
            setProfileData(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            }));
          } else {
            alert(passwordResponse.data.message || '비밀번호 변경에 실패했습니다.');
          }
        } else {
          alert('프로필 정보가 업데이트되었습니다.');
        }
      } else {
        alert(response.data.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 폼 초기화 핸들러
  const resetForm = () => {
    if (window.confirm('변경사항이 취소됩니다. 계속하시겠습니까?')) {
      window.location.reload();
    }
  };

  // 소셜 계정 연결
  const connectSocialAccount = async (provider) => {
    try {
      const response = await fetch(`/api/auth/${provider.toLowerCase()}/login-url`);
      const result = await response.json();

      if (result.success) {
        window.location.href = result.data;
      } else {
        alert(`${provider} 연결에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`${provider} 연결 오류:`, error);
      alert(`${provider} 연결 중 오류가 발생했습니다.`);
    }
  };

  // 소셜 계정 해제
  const disconnectSocialAccount = async (provider) => {
    if (!window.confirm(`${provider} 계정 연결을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await mypageApi.disconnectSocialAccount(user.id, provider.toLowerCase());

      if (response.data.success) {
        alert(`${provider} 계정 연결이 해제되었습니다.`);
        // 소셜 계정 목록 새로고침
        const updatedAccounts = socialAccounts.filter(account =>
          account.provider.toUpperCase() !== provider.toUpperCase()
        );
        setSocialAccounts(updatedAccounts);
      } else {
        alert(response.data.message || `${provider} 계정 해제에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`${provider} 계정 해제 오류:`, error);
      alert(`${provider} 계정 해제 중 오류가 발생했습니다.`);
    }
  };

  // 프로필 이미지 동기화
  const syncProfileImage = async (provider) => {
    try {
      const response = await mypageApi.syncSocialProfileImage(user.id, provider.toLowerCase());

      if (response.data.success) {
        alert(`${provider}에서 프로필 이미지가 동기화되었습니다.`);
        // 프로필 이미지 업데이트
        if (response.data.data.profileImageUrl) {
          setProfileImage(response.data.data.profileImageUrl);
        }
      } else {
        alert(response.data.message || '프로필 이미지 동기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 이미지 동기화 오류:', error);
      alert('프로필 이미지 동기화 중 오류가 발생했습니다.');
    }
  };

  // 소셜 계정 정보 조회
  const getSocialAccountInfo = (provider) => {
    return socialAccounts.find(account =>
      account.provider.toUpperCase() === provider.toUpperCase()
    );
  };

  // 소셜 프로바이더 정보
  const socialProviders = [
    {
      name: 'GOOGLE',
      displayName: '구글',
      color: '#4285F4',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )
    },
    {
      name: 'NAVER',
      displayName: '네이버',
      color: '#03C75A',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="3" fill="#03C75A" />
          <path d="M13 6.5L11.5 9.25V6.5H9.5V13.5H11L12.5 10.75V13.5H14.5V6.5H13Z" fill="white" />
          <path d="M6.5 6.5V10.25L8 7.5H6.5Z" fill="white" />
          <path d="M6.5 10.75V13.5H8.5V9.5L6.5 10.75Z" fill="white" />
        </svg>
      )
    },
    {
      name: 'KAKAO',
      displayName: '카카오',
      color: '#FEE500',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 0C4.48 0 0 3.58 0 8C0 10.84 1.64 13.34 4.16 14.9L3.2 18.4C3.04 19.02 3.76 19.52 4.3 19.18L8.54 16.72C9.02 16.78 9.5 16.8 10 16.8C15.52 16.8 20 13.22 20 8C20 3.58 15.52 0 10 0Z" fill="#FEE500" />
        </svg>
      )
    }
  ];

  // 로그인하지 않은 사용자 처리
  if (authLoading) {
    return (
      <>
        <Header />
        <AdLayout>
          <div className="mypage-container">
            <div className="news-mypage-loading">로딩 중...</div>
          </div>
        </AdLayout>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <AdLayout>
          <div className="mypage-container">
            <div className="mypage-page-header">
              <div className="mypage-page-header-title">👤 마이페이지</div>
            </div>
            <div className="news-mypage-empty news-mypage-empty-container">
              <p>로그인이 필요합니다.</p>
              <p><Link to="/login">로그인하기</Link></p>
            </div>
          </div>
        </AdLayout>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <AdLayout>
        <div className="mypage-container">
          <div className="mypage-page-header">
            <div className="mypage-page-header-title">👤 마이페이지</div>
          </div>

          <div className="news-mypage-content">
            {/* Sidebar */}
            <div className="news-mypage-sidebar">
              <ul className="news-mypage-sidebar-menu">
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'posts' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('posts', e)}
                  >
                    작성한 글
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'comments' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('comments', e)}
                  >
                    작성한 댓글
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'likes' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('likes', e)}
                  >
                    좋아요 목록
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'votes' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('votes', e)}
                  >
                    투표 기록
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'stats' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('stats', e)}
                  >
                    활동 통계
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'profile' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('profile', e)}
                  >
                    프로필 관리
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`news-mypage-menu-link ${activeSection === 'social' ? 'active' : ''}`}
                    onClick={(e) => handleMenuClick('social', e)}
                  >
                    소셜 계정 연동
                  </a>
                </li>
                {/* <li>
                <Link to="/settings" className="news-mypage-menu-link">설정</Link>
              </li>
              <li>
                <Link to="/notifications" className="news-mypage-menu-link">알림</Link>
              </li> */}
              </ul>
            </div>

            {/* Main Content */}
            <div className="news-mypage-main-content">
              {/* Profile Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'profile' ? 'active' : ''}`}>
                <div className="news-mypage-profile-section">
                  <div
                    className={`news-mypage-profile-image ${profileImage ? 'has-image' : ''}`}
                    onClick={changeProfileImage}
                    style={profileImage ? { '--bg-image': `url(${profileImage})` } : {}}
                  >
                    {!profileImage && '👤'}
                  </div>
                  <div className="news-mypage-profile-info">
                    <div className="news-mypage-profile-name">{profileData.nickname || '닉네임 없음'}</div>
                    <div className="news-mypage-profile-stats">
                      <span>가입일: {formatToKST(profileData.joinDate)}</span>
                      <span>최근 접속: {formatToKST(profileData.lastLogin)}</span>
                    </div>
                    <div className="news-mypage-level-info">
                      <div>레벨 {profileData.level} - {getLevelTitle(profileData.level)} (활동점수: {profileData.activityScore?.toLocaleString() || 0}점)</div>
                      <div className="news-mypage-level-bar">
                        <div className="news-mypage-level-progress"></div>
                      </div>
                      <div className="news-mypage-level-next">
                        다음 레벨까지 {getPointsToNextLevel(profileData.activityScore || 0)}점 남음
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="news-mypage-form-title">프로필 정보 수정</h3>

                <div className="news-mypage-form-group">
                  <label className="news-mypage-form-label">이메일</label>
                  <input
                    type="email"
                    className="news-mypage-form-input"
                    value={profileData.email}
                    readOnly
                  />
                </div>

                <div className="news-mypage-form-group">
                  <label className="news-mypage-form-label">닉네임/별명 (게시판에 작성자로 표시됩니다.)</label>
                  <input
                    type="text"
                    className="news-mypage-form-input"
                    name="nickname"
                    value={profileData.nickname}
                    onChange={handleInputChange}
                    maxLength="20"
                  />
                </div>
                <div className="news-mypage-form-group">
                  <label className="news-mypage-form-label">성별 / 생년월일</label>
                  <input
                    type="text"
                    className="news-mypage-form-input"
                    name="gender"
                    value={profileData.gender}
                    onChange={handleInputChange}
                    maxLength="3"
                  />
                  <input
                    type="int"
                    className="news-mypage-form-input"
                    name="birth_date"
                    value={profileData.birth_date}
                    onChange={handleInputChange}
                    maxLength="6"
                  />
                </div>
                <div className="news-mypage-form-group">
                  <label className="news-mypage-form-label">자기소개</label>
                  <textarea
                    className="news-mypage-form-input"
                    name="intro"
                    value={profileData.intro}
                    onChange={handleInputChange}
                    placeholder="간단한 자기소개를 입력하세요"
                  ></textarea>
                </div>


                <div>
                  <button className="news-btn news-btn-primary" onClick={saveProfile}>저장</button>
                  <button className="news-btn" onClick={resetForm}>취소</button>
                </div>
              </div>

              {/* Posts Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'posts' ? 'active' : ''}`}>
                <h3 className="news-mypage-section-title">작성한 게시글 (총 {Array.isArray(userPosts) ? userPosts.length : 0}개)</h3>

                {postsLoading ? (
                  <div className="news-mypage-loading">게시글을 불러오는 중...</div>
                ) : !Array.isArray(userPosts) || userPosts.length === 0 ? (
                  <div className="news-mypage-empty">작성한 게시글이 없습니다.</div>
                ) : (
                  <>
                    <table className="news-mypage-activity-list">
                      <thead>
                        <tr>
                          <th width="60">번호</th>
                          <th>제목</th>
                          <th width="80">게시판</th>
                          <th width="60">조회</th>
                          <th width="60">댓글</th>
                          <th width="80">작성일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userPosts.map((post, index) => (
                          <tr key={post?.id || index}>
                            <td>{userPosts.length - index}</td>
                            <td>
                              <Link to={`/board/${post?.boardId || 'unknown'}/post/${post?.id || 'unknown'}`} className="news-mypage-activity-title">
                                {post?.title || '제목 없음'}
                              </Link>
                            </td>
                            <td>{post?.boardName || '-'}</td>
                            <td>{post?.viewCount || 0}</td>
                            <td>{post?.commentCount || 0}</td>
                            <td>{post?.createdAt ? formatToKST(post.createdAt).substring(0, 10) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Comments Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'comments' ? 'active' : ''}`}>
                <h3 className="news-mypage-section-title">
                  작성한 댓글 (총 {commentsPagination.totalElements}개)
                </h3>

                {commentsLoading ? (
                  <div className="news-mypage-loading">댓글을 불러오는 중...</div>
                ) : !Array.isArray(userComments) || userComments.length === 0 ? (
                  <div className="news-mypage-empty">작성한 댓글이 없습니다.</div>
                ) : (
                  <>
                    <table className="news-mypage-activity-list">
                      <thead>
                        <tr>
                          <th width="60">번호</th>
                          <th>댓글 내용</th>
                          <th>원글</th>
                          <th width="60">좋아요</th>
                          <th width="80">작성일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userComments.map((comment, index) => (
                          <tr key={comment.id}>
                            <td>{commentsPagination.totalElements - (commentsPagination.currentPage * commentsPagination.size) - index}</td>
                            <td className="news-mypage-comment-content">
                              {comment.content || comment.comment || '댓글 내용'}
                            </td>
                            <td>
                              <Link to={`/news_detail?id=${comment.newsId}`} className="news-mypage-activity-title">
                                {comment.newsTitle || `[${comment.newsId}] 뉴스 제목`}
                              </Link>
                            </td>
                            <td>{comment.likeCount || 0}</td>
                            <td>{comment.createdAt ? formatToKST(comment.createdAt).substring(0, 10) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Pagination
                      pagination={commentsPagination}
                      onPageChange={loadUserComments}
                    />
                  </>
                )}
              </div>

              {/* Likes Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'likes' ? 'active' : ''}`}>
                <h3 className="news-mypage-section-title">좋아요 표시한 글 (총 {Array.isArray(userLikedPosts) ? userLikedPosts.length : 0}개)</h3>

                {likedPostsLoading ? (
                  <div className="news-mypage-loading">좋아요 목록을 불러오는 중...</div>
                ) : !Array.isArray(userLikedPosts) || userLikedPosts.length === 0 ? (
                  <div className="news-mypage-empty">좋아요 표시한 글이 없습니다.</div>
                ) : (
                  <>
                    <table className="news-mypage-activity-list">
                      <thead>
                        <tr>
                          <th width="60">번호</th>
                          <th>제목</th>
                          <th width="80">작성자</th>
                          <th width="80">게시판</th>
                          <th width="80">좋아요일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLikedPosts.map((post, index) => (
                          <tr key={post.id}>
                            <td>{userLikedPosts.length - index}</td>
                            <td>
                              <Link to={`/board/${post.boardId}/post/${post.id}`} className="news-mypage-activity-title">
                                {post.title}
                              </Link>
                            </td>
                            <td>{post.authorNickname || '-'}</td>
                            <td>{post.boardName || '-'}</td>
                            <td>{post.likedAt ? formatToKST(post.likedAt).substring(0, 10) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Votes Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'votes' ? 'active' : ''}`}>
                <h3 className="news-mypage-section-title">투표 기록 (총 {Array.isArray(userVoteHistory) ? userVoteHistory.length : 0}개)</h3>

                {voteHistoryLoading ? (
                  <div className="news-mypage-loading">투표 기록을 불러오는 중...</div>
                ) : !Array.isArray(userVoteHistory) || userVoteHistory.length === 0 ? (
                  <div className="news-mypage-empty">투표 기록이 없습니다.</div>
                ) : (
                  <>
                    <table className="news-mypage-activity-list">
                      <thead>
                        <tr>
                          <th width="60">번호</th>
                          <th>뉴스 제목</th>
                          <th width="80">투표 결과</th>
                          <th width="80">투표일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userVoteHistory.map((vote, index) => (
                          <tr key={vote.id}>
                            <td>{userVoteHistory.length - index}</td>
                            <td>
                              <Link to={`/news_detail?id=${vote.newsId}`} className="news-mypage-activity-title">
                                {vote.newsTitle}
                              </Link>
                            </td>
                            <td>
                              <span className={`news-mypage-vote-${vote.voteType?.toLowerCase()}`}>
                                {vote.voteType === 'FACT' ? '✅ 사실' :
                                  vote.voteType === 'DOUBT' ? '❌ 의심' :
                                    vote.voteType === 'PARTIAL' ? '⚠️ 부분사실' : vote.voteType}
                              </span>
                            </td>
                            <td>{vote.votedAt ? formatToKST(vote.votedAt).substring(0, 10) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Stats Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'stats' ? 'active' : ''}`}>
                <h3 className="news-mypage-section-title">활동 통계</h3>

                {statsLoading ? (
                  <div className="news-mypage-loading">통계를 불러오는 중...</div>
                ) : (
                  <>
                    <div className="news-mypage-stats-grid">
                      <div className="news-mypage-stat-card">
                        <div className="news-mypage-stat-number">{userStats?.totalActivityScore?.toLocaleString() || profileData.activityScore?.toLocaleString() || 0}</div>
                        <div className="news-mypage-stat-label">총 활동점수</div>
                      </div>
                      <div className="news-mypage-stat-card">
                        <div className="news-mypage-stat-number">{userStats?.totalPosts || userPosts.length || 0}</div>
                        <div className="news-mypage-stat-label">작성한 글</div>
                      </div>
                      <div className="news-mypage-stat-card">
                        <div className="news-mypage-stat-number">{userStats?.totalComments || userComments.length || 0}</div>
                        <div className="news-mypage-stat-label">작성한 댓글</div>
                      </div>
                      <div className="news-mypage-stat-card">
                        <div className="news-mypage-stat-number">{userStats?.totalLikes || 0}</div>
                        <div className="news-mypage-stat-label">받은 좋아요</div>
                      </div>
                      <div className="news-mypage-stat-card">
                        <div className="news-mypage-stat-number">{userStats?.totalVotes || userVoteHistory.length || 0}</div>
                        <div className="news-mypage-stat-label">뉴스 투표 참여</div>
                      </div>
                      <div className="news-mypage-stat-card">
                        <div className="news-mypage-stat-number">레벨 {profileData.level || 1}</div>
                        <div className="news-mypage-stat-label">현재 레벨</div>
                      </div>
                    </div>

                    <div className="news-mypage-chart-container">
                      <h4 className="news-mypage-chart-title">월별 활동 통계</h4>
                      <div className="news-mypage-chart-placeholder">
                        📊 활동 통계 차트<br />
                        <small>(실제 구현 시 Chart.js 등 사용)</small>
                      </div>
                    </div>

                    <div className="news-mypage-chart-container">
                      <h4 className="news-mypage-chart-title">카테고리별 활동 분포</h4>
                      <div className="news-mypage-chart-placeholder">
                        🥧 카테고리 분포 차트<br />
                        {userStats?.categoryStats ? (
                          <small>
                            {Object.entries(userStats.categoryStats)
                              .map(([category, count]) => `${category}: ${count}%`)
                              .join(', ')}
                          </small>
                        ) : (
                          <small>(데이터 없음)</small>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Social Accounts Section */}
              <div className={`news-mypage-activity-section ${activeSection === 'social' ? 'active' : ''}`}>
                <h3 className="news-mypage-section-title">소셜 계정 연동 관리</h3>

                {socialLoading ? (
                  <div className="news-mypage-social-loading">소셜 계정 정보를 불러오는 중...</div>
                ) : (
                  <div className="social-accounts-container">
                    {socialProviders.map((provider) => {
                      const accountInfo = getSocialAccountInfo(provider.name);
                      const isConnected = !!accountInfo;

                      return (
                        <div key={provider.name} className="social-account-card">
                          <div className="social-account-header">
                            <div className={`social-account-icon social-icon-${provider.name.toLowerCase()}`}>
                              {provider.icon}
                            </div>
                            <div className="social-account-info">
                              <div className="social-account-name">{provider.displayName}</div>
                              <div className="social-account-status">
                                {isConnected ? (
                                  <span className="social-status-connected">✅ 연결됨</span>
                                ) : (
                                  <span className="social-status-disconnected">❌ 연결되지 않음</span>
                                )}
                              </div>
                              {isConnected && accountInfo && (
                                <div className="social-account-details">
                                  <div className="social-account-email-info">
                                    {accountInfo.providerEmail && `이메일: ${accountInfo.providerEmail}`}
                                    {accountInfo.providerName && ` | 이름: ${accountInfo.providerName}`}
                                  </div>
                                  <div className="social-account-date-info">
                                    연결일: {formatToKST(accountInfo.createdAt).substring(0, 10)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="social-account-actions">
                            {isConnected ? (
                              <>
                                {accountInfo.providerProfileImage && (
                                  <button
                                    className="btn-small btn-outline btn-sync-profile"
                                    onClick={() => syncProfileImage(provider.name)}
                                  >
                                    프로필 동기화
                                  </button>
                                )}
                                <button
                                  className="btn-small btn-danger"
                                  onClick={() => disconnectSocialAccount(provider.name)}
                                >
                                  연결 해제
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn-small btn-primary"
                                onClick={() => connectSocialAccount(provider.name)}
                              >
                                {provider.displayName} 연결
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="social-accounts-notice">
                  <h4 className="social-notice-title">📌 소셜 계정 연동 안내</h4>
                  <ul className="social-notice-list">
                    <li>소셜 계정을 연결하면 해당 계정으로 간편 로그인이 가능합니다.</li>
                    <li>프로필 이미지를 소셜 계정에서 동기화할 수 있습니다.</li>
                    <li>소셜 로그인으로만 가입한 경우, 마지막 계정은 해제할 수 없습니다.</li>
                    <li>계정 해제 후에도 기존 활동 내역은 유지됩니다.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>
      </AdLayout>
      <Footer />
    </>
  );
};

// 페이지네이션 컴포넌트
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { currentPage, totalPages } = pagination;

  // 페이지 번호 배열 생성 (최대 5개 페이지 표시)
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handlePageClick = (page, e) => {
    e.preventDefault();
    if (page >= 0 && page < totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="news-mypage-pagination">
      {/* 이전 버튼 */}
      <a
        href="#"
        className={`news-mypage-page-btn ${currentPage === 0 ? 'disabled' : ''}`}
        onClick={(e) => handlePageClick(currentPage - 1, e)}
      >
        이전
      </a>

      {/* 페이지 번호들 */}
      {getPageNumbers().map(page => (
        <a
          key={page}
          href="#"
          className={`news-mypage-page-btn ${currentPage === page ? 'current' : ''}`}
          onClick={(e) => handlePageClick(page, e)}
        >
          {page + 1}
        </a>
      ))}

      {/* 다음 버튼 */}
      <a
        href="#"
        className={`news-mypage-page-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
        onClick={(e) => handlePageClick(currentPage + 1, e)}
      >
        다음
      </a>
    </div>
  );
};

export default FactlabMypage;