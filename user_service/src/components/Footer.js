import React from 'react';
import '../styles/Common.css';
import '../styles/Main.css';

const Footer = () => (
  <footer className="news-footer">
    <div className="news-footer-content">
      <div className="news-footer-logo">
        <img src="/Logo.png" alt="FactLab Icon" className="news-logo-icon" />
        <img src="/Logo2.png" alt="FactLab" className="news-logo-text" />
      </div>
      <div className="news-footer-links">
        <a href="/about">회사소개</a>
        <a href="#">이용약관</a>
        <a href="#">개인정보처리방침</a>
        <a href="#">광고문의</a>
        <a href="#">제휴문의</a>
        <a href="#">저작권침해신고</a>      
        <a href="/report">고객센터</a>
        <a href="/notice">공지사항</a>  
      </div>
      <div className="news-footer-info">
        <div>FactLab | 대표: FactLab | 사업자등록번호: 123-45-67890</div>
        <div>주소: 서울특별시 강남구 테헤란로 123, FactLab빌딩 | 이메일: contact@factlab.com</div>
        <div>Copyright © 2024 FactLab. All rights reserved.</div>
      </div>
    </div>
  </footer>
);

export default Footer;
