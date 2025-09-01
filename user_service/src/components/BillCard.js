
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Bill.css';

const BillCard = ({ bill }) => {
    const { id, title, proposer, party, proposedDate, summary, status, agree, disagree, prediction } = bill;

    return (
        <div className="bill-card">
            <div className="bill-card-header">
                <h3>
                    <Link to={`/bill/${id}`} className="bill-card-title-link">
                        {title}
                    </Link>
                </h3>
                <div className="bill-card-proposer-info">
                    <span>{proposer}</span> (<span>{party}</span>)
                </div>
            </div>
            <div className="bill-card-body">
                <p className="bill-card-summary">{summary}</p>
            </div>
            <div className="bill-card-footer">
                <div className="bill-card-date">발의일: {proposedDate}</div>
                <div className="bill-card-status">
                    <span className={`bill-status-tag ${status}`}>{status}</span>
                </div>
            </div>
            <div className="bill-card-voting-info">
                <div className="bill-card-vote-bar">
                    <div className="agree-bar" style={{ width: `${agree}%` }}></div>
                    <div className="disagree-bar" style={{ width: `${disagree}%` }}></div>
                </div>
                <div className="bill-card-vote-labels">
                    <span className="agree-label">찬성 {agree}%</span>
                    <span className="disagree-label">반대 {disagree}%</span>
                </div>
            </div>
            <div className="bill-card-prediction">
                <strong>처리 가능성:</strong> <span className={`prediction-tag ${prediction}`}>{prediction}</span>
            </div>
            <Link to={`/bill/${id}`} className="bill-card-detail-button">
                상세 보기
            </Link>
        </div>
    );
};

export default BillCard;
