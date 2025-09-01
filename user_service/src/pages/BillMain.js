
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Bill.css';
import '../styles/Common.css';

const BillMain = () => {
    // Mock data - replace with API calls
    const stats = {
        pending: 128,
        passed: 15,
        
    };

    const topIssues = [
        { id: 1, keyword: '#부동산세' },
        { id: 2, keyword: '#상속세' },
        { id: 3, keyword: '#양도세' },
        { id: 4, keyword: '#종부세' },
        { id: 5, keyword: '#금투세' },
    ];

    const importantBills = [
        { id: 1, title: '소득세법 일부개정법률안', proposer: '김동연 의원', party: '더불어민주당', proposedDate: '2024-12-15', profileImage: '/images/politicians/김동연.jpg' },
        { id: 2, title: '상속세 및 증여세법 일부개정법률안', proposer: '추경호 의원', party: '국민의힘', proposedDate: '2024-12-10', profileImage: '/images/politicians/추경호.jpg' },
        { id: 3, title: '조세특례제한법 일부개정법률안', proposer: '박상혁 의원', party: '더불어민주당', proposedDate: '2024-12-08', profileImage: '/images/politicians/박상혁.jpg' },
    ];

    const mediaAttentionBills = [
        { id: 1, title: '고준위 방사성폐기물 관리 및 유치지역 지원에 관한 특별법안', proposer: '이인선 의원', party: '더불어민주당', proposedDate: '2024-12-20', profileImage: '/images/politicians/이인선.jpg' },
        { id: 2, title: '중대재해 처벌 등에 관한 법률 일부개정법률안', proposer: '조정훈 의원', party: '더불어민주당', proposedDate: '2024-12-18', profileImage: '/images/politicians/조정훈.jpg' },
        { id: 3, title: '청년기본법 일부개정법률안', proposer: '김성원 의원', party: '국민의힘', proposedDate: '2024-12-12', profileImage: '/images/politicians/김성원.jpg' },
    ];

    const hiddenBills = [
        { id: 1, title: '장애인고용촉진 및 직업재활법 일부개정법률안', proposer: '김예지 의원', party: '국민의힘', proposedDate: '2024-12-05', profileImage: '/images/politicians/김예지.jpg' },
        { id: 2, title: '대중소기업 상생협력 촉진에 관한 법률 일부개정법률안', proposer: '오기형 의원', party: '더불어민주당', proposedDate: '2024-12-03', profileImage: '/images/politicians/오기형.jpg' },
        { id: 3, title: '지방자치분권 및 지역균형발전에 관한 특별법 일부개정법률안', proposer: '한병도 의원', party: '더불어민주당', proposedDate: '2024-12-01', profileImage: '/images/politicians/한병도.jpg' },
    ];

    return (
        <>
            <Header />
            <div className="main-top-banner-ad">
                🎯 상단 배너 광고 영역 (1200px x 90px)
            </div>
            <div className="main-container">
                {/* 좌측 광고 */}
                <div className="main-side-ad">
                    
                </div>
                {/* 메인 컨텐츠 */}
                <div className="main-content">
                    <div className="bill-main-page">
                        <main className="bill-container">
                <section className="bill-header-section">
                    <h1>한눈에 보는 국회 상황</h1>
                    <div className="bill-stats-overview">
                        <div className="stat-item">
                            <span className="stat-value">{stats.pending}</span>
                            <span className="stat-label">현재 계류 중인 법안 수</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.passed}</span>
                            <span className="stat-label">최근 통과된 법안 수</span>
                        </div>
                    </div>
                </section>

                <section className="bill-section">
                    <h2>핵심 이슈 TOP 5 키워드</h2>
                    <div className="bill-keywords-container">
                        {topIssues.map(issue => (
                            <div key={issue.id} className="bill-keyword-card">
                                {issue.keyword}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bill-section">
                    <h2>이슈성 많은 법안</h2>
                    <div className="bill-list-container">
                        {mediaAttentionBills.map(bill => (
                            <div key={bill.id} className="bill-card-item">
                                <div className="bill-card-header">
                                    <h3>{bill.title}</h3>
                                </div>
                                <div className="bill-proposer-section">
                                    <div className="proposer-profile">
                                        <img 
                                            src={bill.profileImage} 
                                            alt={bill.proposer}
                                            className="proposer-thumbnail"
                                            onError={(e) => {
                                                e.target.src = '/images/politicians/default-profile.svg';
                                            }}
                                        />
                                        <div className="proposer-info">
                                            <span className="proposer-name">{bill.proposer}</span>
                                            <span className={`proposer-party ${bill.party === '더불어민주당' ? 'democratic' : bill.party === '국민의힘' ? 'people-power' : ''}`}>
                                                {bill.party}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bill-card-footer">
                                    <span className="bill-proposed-date">{bill.proposedDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bill-section">
                    <h2>영향도 높은 법안</h2>
                    <div className="bill-list-container">
                        {importantBills.map(bill => (
                            <div key={bill.id} className="bill-card-item">
                                <div className="bill-card-header">
                                    <h3>{bill.title}</h3>
                                </div>
                                <div className="bill-proposer-section">
                                    <div className="proposer-profile">
                                        <img 
                                            src={bill.profileImage} 
                                            alt={bill.proposer}
                                            className="proposer-thumbnail"
                                            onError={(e) => {
                                                e.target.src = '/images/politicians/default-profile.svg';
                                            }}
                                        />
                                        <div className="proposer-info">
                                            <span className="proposer-name">{bill.proposer}</span>
                                            <span className={`proposer-party ${bill.party === '더불어민주당' ? 'democratic' : bill.party === '국민의힘' ? 'people-power' : ''}`}>
                                                {bill.party}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bill-card-footer">
                                    <span className="bill-proposed-date">{bill.proposedDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bill-section">
                    <h2>사람들은 모르지만 중요한 법안</h2>
                    <div className="bill-list-container">
                        {hiddenBills.map(bill => (
                            <div key={bill.id} className="bill-card-item">
                                <div className="bill-card-header">
                                    <h3>{bill.title}</h3>
                                </div>
                                <div className="bill-proposer-section">
                                    <div className="proposer-profile">
                                        <img 
                                            src={bill.profileImage} 
                                            alt={bill.proposer}
                                            className="proposer-thumbnail"
                                            onError={(e) => {
                                                e.target.src = '/images/politicians/default-profile.svg';
                                            }}
                                        />
                                        <div className="proposer-info">
                                            <span className="proposer-name">{bill.proposer}</span>
                                            <span className={`proposer-party ${bill.party === '더불어민주당' ? 'democratic' : bill.party === '국민의힘' ? 'people-power' : ''}`}>
                                                {bill.party}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bill-card-footer">
                                    <span className="bill-proposed-date">{bill.proposedDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                        </main>
                    </div>
                </div>
                {/* 우측 광고 */}
                <div className="main-side-ad">
                    
                </div>
            </div>
            <Footer />
        </>
    );
};

export default BillMain;
