import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Board.css';

const FactlabBoardView = () => {
    const [voteStatus, setVoteStatus] = useState(null); // 'up' or 'down' or null
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([
        {
            id: 1,
            author: '경제분석가',
            date: '2024-07-09 15:30',
            content: '좋은 분석이네요. 특히 부동산 규제 완화 부분에 대한 우려는 저도 동감합니다. 현재 시장 상황을 고려할 때 신중한 접근이 필요할 것 같아요.',
            likes: 5,
            replies: [
                {
                    id: 2,
                    author: '정치관심러',
                    date: '2024-07-09 16:45',
                    content: '맞습니다. 다양한 전문가 의견도 더 들어봐야겠어요.',
                    likes: 2
                }
            ]
        },
        {
            id: 3,
            author: '청년대표',
            date: '2024-07-09 16:15',
            content: '청년 일자리 정책 부분은 반갑습니다. 하지만 구체적인 실행 방안이 더 중요할 것 같아요. 이전에도 비슷한 정책들이 많았지만 실질적인 효과는 미미했거든요.',
            likes: 12,
            replies: []
        },
        {
            id: 4,
            author: '부동산전문가',
            date: '2024-07-09 17:20',
            content: '부동산 규제 완화에 대해서는 다른 시각도 있습니다. 과도한 규제로 인한 시장 경직성 해소가 필요한 시점일 수도 있어요. 물론 신중한 접근은 필요하지만요.',
            likes: 8,
            replies: [
                {
                    id: 5,
                    author: '시민감시단',
                    date: '2024-07-09 18:10',
                    content: '하지만 서민들의 주거 안정성도 고려해야 하지 않을까요?',
                    likes: 6
                }
            ]
        }
    ]);

    const [votes, setVotes] = useState({
        up: 45,
        down: 3
    });

    const textareaRef = useRef(null);

    // 투표 기능
    const handleVote = (type) => {
        if (voteStatus) {
            alert('이미 투표하셨습니다.');
            return;
        }

        setVotes(prev => ({
            ...prev,
            [type]: prev[type] + 1
        }));
        setVoteStatus(type);
    };

    // 댓글 작성
    const handleSubmitComment = () => {
        if (!commentText.trim()) {
            alert('댓글 내용을 입력하세요.');
            return;
        }

        const newComment = {
            id: Date.now(),
            author: '나',
            date: new Date().toLocaleString(),
            content: commentText.trim(),
            likes: 0,
            replies: []
        };

        setComments([...comments, newComment]);
        setCommentText('');
    };

    // 댓글 좋아요
    const handleLikeComment = (commentId, isReply = false, parentId = null) => {
        if (isReply) {
            setComments(prev => prev.map(comment => {
                if (comment.id === parentId) {
                    return {
                        ...comment,
                        replies: comment.replies.map(reply => 
                            reply.id === commentId 
                                ? { ...reply, likes: reply.likes + 1 }
                                : reply
                        )
                    };
                }
                return comment;
            }));
        } else {
            setComments(prev => prev.map(comment => 
                comment.id === commentId 
                    ? { ...comment, likes: comment.likes + 1 }
                    : comment
            ));
        }
    };

    // 댓글 답글
    const handleReplyComment = (commentId) => {
        const content = prompt('답글을 입력하세요:');
        if (content) {
            const newReply = {
                id: Date.now(),
                author: '나',
                date: new Date().toLocaleString(),
                content: content.trim(),
                likes: 0
            };

            setComments(prev => prev.map(comment => 
                comment.id === commentId 
                    ? { ...comment, replies: [...comment.replies, newReply] }
                    : comment
            ));
        }
    };

    // 신고 기능
    const handleReportComment = (commentId) => {
        if (window.confirm('이 댓글을 신고하시겠습니까?')) {
            alert('신고가 접수되었습니다.');
        }
    };

    // 게시글 기능들
    const handleSharePost = () => {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('링크가 복사되었습니다.');
        }
    };

    const handleReportPost = () => {
        if (window.confirm('이 게시글을 신고하시겠습니까?')) {
            alert('신고가 접수되었습니다.');
        }
    };

    const handleBookmarkPost = () => {
        alert('북마크에 추가되었습니다.');
    };

    const handleDeletePost = () => {
        if (window.confirm('정말로 삭제하시겠습니까?')) {
            alert('게시글이 삭제되었습니다.');
            // 목록으로 이동
            window.location.href = '/board';
        }
    };

    const handleLoadMoreComments = () => {
        alert('댓글을 더 불러옵니다.');
    };

    // 엔터키로 댓글 작성
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmitComment();
        }
    };

    useEffect(() => {
        document.title = '새로운 정부 정책에 대한 여러분의 의견은? - FactLab';
    }, []);

    return (
        <div className="board-layout">
            <Header />
            
            <div className="board-view-container">
                {/* Post Header */}
                <div className="board-view-header">
                    <h1 className="board-view-title">새로운 정부 정책에 대한 여러분의 의견은?</h1>
                    <div className="board-view-meta">
                        <div className="board-view-info">
                            <strong>정치관심러</strong> | 2024-07-09 14:23 | 조회 2,156
                        </div>
                        <div className="board-view-vote">
                            <button 
                                className={`board-view-vote-btn up ${voteStatus === 'up' ? 'voted' : ''}`}
                                onClick={() => handleVote('up')}
                                disabled={voteStatus}
                            >
                                👍 추천 {votes.up}
                            </button>
                            <button 
                                className={`board-view-vote-btn down ${voteStatus === 'down' ? 'voted' : ''}`}
                                onClick={() => handleVote('down')}
                                disabled={voteStatus}
                            >
                                👎 비추천 {votes.down}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Post Content */}
                <div className="board-view-content">
                    <p>안녕하세요, 정치에 관심이 많은 시민입니다.</p>
                    
                    <p>오늘 정부에서 발표한 새로운 경제 정책에 대해 여러분의 의견을 듣고 싶습니다.</p>
                    
                    <p><strong>주요 내용:</strong></p>
                    <ul>
                        <li>중소기업 지원 예산 30% 증액</li>
                        <li>청년 일자리 창출 프로그램 확대</li>
                        <li>부동산 규제 완화 조치</li>
                        <li>디지털 뉴딜 사업 추진</li>
                    </ul>
                    
                    <p>개인적으로는 중소기업 지원과 청년 일자리 정책은 긍정적으로 보이지만, 부동산 규제 완화는 다소 우려스럽습니다.</p>
                    
                    <p>특히 현재 부동산 가격 상승세를 고려할 때, 규제 완화가 과연 적절한 시기인지 의문이 듭니다.</p>
                    
                    <p><strong>여러분은 어떻게 생각하시나요?</strong></p>
                    
                    <p>건설적인 토론을 기대합니다. 감정적인 댓글보다는 근거와 논리를 바탕으로 한 의견을 나눠주세요.</p>
                </div>
                
                {/* Post Actions */}
                <div className="board-view-actions">
                    <div className="board-view-action-left">
                        <button className="btn" onClick={handleSharePost}>공유</button>
                        <button className="btn" onClick={handleReportPost}>신고</button>
                        <button className="btn" onClick={handleBookmarkPost}>북마크</button>
                    </div>
                    <div className="board-view-action-right">
                        <a href="/board/write?mode=edit&id=1234" className="btn">수정</a>
                        <button className="btn" onClick={handleDeletePost}>삭제</button>
                    </div>
                </div>
                
                {/* Comments Section */}
                <div className="board-view-comments">
                    <div className="board-view-comments-header">💬 댓글 {comments.length + comments.reduce((acc, comment) => acc + comment.replies.length, 0)}개</div>
                    
                    {/* Comment Write */}
                    <div className="board-view-comment-write">
                        <textarea 
                            ref={textareaRef}
                            className="board-view-comment-textarea" 
                            placeholder="댓글을 입력하세요..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="board-view-comment-submit">
                            <button className="btn btn-primary" onClick={handleSubmitComment}>
                                댓글 작성
                            </button>
                        </div>
                    </div>
                    
                    {/* Comments List */}
                    {comments.map((comment) => (
                        <div key={comment.id} className="board-view-comment-item">
                            <div className="board-view-comment-header">
                                <span className="board-view-comment-author">{comment.author}</span>
                                <span className="board-view-comment-date">{comment.date}</span>
                            </div>
                            <div className="board-view-comment-content">
                                {comment.content}
                            </div>
                            <div className="board-view-comment-actions">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    handleLikeComment(comment.id);
                                }}>
                                    👍 {comment.likes}
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    handleReplyComment(comment.id);
                                }}>
                                    답글
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    handleReportComment(comment.id);
                                }}>
                                    신고
                                </a>
                            </div>
                            
                            {/* Replies */}
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="board-view-reply-item">
                                    <div className="board-view-comment-header">
                                        <span className="board-view-comment-author">{reply.author}</span>
                                        <span className="board-view-comment-date">{reply.date}</span>
                                    </div>
                                    <div className="board-view-comment-content">
                                        {reply.content}
                                    </div>
                                    <div className="board-view-comment-actions">
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            handleLikeComment(reply.id, true, comment.id);
                                        }}>
                                            👍 {reply.likes}
                                        </a>
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            handleReportComment(reply.id);
                                        }}>
                                            신고
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {/* More comments button */}
                    <div className="board-view-more-comments">
                        <button className="btn" onClick={handleLoadMoreComments}>
                            댓글 더보기 (64개 남음)
                        </button>
                    </div>
                </div>
                
                {/* Navigation */}
                <div className="board-view-navigation">
                    <div className="board-view-nav-links">
                        <div>
                            <strong>이전글:</strong>{' '}
                            <a href="/board/view/1235" className="board-view-nav-link">
                                선거제도 개편에 대한 시민들의 의견은?
                            </a>
                        </div>
                        <div>
                            <strong>다음글:</strong>{' '}
                            <a href="/board/view/1233" className="board-view-nav-link">
                                오늘 발표된 경제 정책 분석해보겠습니다
                            </a>
                        </div>
                    </div>
                    <div className="board-view-nav-buttons">
                        <a href="/board" className="btn">목록</a>
                        <a href="/board/write" className="btn btn-primary">글쓰기</a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default FactlabBoardView;