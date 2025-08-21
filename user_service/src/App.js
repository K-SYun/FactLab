import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// 페이지 컴포넌트 임포트
import FactlabMain from './pages/FactlabMain';
import FactlabBoard from './pages/FactlabBoard';
import FactlabBoardView from './pages/FactlabBoardView';
import FactlabBoardWrite from './pages/FactlabBoardWrite';
import FactlabNewsFeed from './pages/FactlabNewsFeed';
import FactlabNewsDetail from './pages/FactlabNewsDetail';
import FactlabRegister from './pages/FactlabRegister';
import FactlabMypage from './pages/FactlabMypage';

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<FactlabMain />} />
        <Route path="/board" element={<FactlabBoard />} />
        <Route path="/board/:boardId" element={<FactlabBoard />} />
        <Route path="/board/view/:id" element={<FactlabBoardView />} />
        <Route path="/board/:boardId/post/:postId" element={<FactlabBoardView />} />
        <Route path="/board/write" element={<FactlabBoardWrite />} />
        <Route path="/board/:boardId/write" element={<FactlabBoardWrite />} />
        <Route path="/news_feed" element={<FactlabNewsFeed />} />
        <Route path="/news/detail" element={<FactlabNewsDetail />} />
        <Route path="/news/detail/:id" element={<FactlabNewsDetail />} />
        <Route path="/news_detail" element={<FactlabNewsDetail />} />
        <Route path="/login" element={<div>로그인 페이지 (개발 예정)</div>} />
        <Route path="/register" element={<FactlabRegister />} />
        <Route path="/mypage" element={<FactlabMypage />} />
        <Route path="*" element={<div>404 - 페이지를 찾을 수 없습니다</div>} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
