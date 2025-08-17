import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/About.css';

const FactlabAbout = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [openFAQ, setOpenFAQ] = useState(null);

  // 탭 데이터
  const tabs = [
    { id: 'about', label: '소개' },
    { id: 'how-it-works', label: '이용방법' },
    { id: 'levels', label: '레벨시스템' },
    { id: 'guidelines', label: '가이드라인' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: '문의' }
  ];

  // FAQ 데이터
  const faqData = [
    {
      question: 'Q. FactLab은 무료로 이용할 수 있나요?',
      answer: '네, FactLab의 모든 기능은 무료로 이용 가능합니다. 회원가입만 하시면 모든 서비스를 자유롭게 사용하실 수 있습니다.'
    },
    {
      question: 'Q. AI가 수집하는 뉴스는 어떤 기준으로 선별되나요?',
      answer: 'AI는 주요 포털사이트(네이버, 다음)와 트위터 트렌드를 기반으로 실시간 이슈성 뉴스를 수집합니다. 정치, 경제, 사회, 과학기술 등 다양한 분야에서 화제가 되는 뉴스들을 자동으로 분석하고 요약합니다.'
    },
    {
      question: 'Q. 투표 결과는 어떻게 활용되나요?',
      answer: '사용자들의 투표 결과는 뉴스의 신뢰도 지표로 활용됩니다. 많은 사용자가 참여할수록 더 정확한 집단지성의 결과를 얻을 수 있으며, 이는 다른 사용자들이 뉴스를 판단하는 데 도움이 됩니다.'
    },
    {
      question: 'Q. 레벨은 어떻게 올릴 수 있나요?',
      answer: '게시글 작성, 댓글 작성, 뉴스 투표 참여, 추천 받기 등의 활동을 통해 활동 점수를 획득할 수 있습니다. 활동 점수가 누적되면 자동으로 레벨이 상승하며, 높은 레벨일수록 더 많은 권한을 얻게 됩니다.'
    },
    {
      question: 'Q. 부적절한 게시물이나 댓글은 어떻게 신고하나요?',
      answer: '각 게시물과 댓글에 있는 \'신고\' 버튼을 클릭하거나, 고객센터의 \'신고하기\' 메뉴를 이용하세요. 신고 내용은 관리자가 검토한 후 적절한 조치를 취합니다.'
    },
    {
      question: 'Q. 계정을 삭제하고 싶어요.',
      answer: '마이페이지 > 설정에서 계정 삭제를 신청할 수 있습니다. 단, 계정 삭제 시 작성한 게시물과 댓글, 활동 기록이 모두 삭제되며 복구가 불가능합니다.'
    },
    {
      question: 'Q. 팩트체크 전문 기관과는 어떻게 연동되나요?',
      answer: 'SNU 팩트체크센터, 뉴스톱 등 공신력 있는 팩트체크 기관의 검증 결과를 API로 연동하여 관련 뉴스에 전문적인 팩트체크 정보를 제공합니다.'
    }
  ];

  // 레벨 데이터
  const levelData = [
    { level: 1, name: '새내기', points: '0 ~ 99', permissions: '댓글 작성, 투표 참여' },
    { level: 2, name: '일반회원', points: '100 ~ 299', permissions: '게시글 작성, 이미지 업로드' },
    { level: 3, name: '활동회원', points: '300 ~ 599', permissions: '게시판 생성 제안' },
    { level: 4, name: '우수회원', points: '600 ~ 999', permissions: '신고 처리 참여' },
    { level: 5, name: '활발한 토론자', points: '1000 ~ 1999', permissions: '추천 게시글 선정 참여' },
    { level: 6, name: '팩트체커', points: '2000 ~ 3999', permissions: '팩트체크 작성 권한' },
    { level: 7, name: '전문가', points: '4000+', permissions: '전문가 표시, 가중 투표' }
  ];

  // 가이드라인 데이터
  const guidelines = [
    { icon: '🤝', title: '상호 존중', desc: '다른 사용자의 의견을 존중하고, 인신공격이나 모독적 언어 사용을 금합니다.' },
    { icon: '📰', title: '사실 기반 토론', desc: '근거 없는 추측이나 루머가 아닌 사실에 기반한 토론을 지향합니다.' },
    { icon: '🚫', title: '혐오 표현 금지', desc: '특정 집단에 대한 차별, 혐오, 비하 발언은 엄격히 금지됩니다.' },
    { icon: '🔒', title: '개인정보 보호', desc: '타인의 개인정보나 사생활을 공개하거나 침해하는 행위를 금합니다.' },
    { icon: '📢', title: '스팸 금지', desc: '반복적인 광고, 도배, 무의미한 게시물 작성을 금합니다.' },
    { icon: '⚖️', title: '정치적 중립', desc: '특정 정치적 성향을 강요하거나 정치적 목적의 활동을 금합니다.' },
    { icon: '🎯', title: '주제 관련성', desc: '게시판의 주제와 관련 없는 내용의 게시를 자제해주세요.' },
    { icon: '📄', title: '저작권 준수', desc: '타인의 저작물을 무단으로 복제하거나 도용하는 행위를 금합니다.' }
  ];

  // 탭 변경
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // FAQ 토글
  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <>
      <Header />
      
      <div className="news-container">
        {/* Page Header */}
        <div className="news-page-header">
          <div className="news-page-header-title">🔍 FactLab</div>
          <div className="news-page-header-subtitle">AI와 커뮤니티가 함께 만드는 팩트체크 플랫폼</div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="news-about-nav-tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`news-about-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        
        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="news-about-tab-content active">
            <div className="news-about-content-section">
              <div className="news-about-section-title">🎯 FactLab의 목표</div>
              <div className="news-about-section-content">
                <p><strong>FactLab</strong>은 AI 기술과 커뮤니티의 집단지성을 결합하여 뉴스의 신뢰성을 검증하는 플랫폼입니다.</p>
                <p>우리의 목표는 다음과 같습니다:</p>
                <ul>
                  <li>실시간 이슈 뉴스 수집 및 자동 요약</li>
                  <li>사용자들의 자유로운 토론과 의견 개진</li>
                  <li>건전한 커뮤니티 문화 조성</li>
                  <li>국내 최대 팩트체크 커뮤니티 구축</li>
                </ul>
              </div>
            </div>
            
            <div className="news-about-content-section">
              <div className="news-about-section-title">✨ 주요 기능</div>
              <div className="news-about-feature-grid">
                <div className="news-about-feature-card">
                  <div className="news-about-feature-icon">🤖</div>
                  <div className="news-about-feature-title">AI 뉴스 수집</div>
                  <div className="news-about-feature-desc">
                    네이버, 다음 등 주요 포털에서 실시간으로 이슈성 뉴스를 수집하고 요약합니다.
                  </div>
                </div>
                
                <div className="news-about-feature-card">
                  <div className="news-about-feature-icon">💬</div>
                  <div className="news-about-feature-title">커뮤니티 토론</div>
                  <div className="news-about-feature-desc">
                    자유로운 게시판에서 뉴스와 이슈에 대해 건설적인 토론을 나눌 수 있습니다.
                  </div>
                </div>
                
                <div className="news-about-feature-card">
                  <div className="news-about-feature-icon">🗳️</div>
                  <div className="news-about-feature-title">신뢰도 투표</div>
                  <div className="news-about-feature-desc">
                    뉴스의 사실 여부에 대해 투표하고 집단지성으로 신뢰도를 판단합니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* How It Works Tab */}
        {activeTab === 'how-it-works' && (
          <div className="news-about-tab-content active">
            <div className="news-about-content-section">
              <div className="news-about-section-title">📖 이용 방법</div>
              <div className="news-about-process-steps">
                <div className="news-about-step-item">
                  <div className="news-about-step-number">1</div>
                  <div className="news-about-step-content">
                    <div className="news-about-step-title">회원가입 및 로그인</div>
                    <div className="news-about-step-desc">
                      이메일 또는 소셜 로그인(Google, 네이버, 카카오)으로 간편하게 가입하세요.
                      가입 시 닉네임을 설정하고 이메일 인증을 완료해주세요.
                    </div>
                  </div>
                </div>
                
                <div className="news-about-step-item">
                  <div className="news-about-step-number">2</div>
                  <div className="news-about-step-content">
                    <div className="news-about-step-title">뉴스 확인 및 투표</div>
                    <div className="news-about-step-desc">
                      AI가 수집한 실시간 이슈 뉴스를 확인하고, "사실/의심/부분사실/정보부족" 중 하나를 선택하여 투표하세요.
                      투표는 뉴스의 신뢰도 판단에 중요한 역할을 합니다.
                    </div>
                  </div>
                </div>
                
                <div className="news-about-step-item">
                  <div className="news-about-step-number">3</div>
                  <div className="news-about-step-content">
                    <div className="news-about-step-title">토론 참여</div>
                    <div className="news-about-step-desc">
                      뉴스나 게시판에서 댓글을 작성하고 다른 사용자들과 건설적인 토론을 나누세요.
                      대댓글 기능으로 심도 있는 대화가 가능합니다.
                    </div>
                  </div>
                </div>
                
                <div className="news-about-step-item">
                  <div className="news-about-step-number">4</div>
                  <div className="news-about-step-content">
                    <div className="news-about-step-title">게시글 작성</div>
                    <div className="news-about-step-desc">
                      자유게시판에서 직접 게시글을 작성하거나 뉴스를 공유하며 의견을 개진할 수 있습니다.
                      이미지 첨부와 태그 기능을 활용해보세요.
                    </div>
                  </div>
                </div>
                
                <div className="news-about-step-item">
                  <div className="news-about-step-number">5</div>
                  <div className="news-about-step-content">
                    <div className="news-about-step-title">활동 점수 획득</div>
                    <div className="news-about-step-desc">
                      게시글 작성, 댓글 작성, 투표 참여 등의 활동으로 점수를 획득하고 레벨을 올려보세요.
                      높은 레벨일수록 더 많은 기능을 이용할 수 있습니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Levels Tab */}
        {activeTab === 'levels' && (
          <div className="news-about-tab-content active">
            <div className="news-about-content-section">
              <div className="news-about-section-title">🏆 레벨 시스템</div>
              <div className="news-about-section-content">
                <p>FactLab에서는 사용자의 활동에 따라 레벨과 활동 점수가 부여됩니다. 높은 레벨일수록 더 많은 권한과 기능을 이용할 수 있습니다.</p>
                
                <table className="news-about-level-table">
                  <thead>
                    <tr>
                      <th>레벨</th>
                      <th>이름</th>
                      <th>필요 점수</th>
                      <th>권한</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelData.map((level) => (
                      <tr key={level.level}>
                        <td>{level.level}</td>
                        <td className="news-about-level-name">{level.name}</td>
                        <td>{level.points}</td>
                        <td>{level.permissions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <h4 style={{margin: '20px 0 10px 0', color: '#333'}}>활동 점수 산정 방법</h4>
                <ul style={{marginLeft: '20px', color: '#333'}}>
                  <li>게시글 작성: +10점</li>
                  <li>댓글 작성: +3점</li>
                  <li>뉴스 투표 참여: +2점</li>
                  <li>추천 받기: +5점</li>
                  <li>좋은 팩트체크 작성: +20점</li>
                  <li>부정 행위 시: -10점</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Guidelines Tab */}
        {activeTab === 'guidelines' && (
          <div className="news-about-tab-content active">
            <div className="news-about-content-section">
              <div className="news-about-section-title">📋 커뮤니티 가이드라인</div>
              <div className="news-about-section-content">
                <p>FactLab은 건전하고 생산적인 토론 문화를 위해 다음과 같은 가이드라인을 운영합니다:</p>
                
                <ul className="news-about-guidelines-list">
                  {guidelines.map((guideline, index) => (
                    <li key={index}>
                      <div className="news-about-guideline-title">
                        {guideline.icon} {guideline.title}
                      </div>
                      {guideline.desc}
                    </li>
                  ))}
                </ul>
                
                <p style={{marginTop: '20px', fontWeight: 'bold', color: '#333'}}>
                  가이드라인 위반 시 경고, 게시물 삭제, 계정 정지 등의 조치가 취해질 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="news-about-tab-content active">
            <div className="news-about-content-section">
              <div className="news-about-section-title">❓ 자주 묻는 질문</div>
              
              {faqData.map((faq, index) => (
                <div key={index} className="news-about-faq-item">
                  <div 
                    className="news-about-faq-question" 
                    onClick={() => toggleFAQ(index)}
                  >
                    {faq.question}
                  </div>
                  <div className={`news-about-faq-answer ${openFAQ === index ? 'active' : ''}`}>
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="news-about-tab-content active">
            <div className="news-about-content-section">
              <div className="news-about-section-title">📞 문의하기</div>
              <div className="news-about-section-content">
                <p>FactLab 이용 중 궁금한 점이나 문제가 있으시면 언제든지 문의해주세요.</p>
                
                <div className="news-about-contact-info">
                  <div className="news-about-contact-item">
                    <div className="news-about-contact-label">이메일:</div>
                    <div>support@factlab.com</div>
                  </div>
                  
                  <div className="news-about-contact-item">
                    <div className="news-about-contact-label">운영시간:</div>
                    <div>평일 09:00 ~ 18:00 (주말, 공휴일 제외)</div>
                  </div>
                  
                  <div className="news-about-contact-item">
                    <div className="news-about-contact-label">응답시간:</div>
                    <div>영업일 기준 24시간 이내</div>
                  </div>
                  
                  <div className="news-about-contact-item">
                    <div className="news-about-contact-label">주요 문의:</div>
                    <div>기술 문제, 계정 문의, 신고 처리, 제휴 문의</div>
                  </div>
                </div>
                
                <h4 style={{margin: '20px 0 10px 0', color: '#333'}}>📧 빠른 문의</h4>
                <p>아래 양식을 작성하시면 더욱 빠른 답변을 받으실 수 있습니다:</p>
                
                <div style={{marginTop: '15px', padding: '15px', backgroundColor: '#f8f8f8', border: '1px solid #ddd', borderRadius: '0.375rem'}}>
                  <div style={{marginBottom: '10px', color: '#333'}}>
                    <strong>제목:</strong> [문의유형] 간단한 제목<br />
                    <strong>내용:</strong><br />
                    - 문의 내용 상세 기술<br />
                    - 발생 시간 및 상황<br />
                    - 사용 환경 (브라우저, 기기 등)<br />
                    - 연락처 (선택)
                  </div>
                  
                  <div style={{textAlign: 'center', marginTop: '15px'}}>
                    <a href="mailto:support@factlab.com" className="news-btn news-btn-primary">
                      이메일로 문의하기
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default FactlabAbout;