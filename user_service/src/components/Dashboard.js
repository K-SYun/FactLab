
import React, { useState } from 'react';
import '../styles/Bill.css';

const Dashboard = () => {
    const [interests, setInterests] = useState([]);
    const [notifications, setNotifications] = useState(true);

    const allInterests = [
        '환경', '노동', '부동산', '조세', '교육', '복지', '외교', '안보'
    ];

    const handleInterestToggle = (interest) => {
        setInterests(prev => 
            prev.includes(interest) 
                ? prev.filter(i => i !== interest) 
                : [...prev, interest]
        );
    };

    const followedBills = [
        { id: 1, title: '탄소중립기본법 일부개정법률안', status: '심사중' },
        { id: 2, title: '노동조합 및 노동관계조정법 일부개정법률안', status: '계류' },
    ];

    return (
        <div className="bill-dashboard">
            <h2>맞춤형 대시보드</h2>
            
            <div className="dashboard-section">
                <h4>관심 분야 선택</h4>
                <div className="interest-tags">
                    {allInterests.map(interest => (
                        <span 
                            key={interest}
                            className={`interest-tag ${interests.includes(interest) ? 'active' : ''}`}
                            onClick={() => handleInterestToggle(interest)}
                        >
                            {interest}
                        </span>
                    ))}
                </div>
            </div>

            <div className="dashboard-section">
                <h4>팔로우 중인 법안</h4>
                <ul className="followed-bills-list">
                    {followedBills.map(bill => (
                        <li key={bill.id}>
                            <span>{bill.title}</span>
                            <span className={`bill-status-tag-small ${bill.status}`}>{bill.status}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="dashboard-section">
                <h4>알림 설정</h4>
                <div className="notification-toggle">
                    <span>관심 키워드 법안 발의 시 알림</span>
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={notifications} 
                            onChange={() => setNotifications(!notifications)} 
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
