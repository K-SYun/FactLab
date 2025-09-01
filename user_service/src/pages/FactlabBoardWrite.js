import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import boardService from '../services/boardService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Board.css';

const FactlabBoardWrite = () => {
  const navigate = useNavigate();
  const { boardId: urlBoardId } = useParams();
  const { user, isLoggedIn } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    boardId: urlBoardId || '',
    title: '',
    content: '',
    author: user?.nickname || user?.name || '익명'
  });
  const [tags, setTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [currentBoard, setCurrentBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  // 게시판 정보 로드
  const loadBoardInfo = async (boardId) => {
    if (!boardId) return;
    
    try {
      setLoading(true);
      const response = await boardService.getBoard(boardId);
      if (response.success && response.data) {
        setCurrentBoard(response.data);
      } else {
        setCurrentBoard({ id: boardId, name: `게시판 ${boardId}` });
      }
    } catch (error) {
      console.error('게시판 정보 로드 실패:', error);
      setCurrentBoard({ id: boardId, name: `게시판 ${boardId}` });
    } finally {
      setLoading(false);
    }
  };

  // URL에서 boardId가 변경될 때 formData 업데이트
  useEffect(() => {
    if (urlBoardId) {
      setFormData(prev => ({
        ...prev,
        boardId: urlBoardId
      }));
      loadBoardInfo(urlBoardId);
    }
  }, [urlBoardId]);

  // 사용자 정보가 변경될 때 작성자 정보 업데이트
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        author: user.nickname || user.name || '익명'
      }));
    }
  }, [user]);

  // 로그인 체크
  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    // 페이지 나가기 전 경고
    const handleBeforeUnload = (e) => {
      if (formData.title.trim() || formData.content.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Ctrl+Enter 저장
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, tags, uploadedFiles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        userId: user?.id,
        tags: tags,
        files: uploadedFiles
      };

      const response = await boardService.createPost(submitData);
      
      if (response.success) {
        alert('게시글이 등록되었습니다.');
        // 해당 게시판으로 이동
        navigate(`/board/${formData.boardId}`);
      } else {
        alert(response.message || '게시글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 등록 실패:', error);
      alert('게시글 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.boardId) {
      alert('게시판을 선택하세요.');
      return false;
    }
    
    if (!formData.title.trim()) {
      alert('제목을 입력하세요.');
      return false;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력하세요.');
      return false;
    }
    
    return true;
  };

  const formatText = (command) => {
    const textarea = document.querySelector('[name="content"]');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch(command) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }
    
    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    const text = prompt('링크 텍스트를 입력하세요:');
    
    if (url && text) {
      const link = `[${text}](${url})`;
      insertTextAtCursor(link);
    }
  };

  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const insertList = () => {
    const listText = '\\n- 항목 1\\n- 항목 2\\n- 항목 3\\n';
    insertTextAtCursor(listText);
  };

  const insertTextAtCursor = (text) => {
    const textarea = document.querySelector('[name="content"]');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    files.forEach(file => {
      if (validateFile(file)) {
        setUploadedFiles(prev => [...prev, file]);
      }
    });
  };

  const validateFile = (file) => {
    // JPG, JPEG, PNG 파일만 허용
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPG, JPEG, PNG 파일만 업로드할 수 있습니다.');
      return false;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`파일 크기가 너무 큽니다. (최대 10MB)`);
      return false;
    }
    
    return true;
  };

  const removeFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  const addTag = (tagText) => {
    if (!tagText || tags.length >= 5 || tags.includes(tagText)) {
      return;
    }
    
    setTags(prev => [...prev, tagText]);
  };

  const removeTag = (tagText) => {
    setTags(prev => prev.filter(tag => tag !== tagText));
  };


  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 계속하시겠습니까?')) {
      navigate(-1);
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

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
          <div className="news-container">
            <div className="news-page-header">
              <h1 className="news-page-header-title">글쓰기</h1>
            </div>
        
        <form className="write-form" onSubmit={handleSubmit}>
          {/* 게시판 표시 */}
          <div className="form-group">
            <label className="form-label">게시판</label>
            <div className="current-board">
              {loading ? '로딩 중...' : (
                currentBoard ? currentBoard.name : '게시판 정보 없음'
              )}
            </div>
          </div>
          
          {/* 제목 */}
          <div className="form-group">
            <label className="form-label">제목 <span className="required">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              name="title" 
              placeholder="제목을 입력하세요" 
              value={formData.title}
              onChange={handleInputChange}
              required 
              maxLength={100}
            />
            <div className="help-text">최대 100자</div>
          </div>
          
          {/* 작성자 */}
          <div className="form-group">
            <label className="form-label">작성자</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.author} 
              readOnly 
            />
            <div className="help-text">닉네임으로 표시됩니다</div>
          </div>
          
          {/* 내용 에디터 */}
          <div className="form-group">
            <label className="form-label">내용 <span className="required">*</span></label>
            
            {/* 에디터 툴바 */}
            <div className="editor-toolbar">
              <button type="button" className="toolbar-btn" onClick={() => formatText('bold')} title="굵게">
                <strong>B</strong>
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatText('italic')} title="기울임">
                <em>I</em>
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatText('underline')} title="밑줄">
                <u>U</u>
              </button>
              <button type="button" className="toolbar-btn" onClick={insertLink} title="링크">
                🔗
              </button>
              <button type="button" className="toolbar-btn" onClick={insertImage} title="이미지">
                🖼️
              </button>
              <button type="button" className="toolbar-btn" onClick={insertList} title="목록">
                📝
              </button>
            </div>
            
            <textarea 
              className="content-editor" 
              name="content" 
              placeholder="내용을 입력하세요..." 
              value={formData.content}
              onChange={handleInputChange}
              required
            />
            <div className="help-text">Ctrl+Enter로 저장할 수 있습니다</div>
          </div>
          
          {/* 파일 첨부 */}
          <div className="form-group">
            <label className="form-label">파일 첨부</label>
            <div 
              className="file-upload-area" 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div>📁 파일을 드래그하거나 클릭하여 업로드</div>
              <div className="help-text">JPG, JPEG, PNG 파일만 업로드 가능 (최대 10MB)</div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="file-input" 
              multiple 
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
                    <span 
                      className="file-remove" 
                      onClick={() => removeFile(file.name)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 태그 */}
          <div className="form-group">
            <label className="form-label">태그</label>
            <div className="tag-input">
              {tags.map((tag, index) => (
                <div key={index} className="tag-item">
                  {tag}
                  <span 
                    className="tag-remove" 
                    onClick={() => removeTag(tag)}
                  >
                    ×
                  </span>
                </div>
              ))}
              <input 
                type="text" 
                className="tag-field" 
                placeholder="태그를 입력하고 Enter를 누르세요"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
              />
            </div>
            <div className="help-text">최대 5개의 태그를 추가할 수 있습니다</div>
          </div>
        </form>
        
        {/* 폼 하단 */}
        <div className="form-footer">
          <div className="form-options">
            {/* 자동저장 옵션 제거됨 */}
          </div>
          
          <div>
            <button type="button" className="btn" onClick={handleCancel}>취소</button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
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

export default FactlabBoardWrite;