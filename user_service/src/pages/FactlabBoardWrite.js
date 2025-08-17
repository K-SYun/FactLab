import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Board.css';

const FactlabBoardWrite = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    boardId: '',
    title: '',
    content: '',
    author: '닉네임'
  });
  const [tags, setTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState('자동 저장됨 (30초 전)');
  const [tagInput, setTagInput] = useState('');

  const boards = [
    { id: '', label: '게시판을 선택하세요' },
    { id: '1', label: '정치토론' },
    { id: '2', label: '사회이슈' },
    { id: '3', label: '경제뉴스' },
    { id: '4', label: '과학기술' },
    { id: '5', label: '문화생활' },
    { id: '6', label: '스포츠' },
    { id: '7', label: '국제뉴스' }
  ];

  useEffect(() => {
    loadDraft();
    const interval = enableAutoSave();
    
    // 페이지 나가기 전 경고
    const handleBeforeUnload = (e) => {
      if (formData.title.trim() || formData.content.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      tags: tags,
      files: uploadedFiles
    };

    // 실제로는 서버에 전송
    console.log('게시글 등록:', submitData);
    alert('게시글이 등록되었습니다.');
    navigate('/board');
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
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      alert(`파일 크기가 너무 큽니다. (최대 ${maxSize / 1024 / 1024}MB)`);
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

  const saveDraft = () => {
    const draftData = {
      ...formData,
      tags: tags,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('factlab_draft', JSON.stringify(draftData));
    setAutoSaveStatus('임시저장됨 (방금 전)');
    alert('임시저장되었습니다.');
  };

  const enableAutoSave = () => {
    return setInterval(() => {
      if (autoSave && (formData.title.trim() || formData.content.trim())) {
        const draftData = {
          ...formData,
          tags: tags,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('factlab_draft', JSON.stringify(draftData));
        setAutoSaveStatus('자동저장됨 (방금 전)');
      }
    }, 30000); // 30초마다
  };

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('factlab_draft');
    if (savedDraft) {
      const draftData = JSON.parse(savedDraft);
      const timeDiff = new Date() - new Date(draftData.timestamp);
      
      // 1일 이내의 임시저장만 복원
      if (timeDiff < 24 * 60 * 60 * 1000) {
        if (window.confirm('임시저장된 글이 있습니다. 불러오시겠습니까?')) {
          setFormData({
            boardId: draftData.boardId || '',
            title: draftData.title || '',
            content: draftData.content || '',
            author: draftData.author || '닉네임'
          });
          
          if (draftData.tags) {
            setTags(draftData.tags);
          }
        }
      }
    }
  };

  const handlePreview = () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력하세요.');
      return;
    }
    
    const previewWindow = window.open('', 'preview', 'width=800,height=600');
    previewWindow.document.write(`
      <html>
      <head><title>미리보기</title></head>
      <body style="font-family: Malgun Gothic; padding: 20px;">
        <h2>${formData.title}</h2>
        <hr>
        <div style="white-space: pre-wrap;">${formData.content}</div>
      </body>
      </html>
    `);
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
    <div className="factlab-board-write">
      <Header />
      
      <div className="board-container">
        <div className="page-header">
          글쓰기
        </div>
        
        <form className="write-form" onSubmit={handleSubmit}>
          {/* 게시판 선택 */}
          <div className="form-group">
            <label className="form-label">게시판 선택 <span className="required">*</span></label>
            <select 
              className="form-select" 
              name="boardId" 
              value={formData.boardId}
              onChange={handleInputChange}
              required
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.label}</option>
              ))}
            </select>
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
              <div className="help-text">이미지: 10MB 이하, GIF 포함 | 일반 파일: 5MB 이하</div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="file-input" 
              multiple 
              accept="image/*,.pdf,.doc,.docx,.txt"
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
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="autoSave" 
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <label htmlFor="autoSave">자동 저장</label>
            </div>
            <div className="auto-save-status">
              {autoSaveStatus}
            </div>
          </div>
          
          <div>
            <button type="button" className="btn btn-secondary" onClick={saveDraft}>임시저장</button>
            <button type="button" className="btn" onClick={handlePreview}>미리보기</button>
            <button type="button" className="btn" onClick={handleCancel}>취소</button>
            <button type="submit" className="btn btn-primary" form="writeForm">등록</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FactlabBoardWrite;