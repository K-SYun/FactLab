import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/Report.css';

const FactlabReport = () => {
  const navigate = useNavigate();
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    targetType: '',
    targetUrl: '',
    reason: '',
    description: '',
    contact: '',
    additional: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // 신고 내역 샘플 데이터
  const [reportHistory] = useState([
    {
      id: 3,
      target: '게시글: "정치적 편향성이 심한 가짜뉴스 게시물"',
      reason: '허위정보',
      status: 'processing',
      date: '07-09'
    },
    {
      id: 2,
      target: '댓글: "특정 지역 주민들에 대한 혐오 발언"',
      reason: '혐오표현',
      status: 'completed',
      date: '07-07'
    },
    {
      id: 1,
      target: '게시글: "상업적 광고성 도배 게시물"',
      reason: '스팸/광고',
      status: 'completed',
      date: '07-05'
    }
  ]);

  // 신고 사유 옵션
  const reasonOptions = [
    {
      value: 'spam',
      label: '스팸 / 광고',
      description: '상업적 광고, 도배, 반복 게시물'
    },
    {
      value: 'hate',
      label: '혐오 표현',
      description: '특정 집단에 대한 차별, 혐오, 비하 발언'
    },
    {
      value: 'false_info',
      label: '허위 정보',
      description: '사실과 다른 정보, 가짜뉴스, 조작된 내용'
    },
    {
      value: 'inappropriate',
      label: '부적절한 콘텐츠',
      description: '음란물, 폭력적 내용, 미성년자 유해 콘텐츠'
    },
    {
      value: 'personal_attack',
      label: '개인 공격 / 명예훼손',
      description: '특정 개인에 대한 인신공격, 사생활 침해'
    },
    {
      value: 'copyright',
      label: '저작권 침해',
      description: '무단 복제, 도용, 저작권 위반 콘텐츠'
    },
    {
      value: 'privacy',
      label: '개인정보 노출',
      description: '개인정보 무단 공개, 사생활 침해'
    },
    {
      value: 'other',
      label: '기타',
      description: '위 항목에 해당하지 않는 기타 사유'
    }
  ];

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (validateFile(file)) {
        setUploadedFiles(prev => [...prev, file]);
      }
    });
    
    // 파일 입력 초기화
    e.target.value = '';
  };

  // 파일 유효성 검사
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return false;
    }
    
    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하만 가능합니다.');
      return false;
    }
    
    if (uploadedFiles.length >= 3) {
      alert('최대 3개의 파일만 업로드 가능합니다.');
      return false;
    }
    
    return true;
  };

  // 파일 제거
  const removeFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    if (!formData.targetType) {
      alert('신고 유형을 선택하세요.');
      return false;
    }
    
    if (!formData.targetUrl.trim()) {
      alert('신고 대상의 URL 또는 ID를 입력하세요.');
      return false;
    }
    
    if (!formData.reason) {
      alert('신고 사유를 선택하세요.');
      return false;
    }
    
    if (formData.description.trim().length < 20) {
      alert('상세 설명을 20자 이상 입력하세요.');
      return false;
    }
    
    return true;
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // 실제 구현에서는 서버에 전송
    console.log('신고 접수:', formData, uploadedFiles);
    alert('신고가 접수되었습니다. 검토 후 처리 결과를 알려드리겠습니다.');
    
    // 폼 초기화
    resetForm();
  };

  // 폼 초기화
  const resetForm = () => {
    if (window.confirm('입력한 내용이 모두 삭제됩니다. 계속하시겠습니까?')) {
      setFormData({
        targetType: '',
        targetUrl: '',
        reason: '',
        description: '',
        contact: '',
        additional: ''
      });
      setUploadedFiles([]);
    }
  };

  // 취소
  const handleCancel = () => {
    if (window.confirm('신고 작성을 취소하시겠습니까?')) {
      navigate(-1);
    }
  };

  // 상태별 스타일 클래스
  const getStatusClassName = (status) => {
    switch (status) {
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return '처리중';
      case 'completed': return '조치완료';
      case 'rejected': return '반려';
      default: return '대기중';
    }
  };

  return (
    <>
      <Header />
      
      <div className="report-container">
        <div className="report-page-header">
          🚨 신고하기
        </div>
        
        {/* Warning */}
        <div className="report-warning-box">
          <div className="report-warning-title">⚠️ 신고 전 확인사항</div>
          <ul style={{marginLeft: '15px', lineHeight: '1.4'}}>
            <li>허위신고는 제재 대상이 될 수 있습니다.</li>
            <li>신고 내용은 관리자가 검토한 후 처리됩니다.</li>
            <li>처리 결과는 알림을 통해 안내됩니다.</li>
            <li>중복 신고는 하나로 처리됩니다.</li>
          </ul>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Report Type */}
          <div className="report-form-section">
            <div className="report-section-title">신고 대상 선택</div>
            
            <div className="report-form-group">
              <label className="report-form-label">
                신고 유형 <span className="report-required">*</span>
              </label>
              <select
                className="report-form-select"
                name="targetType"
                value={formData.targetType}
                onChange={handleInputChange}
                required
              >
                <option value="">선택하세요</option>
                <option value="post">게시글</option>
                <option value="comment">댓글</option>
                <option value="user">사용자</option>
                <option value="news">뉴스</option>
              </select>
            </div>
            
            {formData.targetType && (
              <div className="report-form-group">
                <label className="report-form-label">대상 URL 또는 ID</label>
                <input
                  type="text"
                  className="report-form-input"
                  name="targetUrl"
                  value={formData.targetUrl}
                  onChange={handleInputChange}
                  placeholder="신고할 게시글/댓글/사용자의 URL이나 ID를 입력하세요"
                  required
                />
                <div className="report-help-text">
                  예: https://factlab.com/post/1234 또는 게시글 번호
                </div>
              </div>
            )}
          </div>
          
          {/* Report Reason */}
          <div className="report-form-section">
            <div className="report-section-title">신고 사유</div>
            
            <div className="report-form-group">
              <label className="report-form-label">
                신고 사유 선택 <span className="report-required">*</span>
              </label>
              <div className="report-radio-group">
                {reasonOptions.map((option) => (
                  <label key={option.value} className="report-radio-item">
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={formData.reason === option.value}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="report-radio-label">
                      {option.label}
                      <div className="report-radio-desc">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Report Details */}
          <div className="report-form-section">
            <div className="report-section-title">신고 상세 내용</div>
            
            <div className="report-form-group">
              <label className="report-form-label">
                상세 설명 <span className="report-required">*</span>
              </label>
              <textarea
                className="report-textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="신고 사유에 대한 구체적인 설명을 입력해주세요. 정확한 신고 처리를 위해 자세히 작성해주시기 바랍니다."
                required
              />
              <div className="report-help-text">최소 20자 이상 입력해주세요.</div>
            </div>
            
            <div className="report-form-group">
              <label className="report-form-label">증빙 자료 첨부</label>
              <div 
                className="report-file-upload"
                onClick={() => document.getElementById('fileInput').click()}
              >
                📎 파일을 클릭하여 업로드<br />
                <small>스크린샷, 캡처 이미지 등 (최대 5MB, 이미지 파일만)</small>
              </div>
              <input
                type="file"
                id="fileInput"
                className="report-file-input"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
              />
              
              {uploadedFiles.length > 0 && (
                <div className="report-uploaded-files">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="report-file-item">
                      <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
                      <span
                        className="report-file-remove"
                        onClick={() => removeFile(file.name)}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Reporter Info */}
          <div className="report-form-section">
            <div className="report-section-title">신고자 정보</div>
            
            <div className="report-form-group">
              <label className="report-form-label">연락처 (선택)</label>
              <input
                type="email"
                className="report-form-input"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="처리 결과 안내를 받을 이메일 주소"
              />
              <div className="report-help-text">
                입력하지 않으면 사이트 알림으로만 안내됩니다.
              </div>
            </div>
            
            <div className="report-form-group">
              <label className="report-form-label">추가 요청사항</label>
              <textarea
                className="report-textarea"
                name="additional"
                value={formData.additional}
                onChange={handleInputChange}
                placeholder="신고 처리와 관련하여 추가로 요청하실 사항이 있으면 입력해주세요."
                style={{height: '60px'}}
              />
            </div>
          </div>
        </form>
        
        {/* Form Footer */}
        <div className="report-form-footer">
          <button type="submit" className="report-btn report-btn-primary" onClick={handleSubmit}>
            신고 접수
          </button>
          <button type="button" className="report-btn" onClick={resetForm}>
            초기화
          </button>
          <button type="button" className="report-btn" onClick={handleCancel}>
            취소
          </button>
        </div>
        
        {/* Report History */}
        <div className="report-history">
          <div className="report-history-title">📋 내 신고 내역</div>
          
          <table className="report-history-list">
            <thead>
              <tr>
                <th width="60">번호</th>
                <th>신고 대상</th>
                <th width="80">신고 사유</th>
                <th width="80">처리 상태</th>
                <th width="80">신고일</th>
              </tr>
            </thead>
            <tbody>
              {reportHistory.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td style={{
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {report.target}
                  </td>
                  <td>{report.reason}</td>
                  <td>
                    <span className={getStatusClassName(report.status)}>
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  <td>{report.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FactlabReport;