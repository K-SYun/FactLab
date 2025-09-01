
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Vote from '../components/Vote';
import Comment from '../components/Comment';
import '../styles/Bill.css';
import '../styles/Common.css';

const BillDetail = () => {
    const { billId } = useParams();

    // Mock data - replace with API call to fetch bill by ID
    const bill = {
        id: billId,
        title: '소득세법 일부개정법률안',
        proposer: '김동연',
        party: '더불어민주당',
        proposedDate: '2024-08-01',
        status: '계류',
        summary: 'AI가 요약한 법안 내용입니다. 이 법안은 종합부동산세와 소득세법을 개정하여 부동산 시장의 안정을 도모하고, 서민 주거 부담을 완화하는 것을 주요 목적으로 합니다. 다주택자에 대한 과세를 강화하고, 1주택 장기보유자에 대한 세금 감면 혜택을 확대하는 내용이 포함되어 있습니다.',
        fullText: `
제안이유 및 주요내용

현행법은 거주자가 주택을 양도하는 경우 양도소득세를 과세하고 있으며, 특히 2년 미만 단기 보유 주택이나 다주택자에 대해서는 중과세율을 적용하고 있음.

그러나, 부동산 시장의 급격한 변동에 따라 단기 보유 주택에 대한 양도소득세 부담이 과도하다는 지적이 있으며, 다주택자 중과세 제도가 오히려 매물 잠김 현상을 유발하여 부동산 시장의 불안정성을 심화시킨다는 비판이 제기되고 있음.

이에 단기 보유 주택에 대한 양도소득세율을 인하하고, 다주택자 중과세 제도를 합리적으로 조정하여 부동산 시장의 거래를 활성화하고 가격 안정을 도모하려는 것임(안 제104조).

주요내용

가. 1년 미만 보유 주택 양도소득세율을 현행 70%에서 45%로 인하함.
나. 1년 이상 2년 미만 보유 주택 양도소득세율을 현행 60%에서 기본세율로 인하함.
다. 조정대상지역 다주택자에게 적용되는 양도소득세 중과를 폐지하고 기본세율을 적용함.
`,
        originalLink: 'https://likms.assembly.go.kr/bill/billDetail.do?billId=PRC_R2J4K0N6X1Y5Z1X9V4B4Z3X8Y7Z7X6'
    };

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
                    <div className="bill-detail-page">
                        <div className="bill-detail-header">
                            <h1><span className={`bill-status-tag ${bill.status}`}>{bill.status}</span> {bill.title}</h1>
                            <div className="bill-detail-meta">
                                <span><strong>발의자:</strong> {bill.proposer} ({bill.party})</span>
                                <span><strong>발의일:</strong> {bill.proposedDate}</span>
                            </div>
                        </div>

                        <div className="bill-detail-content">
                            <section className="bill-detail-section summary-section">
                                <h2>AI 법안 요약</h2>
                                <p>{bill.summary}</p>
                            </section>

                            <section className="bill-detail-section full-text-section">
                                <h2>주요 내용</h2>
                                <pre>{bill.fullText}</pre>
                            </section>

                            <div className="bill-detail-actions">
                                <a href={bill.originalLink} target="_blank" rel="noopener noreferrer" className="original-link-button">
                                    원문 보러가기
                                </a>
                                <Link to="/bill/list" className="back-to-list-button">
                                    목록으로 돌아가기
                                </Link>
                            </div>
                        </div>

                        <Vote billId={bill.id} />
                        <Comment contentId={bill.id} contentType="bill" />
                    </div>
                </div>
                {/* 우측 광고 */}
                <div className="main-side-ad"></div>
            </div>
            <Footer />
        </>
    );
};

export default BillDetail;
