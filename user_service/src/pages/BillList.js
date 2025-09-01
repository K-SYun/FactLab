
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BillCard from '../components/BillCard';
import '../styles/Bill.css';
import '../styles/Common.css';

const BillList = () => {
    // Mock data - replace with API calls
    const [bills, setBills] = useState([
        { id: 1, title: '소득세법 일부개정법률안', proposer: '김동연', party: '더불어민주당', proposedDate: '2024-08-01', summary: '종합부동산세와 소득세법 개정을 통해 부동산 시장 안정을 도모합니다.', status: '계류', agree: 65, disagree: 35, prediction: '예' },
        { id: 2, title: '상속세 및 증여세법 일부개정법률안', proposer: '추경호', party: '국민의힘', proposedDate: '2024-07-25', summary: '상속세 부담을 완화하여 기업 승계 및 경제 활성화를 지원합니다.', status: '심사중', agree: 55, disagree: 45, prediction: '불투명' },
        { id: 3, title: '고준위 방사성폐기물 관리 및 유치지역 지원에 관한 특별법안', proposer: '이인선', party: '국민의힘', proposedDate: '2024-08-05', summary: '고준위 방사성폐기물의 안전한 관리와 처리 시설 유치 지역에 대한 지원을 규정합니다.', status: '계류', agree: 70, disagree: 30, prediction: '예' },
        { id: 4, title: '장애인고용촉진 및 직업재활법 일부개정법률안', proposer: '김예지', party: '국민의힘', proposedDate: '2024-08-10', summary: '장애인 의무고용률을 상향하고, 고용장려금 제도를 개선하여 장애인 일자리를 확대합니다.', status: '통과', agree: 85, disagree: 15, prediction: '낮음' },
    ]);

    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('latest');

    const handleFilterChange = (e) => setFilter(e.target.value);
    const handleSortChange = (e) => setSort(e.target.value);

    const filteredAndSortedBills = bills
        .filter(bill => filter === 'all' || bill.status === filter)
        .sort((a, b) => {
            if (sort === 'latest') return new Date(b.proposedDate) - new Date(a.proposedDate);
            if (sort === 'popularity') return (b.agree + b.disagree) - (a.agree + a.disagree); // Simplified popularity
            return 0;
        });

    return (
        <>
            <Header />
            <div className="main-top-banner-ad">
                🎯 상단 배너 광고 영역 (1200px x 90px)
            </div>
            <div className="main-container">
                {/* 좌측 광고 */}
                <div className="main-side-ad"></div>
                {/* 메인 컨텐츠 */}
                <div className="main-content">
                    <div className="bill-list-page">
                        <main className="bill-container">
                            <div className="bill-list-header">
                                <h1>법안 목록</h1>
                                <p>국회에 발의된 최신 법안들을 확인하고 의견을 나눠보세요.</p>
                            </div>

                            <div className="bill-list-controls">
                                <div className="bill-filters">
                                    <select onChange={handleFilterChange} value={filter}>
                                        <option value="all">전체</option>
                                        <option value="계류">계류</option>
                                        <option value="심사중">심사중</option>
                                        <option value="통과">통과</option>
                                        <option value="폐기">폐기</option>
                                    </select>
                                </div>
                                <div className="bill-sorts">
                                    <select onChange={handleSortChange} value={sort}>
                                        <option value="latest">최신순</option>
                                        <option value="popularity">인기순</option>
                                        <option value="controversial">논란순</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bill-list-content">
                                {filteredAndSortedBills.map(bill => (
                                    <BillCard key={bill.id} bill={bill} />
                                ))}
                            </div>
                        </main>
                    </div>
                </div>
                {/* 우측 광고 */}
                <div className="main-side-ad"></div>
            </div>
            <Footer />
        </>
    );
};

export default BillList;
