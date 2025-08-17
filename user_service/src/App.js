import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import FactlabMain from './pages/FactlabMain';
import FactlabNewsFeed from './pages/FactlabNewsFeed';
import FactlabNewsDetail from './pages/FactlabNewsDetail';
import FactlabRegister from './pages/FactlabRegister';
import FactlabBoardList from './pages/FactlabBoardList';
import FactlabBoard from './pages/FactlabBoard';
import FactlabBoardDetail from './pages/FactlabBoardDetail';
import FactlabBoardView from './pages/FactlabBoardView';
import FactlabBoardWrite from './pages/FactlabBoardWrite';
import FactlabNotice from './pages/FactlabNotice';
import FactlabNotifications from './pages/FactlabNotifications';
import FactlabReport from './pages/FactlabReport';
import FactlabMypage from './pages/FactlabMypage';

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<FactlabMain />} />
        <Route path="/news_feed" element={<FactlabNewsFeed />} />
        <Route path="/news_detail" element={<FactlabNewsDetail />} />
        <Route path="/register" element={<FactlabRegister />} />
        <Route path="/board" element={<FactlabBoardList />} />
        <Route path="/board_list" element={<FactlabBoardList />} />
        <Route path="/board/:boardId" element={<FactlabBoard />} />
        <Route path="/board_detail/:id" element={<FactlabBoardDetail />} />
        <Route path="/board/view/:id" element={<FactlabBoardView />} />
        <Route path="/board_view/:id" element={<FactlabBoardView />} />
        <Route path="/board/:boardId/write" element={<FactlabBoardWrite />} />
        <Route path="/board/write" element={<FactlabBoardWrite />} />
        <Route path="/board/:boardId/post/:postId" element={<FactlabNewsDetail />} />
        <Route path="/notice" element={<FactlabNotice />} />
        <Route path="/notifications" element={<FactlabNotifications />} />
        <Route path="/report" element={<FactlabReport />} />
        <Route path="/mypage" element={<FactlabMypage />} />
        <Route path="*" element={
          <div className="not-found-container">
            <h2 className="not-found-title">페이지를 찾을 수 없습니다</h2>
            <p className="not-found-message">요청하신 페이지가 존재하지 않습니다.</p>
            <button 
              className="not-found-button"
              onClick={() => window.location.href = '/'}
            >
              메인으로 돌아가기
            </button>
          </div>
        } />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
