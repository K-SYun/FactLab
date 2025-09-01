
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import '../styles/Bill.css';

const Comment = ({ contentId, contentType }) => {
    const { isLoggedIn, user } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        // Fetch comments from API based on contentId and contentType
        // For now, we will use mock data
        setComments([
            { id: 1, author: '시민1', content: '이 법안은 반드시 통과되어야 합니다.', date: '2024-08-20' },
            { id: 2, author: '반대자', content: '세금 낭비입니다. 반대합니다.', date: '2024-08-21' },
        ]);
    }, [contentId, contentType]);

    const handleCommentSubmit = () => {
        if (!isLoggedIn) {
            setIsLoginModalOpen(true);
            return;
        }

        if (!commentText.trim()) {
            alert('댓글 내용을 입력하세요.');
            return;
        }

        const newComment = {
            id: comments.length + 1,
            author: user.nickname,
            content: commentText,
            date: new Date().toISOString().split('T')[0],
        };

        setComments([...comments, newComment]);
        setCommentText('');
    };

    return (
        <div className="bill-comment-section">
            <h2>댓글</h2>
            <div className="comment-write-box">
                <textarea 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder={isLoggedIn ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다.'}
                    disabled={!isLoggedIn}
                />
                <button onClick={handleCommentSubmit} disabled={!isLoggedIn}>댓글 작성</button>
            </div>
            <div className="comment-list">
                {comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                        <div className="comment-author">{comment.author}</div>
                        <div className="comment-content">{comment.content}</div>
                        <div className="comment-date">{comment.date}</div>
                    </div>
                ))}
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default Comment;
