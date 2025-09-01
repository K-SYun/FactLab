import React, { useState, useEffect } from 'react';
import { 
  billApi, 
  BillItem, 
  BILL_CATEGORY_LABELS, 
  APPROVAL_STATUS_LABELS,
  PASSAGE_PROBABILITY_LABELS,
  URGENCY_LEVEL_LABELS,
  PRIORITY_CATEGORY_LABELS,
  ApprovalStatus,
  PriorityCategory
} from '../api/billApi';
import Pagination from '../components/common/Pagination';
import '../styles/BillManagement.css';

interface BillModalProps {
  bill: BillItem | null;
  onClose: () => void;
  onUpdate: () => void;
}

// 법안 상세/승인 모달 컴포넌트
const BillDetailModal: React.FC<BillModalProps> = ({ bill, onClose, onUpdate }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState(bill?.adminNotes || '');
  const [selectedPriority, setSelectedPriority] = useState<PriorityCategory | undefined>(bill?.priorityCategory);

  if (!bill) return null;

  const handleSetStatus = async (status: ApprovalStatus) => {
    if (status === 'APPROVED' && !selectedPriority) {
      alert('우선순위 카테고리를 선택해주세요.');
      return;
    }
    setActionLoading(true);
    try {
      await billApi.setBillApprovalStatus(bill.id, status, selectedPriority);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('승인 상태 변경 실패:', error);
      alert('승인 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAiAnalysis = async () => {
    setActionLoading(true);
    try {
        await billApi.requestAiAnalysis(bill.id);
        onUpdate();
        alert('AI 분석이 요청되었습니다. 잠시 후 상태가 업데이트됩니다.');
    } catch (error) {
        console.error('AI 분석 요청 실패:', error);
        alert('AI 분석 요청에 실패했습니다.');
    } finally {
        setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 법안을 삭제하시겠습니까?')) return;
    
    setActionLoading(true);
    try {
      await billApi.deleteBill(bill.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('법안 삭제 실패:', error);
      alert('법안 삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-bill-modal" onClick={onClose}>
      <div className="admin-bill-modal-content" onClick={e => e.stopPropagation()}>
        <div className="admin-bill-modal-header">
          <h3 className="admin-bill-modal-title">법안 상세 정보</h3>
          <button className="admin-bill-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="admin-bill-modal-body">
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>기본 정보</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <strong>법안번호:</strong> {bill.billNumber}
              </div>
              <div>
                <strong>발의일:</strong> {bill.proposalDate}
              </div>
              <div>
                <strong>발의자:</strong> {bill.proposerName} ({bill.partyName})
              </div>
              <div>
                <strong>소관위원회:</strong> {bill.committee}
              </div>
              <div>
                <strong>카테고리:</strong> 
                <span className="admin-bill-category" style={{ marginLeft: '8px' }}>
                  {BILL_CATEGORY_LABELS[bill.category] || bill.category}
                </span>
              </div>
              <div>
                <strong>현재 상태:</strong> 
                <span className={`admin-bill-status ${bill.approvalStatus.toLowerCase()}`} style={{ marginLeft: '8px' }}>
                  {APPROVAL_STATUS_LABELS[bill.approvalStatus]}
                </span>
              </div>
            </div>
          </div>

          {bill.approvalStatus === 'PENDING' && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>우선순위 카테고리 선택</h4>
                    <select
                        value={selectedPriority}
                        onChange={e => setSelectedPriority(e.target.value as PriorityCategory)}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">선택하세요</option>
                        {Object.entries(PRIORITY_CATEGORY_LABELS).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>법안 제목</h4>
              <p style={{ padding: '12px', background: '#f7fafc', borderRadius: '8px', lineHeight: '1.5' }}>
                {bill.title}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>법안 요약</h4>
              <div style={{ padding: '12px', background: '#f7fafc', borderRadius: '8px', lineHeight: '1.5', maxHeight: '150px', overflowY: 'auto' }}>
                {bill.summary || '요약 정보가 없습니다.'}
              </div>
            </div>

            {bill.aiSummary && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>AI 분석 요약</h4>
                <div style={{ padding: '12px', background: '#e6fffa', borderRadius: '8px', lineHeight: '1.5' }}>
                  {bill.aiSummary}
                </div>
              </div>
            )}

            {bill.aiKeywords && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>키워드</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {bill.aiKeywords.split(',').map((keyword, index) => (
                    <span key={index} style={{ 
                      padding: '4px 8px', 
                      background: '#bee3f8', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      color: '#2a69ac'
                    }}>
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>통과 가능성</div>
                <div className={`admin-bill-probability ${bill.passageProbability}`}>
                  {PASSAGE_PROBABILITY_LABELS[bill.passageProbability] || bill.passageProbability}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>긴급도</div>
                <div className={`admin-bill-urgency ${bill.urgencyLevel}`}>
                  {URGENCY_LEVEL_LABELS[bill.urgencyLevel] || bill.urgencyLevel}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>신뢰도 점수</div>
                <div className={`admin-bill-score ${bill.aiReliabilityScore && bill.aiReliabilityScore >= 70 ? 'high' : bill.aiReliabilityScore && bill.aiReliabilityScore >= 50 ? 'medium' : 'low'}`}>
                  {bill.aiReliabilityScore || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '14px' }}>
              <div>
                <strong>공공 관심도:</strong> {bill.publicInterestScore || 0}
              </div>
              <div>
                <strong>언론 관심도:</strong> {bill.mediaAttentionScore || 0}
              </div>
              <div>
                <strong>찬성 투표:</strong> <span className="admin-bill-votes-for">{bill.votingFor || 0}</span>
              </div>
              <div>
                <strong>반대 투표:</strong> <span className="admin-bill-votes-against">{bill.votingAgainst || 0}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>관리자 메모</h4>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  padding: '12px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  resize: 'vertical'
                }}
                placeholder="관리자 메모를 입력하세요..."
              />
            </div>
          </div>

          <div className="admin-bill-modal-footer">
            <button 
              className="admin-bills-btn admin-bills-btn-secondary" 
              onClick={onClose}
            >
              닫기
            </button>

            {bill.approvalStatus !== 'APPROVED' && (
                <button
                    className="admin-bills-btn admin-bills-btn-success"
                    onClick={() => handleSetStatus('APPROVED')}
                    disabled={actionLoading}
                >
                    <i className="fas fa-check"></i>
                    승인
                </button>
            )}

            {bill.approvalStatus !== 'REJECTED' && (
                <button
                    className="admin-bills-btn admin-bills-btn-danger"
                    onClick={() => handleSetStatus('REJECTED')}
                    disabled={actionLoading}
                >
                    <i className="fas fa-times"></i>
                    거부
                </button>
            )}

            <button
                className="admin-bills-btn admin-bills-btn-primary"
                onClick={handleAiAnalysis}
                disabled={actionLoading}
            >
                <i className="fas fa-robot"></i>
                AI 분석
            </button>

            <button 
              className="admin-bills-btn admin-bills-btn-danger"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              <i className="fas fa-trash"></i>
              삭제
            </button>
          </div>
        </div>
      </div>
  );
};

const BillManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<ApprovalStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  
  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState('');

  // 카테고리 목록
  const categories = [
    { key: 'all', label: '전체' },
    { key: 'politics', label: '정치/행정' },
    { key: 'economy', label: '경제/산업' },
    { key: 'labor', label: '노동/복지' },
    { key: 'education', label: '교육/문화' },
    { key: 'environment', label: '환경/에너지' },
    { key: 'digital', label: '디지털/AI/데이터' }
  ];

  // 법안 데이터 로드
  const loadBills = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const page = currentPage - 1; // API는 0-based 페이징

      if (searchKeyword.trim()) {
        response = await billApi.searchBills(searchKeyword.trim(), page, pageSize);
      } else {
        switch (selectedTab) {
          case 'all':
            response = await billApi.getAllBills(page, pageSize);
            break;
          case 'PENDING':
            response = await billApi.getPendingBills(page, pageSize);
            break;
          case 'APPROVED':
            response = await billApi.getApprovedBillsAdmin(page, pageSize);
            break;
          case 'REJECTED':
            response = await billApi.getRejectedBills(page, pageSize);
            break;
          default:
            response = await billApi.getAllBills(page, pageSize);
            break;
        }
      }

      if (response.success) {
        let bills = response.data.content;

        // 카테고리 필터링
        if (selectedCategory !== 'all') {
          bills = bills.filter(bill => bill.category === selectedCategory);
        }

        setBillItems(bills);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalElements);
      } else {
        setError(response.message || '법안 데이터를 가져오는데 실패했습니다.');
        setBillItems([]);
      }
    } catch (err: any) {
      console.error('법안 데이터 로드 실패:', err);
      setError(err.message || '법안 데이터를 가져오는데 실패했습니다.');
      setBillItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 로드 효과
  useEffect(() => {
    loadBills();
  }, [selectedTab, selectedCategory, currentPage]);

  // 탭 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, selectedCategory, searchKeyword]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadBills();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAiAnalysis = async (billId: number) => {
    try {
        await billApi.requestAiAnalysis(billId);
        alert('AI 분석이 요청되었습니다. 잠시 후 상태가 업데이트됩니다.');
        loadBills();
    } catch (error) {
        console.error('AI 분석 요청 실패:', error);
        alert('AI 분석 요청에 실패했습니다.');
    }
  };

  const handleCrawlBills = async () => {
    if (!window.confirm('최근 법안을 크롤링하시겠습니까? 이 작업은 시간이 걸릴 수 있습니다.')) return;
    try {
      setLoading(true);
      const response = await billApi.triggerBillCrawl();
      if (response.success) {
        alert(response.message);
        loadBills();
      } else {
        alert(response.message || '법안 크롤링 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('법안 크롤링 요청 실패:', error);
      alert('법안 크롤링 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-bills-container">
      <div className="admin-bills-header">
        <div>
          <h1 className="admin-bills-title">법안 관리</h1>
          <p className="admin-bills-subtitle">국회 법안 데이터를 관리하고 승인/거부를 처리합니다</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-bills-tabs">
        <button
          className={`admin-bills-tab ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          전체 법안
        </button>
        <button
          className={`admin-bills-tab ${selectedTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setSelectedTab('PENDING')}
        >
          승인 대기
        </button>
        <button
          className={`admin-bills-tab ${selectedTab === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setSelectedTab('APPROVED')}
        >
          승인됨
        </button>
        <button
          className={`admin-bills-tab ${selectedTab === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setSelectedTab('REJECTED')}
        >
          거부됨
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="admin-bills-category-filter">
        {categories.map(category => (
          <button
            key={category.key}
            className={`admin-bills-category-btn ${selectedCategory === category.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* 검색 및 액션 */}
      <div className="admin-bills-actions">
        <div className="admin-bills-actions-left">
          <input
            type="text"
            className="admin-bills-search-input"
            placeholder="법안 제목, 발의자명으로 검색..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="admin-bills-btn admin-bills-btn-primary" onClick={handleSearch}>
            <i className="fas fa-search"></i>
            검색
          </button>
        </div>
        <div className="admin-bills-actions-right">
          <button className="admin-bills-btn admin-bills-btn-secondary" onClick={loadBills}>
            <i className="fas fa-refresh"></i>
            새로고침
          </button>
          <button 
            className="admin-bills-btn admin-bills-btn-primary"
            onClick={handleCrawlBills}
          >
            <i className="fas fa-spider"></i>
            법안 크롤링
          </button>
        </div>
      </div>

      {/* 법안 테이블 */}
      {loading ? (
        <div className="admin-bills-loading">
          <i className="fas fa-spinner"></i>
          <p>법안 데이터를 불러오고 있습니다...</p>
        </div>
      ) : error ? (
        <div className="admin-bills-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button className="admin-bills-btn admin-bills-btn-primary" onClick={loadBills}>
            다시 시도
          </button>
        </div>
      ) : billItems.length === 0 ? (
        <div className="admin-bills-empty">
          <i className="fas fa-inbox"></i>
          <p>조건에 맞는 법안이 없습니다.</p>
        </div>
      ) : (
        <div className="admin-bills-table-container">
          <table className="admin-bills-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>번호</th>
                <th style={{ width: '120px' }}>법안번호</th>
                <th style={{ minWidth: '300px' }}>제목</th>
                <th style={{ width: '120px' }}>발의자</th>
                <th style={{ width: '100px' }}>카테고리</th>
                <th style={{ width: '100px' }}>상태</th>
                <th style={{ width: '80px' }}>통과가능성</th>
                <th style={{ width: '80px' }}>긴급도</th>
                <th style={{ width: '80px' }}>신뢰도</th>
                <th style={{ width: '100px' }}>투표</th>
                <th style={{ width: '100px' }}>발의일</th>
                <th style={{ width: '120px' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((bill, index) => (
                <tr key={bill.id}>
                  <td>{((currentPage - 1) * pageSize) + index + 1}</td>
                  <td style={{ fontFamily: 'Courier New', fontSize: '12px', color: '#718096' }}>
                    {bill.billNumber}
                  </td>
                  <td>
                    <div 
                      className="admin-bill-title" 
                      onClick={() => setSelectedBill(bill)}
                      title={bill.title}
                    >
                      {bill.title}
                    </div>
                    {bill.isFeatured && (
                      <i className="fas fa-star" style={{ color: '#f6ad55', marginLeft: '8px' }} title="주요 법안"></i>
                    )}
                  </td>
                  <td>
                    <div className="admin-bill-proposer">{bill.proposerName}</div>
                    <div className="admin-bill-party">{bill.partyName}</div>
                  </td>
                  <td>
                    <span className="admin-bill-category">
                      {BILL_CATEGORY_LABELS[bill.category] || bill.category}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-bill-status ${bill.approvalStatus.toLowerCase()}`}>
                      {APPROVAL_STATUS_LABELS[bill.approvalStatus]}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-bill-probability ${bill.passageProbability}`}>
                      {PASSAGE_PROBABILITY_LABELS[bill.passageProbability] || bill.passageProbability}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-bill-urgency ${bill.urgencyLevel}`}>
                      {URGENCY_LEVEL_LABELS[bill.urgencyLevel] || bill.urgencyLevel}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-bill-score ${
                      bill.aiReliabilityScore && bill.aiReliabilityScore >= 70 ? 'high' : 
                      bill.aiReliabilityScore && bill.aiReliabilityScore >= 50 ? 'medium' : 'low'
                    }`}>
                      {bill.aiReliabilityScore || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-bill-votes">
                      <span className="admin-bill-votes-for">찬 {bill.votingFor || 0}</span>
                      <span className="admin-bill-votes-against">반 {bill.votingAgainst || 0}</span>
                    </div>
                  </td>
                  <td className="admin-bill-date">
                    {new Date(bill.proposalDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td>
                    <div className="admin-bill-actions">
                      <button
                        className="admin-bill-action-btn approve"
                        onClick={() => setSelectedBill(bill)}
                        title="상세 보기"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {selectedTab === 'all' && (
                        <button
                            className="admin-bill-action-btn feature"
                            onClick={() => handleAiAnalysis(bill.id)}
                            title="AI 분석"
                        >
                            <i className="fas fa-robot"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && billItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* 법안 상세 모달 */}
      {selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onUpdate={loadBills}
        />
      )}
    </div>
  );
};

export default BillManagement;