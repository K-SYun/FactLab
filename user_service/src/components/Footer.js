import React from 'react';
import '../styles/Common.css';
import '../styles/Main.css';

const Footer = () => (
  <footer className="news-footer">
    <div className="news-footer-content">
      <div className="news-footer-logo">
      </div>
      <div className="news-footer-links-container">
        <div className="news-footer-links">
          <a href="/about">사이트소개</a>
          <a href="#">이용약관</a>
          <a href="#">개인정보처리방침</a>
          <a href="#">저작권침해신고</a>
          <a href="/report">고객센터</a>
          <a href="/notice">공지사항</a>
        </div>
        <div className="news-footer-contact">
          <a href="mailto:contact@polradar.com" className="news-btn">광고문의</a>
          <a href="mailto:contact@polradar.com" className="news-btn">제휴문의</a>
        </div>
      </div>
      <div className="news-footer-info">
        <div>PolRadar | 대표: PolRadar | 사업자등록번호: 123-45-67890</div>
        <div>주소: 서울특별시 강남구 테헤란로 123, PolRadar빌딩 | 이메일: contact@polradar.com</div>
        <div>Copyright © 2025 PolRadar. All rights reserved.</div>
      </div>
    </div>
  </footer>
);

export default Footer;
