import React, { useState } from 'react';
import './AdminNewsAnalysis.css';

const AdminNewsAnalysis = ({ newsId, newsTitle, onAnalysisComplete }) => {
  const [loading, setLoading] = useState({
    comprehensive: false,
    fact: false,
    bias: false
  });
  const [results, setResults] = useState({
    comprehensive: null,
    fact: null,
    bias: null
  });

  // 분석 API 호출
  const handleAnalysis = async (analysisType) => {
    setLoading(prev => ({ ...prev, [analysisType]: true }));
    
    try {
      const response = await fetch('/api/admin/news/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // 관리자 토큰
        },
        body: JSON.stringify({
          newsId: newsId,
          analysisType: analysisType.toUpperCase()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(prev => ({ ...prev, [analysisType]: result.data }));
        if (onAnalysisComplete) {
          onAnalysisComplete(analysisType, result.data);
        }
        alert(`${getAnalysisTypeName(analysisType)} 분석이 완료되었습니다.`);
      } else {
        alert(`분석 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('분석 요청 실패:', error);
      alert('분석 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(prev => ({ ...prev, [analysisType]: false }));
    }
  };

  // 분석 타입 이름 반환
  const getAnalysisTypeName = (type) => {
    switch (type) {
      case 'comprehensive': return '종합분석';
      case 'fact': return '사실분석';
      case 'bias': return '편향성분석';
      default: return '분석';
    }
  };

  return (
    <div className="admin-news-analysis">
      <div className="analysis-header">
        <h3>AI 뉴스 분석</h3>
        <p className="news-title">{newsTitle}</p>
      </div>

      <div className="analysis-buttons">
        {/* 종합 분석 버튼 */}
        <div className="analysis-button-group">
          <button
            className="analysis-btn comprehensive"
            onClick={() => handleAnalysis('comprehensive')}
            disabled={loading.comprehensive}
          >
            {loading.comprehensive ? (
              <>
                <span className="spinner"></span>
                종합분석 중...
              </>
            ) : (
              <>
                🔍 종합분석
                <span className="btn-description">사실 + 편향성 + 요약</span>
              </>
            )}
          </button>
          {results.comprehensive && (
            <div className="analysis-status completed">✅ 완료</div>
          )}
        </div>

        {/* 사실 분석 버튼 */}
        <div className="analysis-button-group">
          <button
            className="analysis-btn fact"
            onClick={() => handleAnalysis('fact')}
            disabled={loading.fact}
          >
            {loading.fact ? (
              <>
                <span className="spinner"></span>
                사실분석 중...
              </>
            ) : (
              <>
                ✅ 사실분석
                <span className="btn-description">팩트 체크 전용</span>
              </>
            )}
          </button>
          {results.fact && (
            <div className="analysis-status completed">✅ 완료</div>
          )}
        </div>

        {/* 편향성 분석 버튼 */}
        <div className="analysis-button-group">
          <button
            className="analysis-btn bias"
            onClick={() => handleAnalysis('bias')}
            disabled={loading.bias}
          >
            {loading.bias ? (
              <>
                <span className="spinner"></span>
                편향성분석 중...
              </>
            ) : (
              <>
                ⚖️ 편향성분석
                <span className="btn-description">중립성 및 편향 분석</span>
              </>
            )}
          </button>
          {results.bias && (
            <div className="analysis-status completed">✅ 완료</div>
          )}
        </div>
      </div>

      {/* 분석 결과 미리보기 */}
      {(results.comprehensive || results.fact || results.bias) && (
        <div className="analysis-results-preview">
          <h4>분석 결과 미리보기</h4>
          {results.comprehensive && (
            <div className="result-item">
              <strong>종합분석:</strong> 
              <p>{results.comprehensive.summary}</p>
            </div>
          )}
          {results.fact && (
            <div className="result-item">
              <strong>사실분석:</strong> 
              <p>{results.fact.summary}</p>
            </div>
          )}
          {results.bias && (
            <div className="result-item">
              <strong>편향성분석:</strong> 
              <p>{results.bias.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNewsAnalysis;