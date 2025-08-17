import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { commentApi } from '../services/commentApi';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Common.css';
import '../styles/News.css';
import '../styles/Mypage.css';

const FactlabMypage = () => {
  const [activeSection, setActiveSection] = useState('posts');
  const [profileData, setProfileData] = useState({
    nickname: '사용자닉네임',
    email: 'user@example.com',
    intro: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 프로필 이미지 상태 관리
  const [profileImage, setProfileImage] = useState(null);
  
  // 사용자 댓글 상태 관리
  const [userComments, setUserComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // 레벨 애니메이션
    const levelProgress = document.querySelector('.news-mypage-level-progress');
    if (levelProgress) {
      levelProgress.style.width = '0%';
      setTimeout(() => {
        levelProgress.style.width = '65%';
      }, 500);
    }
  }, []);

  // 사용자 댓글 로드
  useEffect(() => {
    const loadUserComments = async () => {
      if (!user?.id) return;
      
      setCommentsLoading(true);
      try {
        const comments = await commentApi.getUserComments(user.id);
        setUserComments(comments);
      } catch (error) {
        console.error('사용자 댓글 로드 오류:', error);
        setUserComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (activeSection === 'comments') {
      loadUserComments();
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
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage(e.target.result);
        };
        reader.readAsDataURL(file);
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
  const saveProfile = () => {
    if (!profileData.nickname.trim()) {
      alert('닉네임을 입력하세요.');
      return;
    }
    
    // 실제로는 서버에 저장하는 API 호출
    console.log('프로필이 저장되었습니다.');
    console.log('프로필 저장:', { ...profileData, profileImage });
  };

  // 폼 초기화 핸들러
  const resetForm = () => {
    if (window.confirm('변경사항이 취소됩니다. 계속하시겠습니까?')) {
      window.location.reload();
    }
  };

  return (
    <>
      <Header />
      <div className="news-container">
        <div className="news-page-header">
          <div className="news-page-header-title">👤 마이페이지</div>
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
                  className="news-mypage-profile-image" 
                  onClick={changeProfileImage}
                  style={profileImage ? { backgroundImage: `url(${profileImage})`, textContent: '' } : {}}
                >
                  {!profileImage && '👤'}
                </div>
                <div className="news-mypage-profile-info">
                  <div className="news-mypage-profile-name">{profileData.nickname}</div>
                  <div className="news-mypage-profile-stats">
                    <span>가입일: 2024-06-01</span>
                    <span>최근 접속: 2024-07-09 18:30</span>
                  </div>
                  <div className="news-mypage-level-info">
                    <div>레벨 5 - 활발한 토론자 (활동점수: 1,350점)</div>
                    <div className="news-mypage-level-bar">
                      <div className="news-mypage-level-progress"></div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                      다음 레벨까지 150점 남음
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 style={{ marginBottom: '15px' }}>프로필 정보 수정</h3>
              
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
                <label className="news-mypage-form-label">닉네임</label>
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
                <label className="news-mypage-form-label">자기소개</label>
                <textarea 
                  className="news-mypage-form-input" 
                  name="intro"
                  value={profileData.intro}
                  onChange={handleInputChange}
                  style={{ height: '80px', resize: 'vertical' }} 
                  placeholder="간단한 자기소개를 입력하세요"
                ></textarea>
              </div>
              
              <div className="news-mypage-form-group">
                <label className="news-mypage-form-label">비밀번호 변경</label>
                <input 
                  type="password" 
                  className="news-mypage-form-input" 
                  name="currentPassword"
                  value={profileData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="현재 비밀번호" 
                  style={{ marginBottom: '5px' }}
                />
                <input 
                  type="password" 
                  className="news-mypage-form-input" 
                  name="newPassword"
                  value={profileData.newPassword}
                  onChange={handleInputChange}
                  placeholder="새 비밀번호" 
                  style={{ marginBottom: '5px' }}
                />
                <input 
                  type="password" 
                  className="news-mypage-form-input" 
                  name="confirmPassword"
                  value={profileData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="새 비밀번호 확인"
                />
              </div>
              
              <div>
                <button className="news-btn news-btn-primary" onClick={saveProfile}>저장</button>
                <button className="news-btn" onClick={resetForm}>취소</button>
              </div>
            </div>
            
            {/* Posts Section */}
            <div className={`news-mypage-activity-section ${activeSection === 'posts' ? 'active' : ''}`}>
              <h3 style={{ marginBottom: '15px' }}>작성한 게시글 (총 23개)</h3>
              
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
                  <tr>
                    <td>23</td>
                    <td><Link to="/board/view/1234" className="news-mypage-activity-title">새로운 정부 정책에 대한 여러분의 의견은?</Link></td>
                    <td>정치토론</td>
                    <td>2,156</td>
                    <td>67</td>
                    <td>07-09</td>
                  </tr>
                  <tr>
                    <td>22</td>
                    <td><Link to="/board/view/1220" className="news-mypage-activity-title">AI 기술의 윤리적 문제점들</Link></td>
                    <td>과학기술</td>
                    <td>890</td>
                    <td>34</td>
                    <td>07-08</td>
                  </tr>
                  <tr>
                    <td>21</td>
                    <td><Link to="/board/view/1205" className="news-mypage-activity-title">부동산 정책 변화가 미치는 영향</Link></td>
                    <td>경제뉴스</td>
                    <td>1,234</td>
                    <td>89</td>
                    <td>07-07</td>
                  </tr>
                  <tr>
                    <td>20</td>
                    <td><Link to="/board/view/1198" className="news-mypage-activity-title">교육 제도 개선 방안에 대해</Link></td>
                    <td>사회이슈</td>
                    <td>567</td>
                    <td>23</td>
                    <td>07-06</td>
                  </tr>
                  <tr>
                    <td>19</td>
                    <td><Link to="/board/view/1187" className="news-mypage-activity-title">환경 보호를 위한 개인의 역할</Link></td>
                    <td>사회이슈</td>
                    <td>432</td>
                    <td>15</td>
                    <td>07-05</td>
                  </tr>
                </tbody>
              </table>
              
              <Pagination />
            </div>
            
            {/* Comments Section */}
            <div className={`news-mypage-activity-section ${activeSection === 'comments' ? 'active' : ''}`}>
              <h3 style={{ marginBottom: '15px' }}>작성한 댓글 (총 {userComments.length}개)</h3>
              
              {commentsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>댓글을 불러오는 중...</div>
              ) : userComments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>작성한 댓글이 없습니다.</div>
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
                          <td>{userComments.length - index}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {comment.content}
                          </td>
                          <td>
                            <Link to={`/news/detail?id=${comment.newsId}`} className="news-mypage-activity-title">
                              {comment.newsTitle || '뉴스 제목'}
                            </Link>
                          </td>
                          <td>{comment.likes || 0}</td>
                          <td>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit'
                          }) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination />
                </>
              )}
            </div>
            
            {/* Likes Section */}
            <div className={`news-mypage-activity-section ${activeSection === 'likes' ? 'active' : ''}`}>
              <h3 style={{ marginBottom: '15px' }}>좋아요 표시한 글 (총 89개)</h3>
              
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
                  <tr>
                    <td>89</td>
                    <td><Link to="/board/view/1245" className="news-mypage-activity-title">클라이밍 초보자를 위한 가이드</Link></td>
                    <td>클라이머</td>
                    <td>문화생활</td>
                    <td>07-09</td>
                  </tr>
                  <tr>
                    <td>88</td>
                    <td><Link to="/board/view/1240" className="news-mypage-activity-title">경제 정책의 실효성 분석</Link></td>
                    <td>경제분석가</td>
                    <td>경제뉴스</td>
                    <td>07-08</td>
                  </tr>
                  <tr>
                    <td>87</td>
                    <td><Link to="/board/view/1235" className="news-mypage-activity-title">환경 보호의 중요성</Link></td>
                    <td>환경운동가</td>
                    <td>사회이슈</td>
                    <td>07-07</td>
                  </tr>
                </tbody>
              </table>
              
              <Pagination />
            </div>
            
            {/* Votes Section */}
            <div className={`news-mypage-activity-section ${activeSection === 'votes' ? 'active' : ''}`}>
              <h3 style={{ marginBottom: '15px' }}>투표 기록 (총 45개)</h3>
              
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
                  <tr>
                    <td>45</td>
                    <td><Link to="/news/detail/1" className="news-mypage-activity-title">AI 기술 발전으로 일자리 30% 감소 예상</Link></td>
                    <td><span style={{ color: '#009900' }}>✅ 사실</span></td>
                    <td>07-09</td>
                  </tr>
                  <tr>
                    <td>44</td>
                    <td><Link to="/news/detail/2" className="news-mypage-activity-title">정부 부동산 규제 완화로 집값 10% 하락 전망</Link></td>
                    <td><span style={{ color: '#cc0000' }}>❌ 의심</span></td>
                    <td>07-08</td>
                  </tr>
                  <tr>
                    <td>43</td>
                    <td><Link to="/news/detail/3" className="news-mypage-activity-title">새로운 백신 개발, 효과 95% 입증</Link></td>
                    <td><span style={{ color: '#ff6600' }}>⚠️ 부분사실</span></td>
                    <td>07-07</td>
                  </tr>
                </tbody>
              </table>
              
              <Pagination />
            </div>
            
            {/* Stats Section */}
            <div className={`news-mypage-activity-section ${activeSection === 'stats' ? 'active' : ''}`}>
              <h3 style={{ marginBottom: '15px' }}>활동 통계</h3>
              
              <div className="news-mypage-stats-grid">
                <div className="news-mypage-stat-card">
                  <div className="news-mypage-stat-number">1,350</div>
                  <div className="news-mypage-stat-label">총 활동점수</div>
                </div>
                <div className="news-mypage-stat-card">
                  <div className="news-mypage-stat-number">23</div>
                  <div className="news-mypage-stat-label">작성한 글</div>
                </div>
                <div className="news-mypage-stat-card">
                  <div className="news-mypage-stat-number">156</div>
                  <div className="news-mypage-stat-label">작성한 댓글</div>
                </div>
                <div className="news-mypage-stat-card">
                  <div className="news-mypage-stat-number">89</div>
                  <div className="news-mypage-stat-label">받은 좋아요</div>
                </div>
                <div className="news-mypage-stat-card">
                  <div className="news-mypage-stat-number">45</div>
                  <div className="news-mypage-stat-label">뉴스 투표 참여</div>
                </div>
                <div className="news-mypage-stat-card">
                  <div className="news-mypage-stat-number">레벨 5</div>
                  <div className="news-mypage-stat-label">현재 레벨</div>
                </div>
              </div>
              
              <div className="news-mypage-chart-container">
                <h4 style={{ marginBottom: '10px' }}>월별 활동 통계</h4>
                <div className="news-mypage-chart-placeholder">
                  📊 활동 통계 차트<br />
                  <small>(실제 구현 시 Chart.js 등 사용)</small>
                </div>
              </div>
              
              <div className="news-mypage-chart-container">
                <h4 style={{ marginBottom: '10px' }}>카테고리별 활동 분포</h4>
                <div className="news-mypage-chart-placeholder">
                  🥧 카테고리 분포 차트<br />
                  <small>(정치: 35%, 경제: 25%, 사회: 20%, 기타: 20%)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

// 페이지네이션 컴포넌트
const Pagination = () => {
  return (
    <div className="news-mypage-pagination">
      <a href="#" className="news-mypage-page-btn">이전</a>
      <a href="#" className="news-mypage-page-btn current">1</a>
      <a href="#" className="news-mypage-page-btn">2</a>
      <a href="#" className="news-mypage-page-btn">3</a>
      <a href="#" className="news-mypage-page-btn">다음</a>
    </div>
  );
};

export default FactlabMypage;