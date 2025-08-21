import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import boardService from '../services/boardService';
import { boardCommentApi } from '../services/boardCommentApi';
import '../styles/Board.css';

const FactlabBoardView = () => {
    const { id: postId, boardId, postId: urlPostId } = useParams();
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuth();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voteStatus, setVoteStatus] = useState(null); // 'up' or 'down' or null
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);

    const [votes, setVotes] = useState({
        up: 0,
        down: 0
    });

    const textareaRef = useRef(null);

    // 게시글 데이터 로드
    const loadPost = async () => {
        try {
            setLoading(true);
            // /board/view/:id → postId 사용
            // /board/:boardId/post/:postId → urlPostId 사용
            const actualPostId = urlPostId || postId;
            
            // 조회수 증가 (게시글 로드 전에 먼저 실행)
            try {
                await boardService.increaseViewCount(actualPostId);
            } catch (viewError) {
                console.error('조회수 증가 실패:', viewError);
            }
            
            const response = await boardService.getPost(actualPostId);
            
            if (response.success && response.data) {
                setPost({
                    ...response.data,
                    isAuthor: user?.id === response.data.userId,
                });
                document.title = `${response.data.title} - FactLab`;
            } else {
                console.error('게시글 로드 실패:', response);
            }
        } catch (error) {
            console.error('게시글 로드 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // 댓글 데이터 로드
    const loadComments = async () => {
        try {
            const actualPostId = urlPostId || postId;
            const commentsData = await boardCommentApi.getComments(actualPostId);
            setComments(commentsData);
        } catch (error) {
            console.error('댓글 로드 오류:', error);
            setComments([]);
        }
    };

    useEffect(() => {
        if (postId || urlPostId) {
            loadPost();
            loadComments();
        }
    }, [postId, urlPostId, user]);

    // 투표 기능
    const handleVote = async (type) => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다.');
            navigate('/');
            return;
        }

        if (voteStatus) {
            alert('이미 투표하셨습니다.');
            return;
        }

        try {
            const actualPostId = urlPostId || postId;
            await boardService.votePost(actualPostId, type, user.id);
            
            setVotes(prev => ({
                ...prev,
                [type]: prev[type] + 1
            }));
            setVoteStatus(type);
        } catch (error) {
            console.error('투표 오류:', error);
            alert('투표 중 오류가 발생했습니다.');
        }
    };

    // 댓글 작성
    const handleSubmitComment = async () => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다.');
            navigate('/');
            return;
        }

        if (!commentText.trim()) {
            alert('댓글 내용을 입력하세요.');
            return;
        }

        try {
            const actualPostId = urlPostId || postId;
            await boardCommentApi.createComment(actualPostId, commentText.trim(), user.id);
            
            // 댓글 목록 새로고침
            await loadComments();
            setCommentText('');
        } catch (error) {
            console.error('댓글 작성 오류:', error);
            alert('댓글 작성에 실패했습니다.');
        }
    };

    // 댓글 좋아요
    const handleLikeComment = async (commentId, isReply = false, parentId = null) => {
        try {
            // API 호출
            await boardCommentApi.likeComment(commentId, user?.id);
            
            // 로컬 상태 업데이트
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
        } catch (error) {
            console.error('댓글 좋아요 오류:', error);
            alert('좋아요 처리에 실패했습니다.');
        }
    };

    // 댓글 답글
    const handleReplyComment = async (commentId) => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다.');
            navigate('/');
            return;
        }

        const content = prompt('답글을 입력하세요:');
        if (content && content.trim()) {
            try {
                const actualPostId = urlPostId || postId;
                await boardCommentApi.createReply(actualPostId, commentId, content.trim(), user.id);
                
                // 댓글 목록 새로고침
                await loadComments();
            } catch (error) {
                console.error('답글 작성 오류:', error);
                alert('답글 작성에 실패했습니다.');
            }
        }
    };

    // 댓글 삭제
    const handleDeleteComment = async (commentId) => {
        // 해당 댓글의 답글 개수 확인
        const comment = comments.find(c => c.id === commentId);
        const hasReplies = comment && comment.replies && comment.replies.length > 0;
        
        const confirmMessage = hasReplies 
            ? '이 댓글에 답글이 있습니다. 삭제하면 "작성자에 의해 글이 삭제되었습니다."로 표시됩니다. 계속하시겠습니까?'
            : '이 댓글을 삭제하시겠습니까?';
            
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await boardCommentApi.deleteComment(commentId, user.id);

            if (hasReplies) {
                // 답글이 있는 경우: 로컬에서 삭제 표시로 변경
                setComments(prev => prev.map(c => 
                    c.id === commentId 
                        ? { 
                            ...c, 
                            content: '작성자에 의해 글이 삭제되었습니다.',
                            author: '삭제된 사용자',
                            isDeleted: true
                        }
                        : c
                ));
            } else {
                // 답글이 없는 경우: 댓글 목록에서 제거
                setComments(prev => prev.filter(c => c.id !== commentId));
            }

            alert('댓글이 삭제되었습니다.');
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            alert('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
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

    const handleDeletePost = async () => {
        if (!post.isAuthor) {
            alert('작성자만 삭제할 수 있습니다.');
            return;
        }

        if (window.confirm('정말로 삭제하시겠습니까?')) {
            try {
                // TODO: 게시글 삭제 API 구현 필요
                alert('게시글이 삭제되었습니다.');
                navigate('/board');
            } catch (error) {
                console.error('게시글 삭제 오류:', error);
                alert('게시글 삭제에 실패했습니다.');
            }
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

    // 로딩 중일 때
    if (loading) {
        return (
            <>
                <Header />
                <div className="main-top-banner-ad">
                    🎯 상단 배너 광고 영역 (1200px x 90px)
                </div>
                <div className="main-container">
                    {/* 좌측 광고 */}
                    <div className="main-side-ad">
                        📢<br />좌측<br />광고<br />영역<br />(160px)
                    </div>
                    {/* 메인 컨텐츠 */}
                    <div className="main-content">
                        <div className="loading-message">게시글을 불러오는 중...</div>
                    </div>
                    {/* 우측 광고 */}
                    <div className="main-side-ad">
                        📢<br />우측<br />광고<br />영역<br />(160px)
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // 게시글이 없을 때
    if (!post) {
        return (
            <>
                <Header />
                <div className="main-top-banner-ad">
                    🎯 상단 배너 광고 영역 (1200px x 90px)
                </div>
                <div className="main-container">
                    {/* 좌측 광고 */}
                    <div className="main-side-ad">
                        📢<br />좌측<br />광고<br />영역<br />(160px)
                    </div>
                    {/* 메인 컨텐츠 */}
                    <div className="main-content">
                        <div className="error-message">
                            <h2>게시글을 찾을 수 없습니다</h2>
                            <button onClick={() => navigate(-1)} className="btn">이전 페이지로</button>
                        </div>
                    </div>
                    {/* 우측 광고 */}
                    <div className="main-side-ad">
                        📢<br />우측<br />광고<br />영역<br />(160px)
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="main-top-banner-ad">
                🎯 상단 배너 광고 영역 (1200px x 90px)
            </div>
            <div className="main-container">
                {/* 좌측 광고 */}
                <div className="main-side-ad">
                    📢<br />좌측<br />광고<br />영역<br />(160px)
                </div>
                {/* 메인 컨텐츠 */}
                <div className="main-content">
                    <div className="board-view-container">
                {/* Post Header */}
                <div className="board-view-header">
                    <h1 className="board-view-title">{post.title}</h1>
                    <div className="board-view-meta">
                        <div className="board-view-info">
                            <strong>{post.author || post.authorName}</strong> | {post.createdAt || post.created_at} | 조회 {post.viewCount || post.view_count || 0}
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
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
                
                {/* Post Actions */}
                <div className="board-view-actions">
                    <div className="board-view-action-left">
                        <button className="btn" onClick={handleSharePost}>공유</button>
                        <button className="btn" onClick={handleReportPost}>신고</button>
                        <button className="btn" onClick={handleBookmarkPost}>북마크</button>
                    </div>
                    <div className="board-view-action-right">
                        <button className="btn" onClick={() => navigate('/board')}>목록</button>
                        {post.isAuthor && (
                            <>
                                <button className="btn" onClick={() => navigate(`/board/write?mode=edit&id=${post.id}`)}>수정</button>
                                <button className="btn" onClick={handleDeletePost}>삭제</button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Comments Section */}
                <div className="board-view-comments">
                    <div className="board-view-comments-header">💬 댓글 {comments.length + comments.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0)}개</div>
                    
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
                            <div className="board-view-comment-content" style={{ 
                                color: comment.isDeleted ? '#999' : 'inherit',
                                fontStyle: comment.isDeleted ? 'italic' : 'normal'
                            }}>
                                {comment.content}
                            </div>
                            {!comment.isDeleted && (
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
                                    {isLoggedIn && user?.id === comment.userId && (
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteComment(comment.id);
                                        }} style={{ color: '#dc3545' }}>
                                            삭제
                                        </a>
                                    )}
                                </div>
                            )}
                            
                            {/* Replies */}
                            {comment.replies?.map((reply) => (
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
                                        {isLoggedIn && user?.id === reply.userId && (
                                            <a href="#" onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteComment(reply.id);
                                            }} style={{ color: '#dc3545' }}>
                                                삭제
                                            </a>
                                        )}
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
                </div>
                {/* 우측 광고 */}
                <div className="main-side-ad">
                    📢<br />우측<br />광고<br />영역<br />(160px)
                </div>
            </div>
            <Footer />
        </>
    );
};

export default FactlabBoardView;