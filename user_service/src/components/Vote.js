
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import '../styles/Bill.css';

const Vote = ({ billId }) => {
    const { isLoggedIn } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [voted, setVoted] = useState(null); // 'agree' or 'disagree'
    const [agreeCount, setAgreeCount] = useState(150);
    const [disagreeCount, setDisagreeCount] = useState(50);

    const handleVote = (choice) => {
        if (!isLoggedIn) {
            setIsLoginModalOpen(true);
            return;
        }

        if (voted) {
            alert('이미 투표하셨습니다.');
            return;
        }

        setVoted(choice);
        if (choice === 'agree') {
            setAgreeCount(agreeCount + 1);
        } else {
            setDisagreeCount(disagreeCount + 1);
        }
    };

    const totalVotes = agreeCount + disagreeCount;
    const agreePercentage = totalVotes > 0 ? (agreeCount / totalVotes) * 100 : 0;
    const disagreePercentage = totalVotes > 0 ? (disagreeCount / totalVotes) * 100 : 0;

    return (
        <div className="bill-vote-section">
            <h2>이 법안에 대한 당신의 생각은?</h2>
            <div className="bill-vote-buttons">
                <button onClick={() => handleVote('agree')} disabled={voted} className={`vote-btn agree ${voted === 'agree' ? 'selected' : ''}`}>
                    찬성 👍
                </button>
                <button onClick={() => handleVote('disagree')} disabled={voted} className={`vote-btn disagree ${voted === 'disagree' ? 'selected' : ''}`}>
                    반대 👎
                </button>
            </div>
            <div className="bill-vote-results">
                <div className="vote-bar">
                    <div className="agree-bar" style={{ width: `${agreePercentage}%` }}>
                        {agreePercentage.toFixed(1)}%
                    </div>
                    <div className="disagree-bar" style={{ width: `${disagreePercentage}%` }}>
                        {disagreePercentage.toFixed(1)}%
                    </div>
                </div>
                <div className="vote-counts">
                    <span>찬성: {agreeCount}</span>
                    <span>반대: {disagreeCount}</span>
                </div>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default Vote;
