-- 테이블 생성 스크립트
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nickname VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_level INT DEFAULT 1,
  activity_score INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  role VARCHAR(20) DEFAULT 'USER',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 사용자 테이블
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 테이블 인덱스 생성
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

-- 이메일 인증 테이블
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 인증 테이블 인덱스 생성
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_code ON email_verifications(email, verification_code);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  url VARCHAR(512) NOT NULL UNIQUE,
  source VARCHAR(100) NOT NULL,
  publish_date TIMESTAMP NOT NULL,
  original_publish_date TIMESTAMP,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  thumbnail VARCHAR(500),
  visibility VARCHAR(20) DEFAULT 'PUBLIC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP
);

CREATE TABLE news_summary (
  id SERIAL PRIMARY KEY,
  news_id INT NOT NULL REFERENCES news(id),
  summary TEXT,
  claim TEXT,
  keywords VARCHAR(500),
  auto_question TEXT,
  reliability_score INT,
  ai_confidence INT,
  status VARCHAR(20) DEFAULT 'PENDING',
  ai_model VARCHAR(50),
  processing_time INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_analysis_tasks (
  id SERIAL PRIMARY KEY,
  content_id INT NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('NEWS', 'USER_COMMENT', 'COMMUNITY_POST', 'USER_PROFILE')),
  analysis_type VARCHAR(30) NOT NULL CHECK (analysis_type IN ('SUMMARY', 'CLASSIFICATION', 'SENTIMENT', 'RELIABILITY', 'KEYWORD_EXTRACTION', 'FACT_CHECK', 'TOXICITY_DETECTION', 'SPAM_DETECTION', 'LANGUAGE_DETECTION', 'TRANSLATION')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING')),
  priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  ai_model VARCHAR(100),
  processing_time_seconds INT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  result TEXT,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  metadata TEXT,
  depends_on_task_id INT REFERENCES ai_analysis_tasks(id)
);

-- AI 분석 작업 테이블 인덱스 생성
CREATE INDEX idx_ai_analysis_tasks_content ON ai_analysis_tasks(content_id, content_type);
CREATE INDEX idx_ai_analysis_tasks_status ON ai_analysis_tasks(status);
CREATE INDEX idx_ai_analysis_tasks_priority ON ai_analysis_tasks(priority);
CREATE INDEX idx_ai_analysis_tasks_analysis_type ON ai_analysis_tasks(analysis_type);
CREATE INDEX idx_ai_analysis_tasks_scheduled_at ON ai_analysis_tasks(scheduled_at);
CREATE INDEX idx_ai_analysis_tasks_dependency ON ai_analysis_tasks(depends_on_task_id);

-- =============================================
-- 게시판(커뮤니티) 관련 테이블
-- =============================================

-- 게시판 카테고리 테이블 (Lab실, 취미, 먹고살기, 갤러리)
CREATE TABLE board_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 게시판 카테고리 인덱스 생성
CREATE INDEX idx_board_categories_name ON board_categories(name);
CREATE INDEX idx_board_categories_is_active ON board_categories(is_active);
CREATE INDEX idx_board_categories_display_order ON board_categories(display_order);

-- 게시판 테이블
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  category_id INT REFERENCES board_categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  allow_anonymous BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT false,
  post_count INT NOT NULL DEFAULT 0,
  last_post_at TIMESTAMP,
  created_by INT REFERENCES admin_users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 게시판 인덱스 생성
CREATE INDEX idx_boards_category ON boards(category);
CREATE INDEX idx_boards_category_id ON boards(category_id);
CREATE INDEX idx_boards_is_active ON boards(is_active);
CREATE INDEX idx_boards_display_order ON boards(display_order);
CREATE INDEX idx_boards_created_by ON boards(created_by);

-- 게시글 테이블
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  author_name VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  is_notice BOOLEAN NOT NULL DEFAULT false,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  excluded_from_best BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED', 'PENDING')),
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 인덱스 생성
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_notice ON posts(is_notice);
CREATE INDEX idx_posts_excluded_from_best ON posts(excluded_from_best);

-- 댓글 테이블
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  author_name VARCHAR(50),
  content TEXT NOT NULL,
  depth INT NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
  like_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED')),
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 댓글 인덱스 생성
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_depth ON comments(depth);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- 좋아요 테이블
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('POST', 'COMMENT')),
  target_id INT NOT NULL,
  user_id INT NOT NULL REFERENCES users(id),
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(target_type, target_id, user_id)
);

-- 좋아요 인덱스 생성
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- =============================================
-- 시스템 설정 테이블
-- =============================================

CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(500) NOT NULL,
  description VARCHAR(200),
  category VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 시스템 설정 인덱스 생성
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 기본 관리자 사용자 생성
INSERT INTO admin_users (username, email, password, role) VALUES
('admin', 'admin@factlab.com', 'admin123', 'SUPER_ADMIN');

-- 기본 게시판 카테고리 생성
INSERT INTO board_categories (name, description, display_order) VALUES
('Lab실', '커뮤니티 Lab 토론 공간', 1),
('취미', '취미 관련 게시판', 2),
('먹고살기', '경제/투자 관련 게시판', 3),
('갤러리', '이미지/영상 공유 공간', 4);

-- 기본 게시판 생성 (관리자 계정으로)
INSERT INTO boards (name, description, category, category_id, display_order, created_by) VALUES
-- Lab실 게시판
('Best', 'BEST 게시글 모음', 'Best', 1, 1, 1),
('자유Lab', '자유롭게 의견을 나누는 공간', '자유Lab', 1, 2, 1),
('정치Lab', '정치 이슈 토론 공간', '정치Lab', 1, 3, 1),
('경제Lab', '경제 이슈 토론 공간', '경제Lab', 1, 4, 1),
('사회Lab', '사회 이슈 토론 공간', '사회Lab', 1, 5, 1),

-- 취미 게시판
('골프', '골프 관련 정보 공유', '골프', 2, 11, 1),
('낚시', '낚시 관련 정보 공유', '낚시', 2, 12, 1),
('축구', '축구 관련 정보 공유', '축구', 2, 13, 1),
('야구', '야구 관련 정보 공유', '야구', 2, 14, 1),
('등산', '등산 관련 정보 공유', '등산', 2, 15, 1),
('건강/헬스', '건강 및 헬스 정보 공유', '건강/헬스', 2, 16, 1),
('여행', '여행 정보 공유', '여행', 2, 17, 1),
('게임', '게임 관련 정보 공유', '게임', 2, 18, 1),
('영화', '영화 관련 정보 공유', '영화', 2, 19, 1),

-- 먹고살기 게시판
('주식(국장)', '국내 주식 투자 정보', '주식(국장)', 3, 21, 1),
('주식(미장/기타)', '미국 및 기타 주식 투자 정보', '주식(미장/기타)', 3, 22, 1),
('가상화폐', '가상화폐 투자 정보', '가상화폐', 3, 23, 1),
('자동차', '자동차 관련 정보', '자동차', 3, 24, 1),
('부동산', '부동산 관련 정보', '부동산', 3, 25, 1),
('육아', '육아 관련 정보', '육아', 3, 26, 1),

-- 갤러리 게시판
('그림', '그림 작품 공유', '그림', 4, 31, 1),
('사진', '사진 작품 공유', '사진', 4, 32, 1),
('바탕화면', '바탕화면 이미지 공유', '바탕화면', 4, 33, 1),
('AI이미지', 'AI 생성 이미지 공유', 'AI이미지', 4, 34, 1),
('애들은가라(성인)', '성인 이미지 공유 (19+)', '애들은가라(성인)', 4, 35, 1);

-- 기본 공지사항 게시판 (별도)
INSERT INTO boards (name, description, category, display_order, created_by) VALUES
('공지사항', '사이트 운영에 관한 공지사항을 게시합니다.', '공지', 0, 1);

-- 샘플 게시글 데이터
INSERT INTO posts (board_id, user_id, author_name, title, content, is_notice) VALUES
(4, NULL, '관리자', 'FactLab 커뮤니티에 오신 것을 환영합니다!', 
'FactLab은 사실 확인과 건전한 토론을 위한 커뮤니티입니다. 

주요 기능:
- 뉴스 팩트체크 및 토론
- 자유로운 의견 교환
- 질문과 답변

건전한 토론 문화를 위해 다음 사항을 지켜주세요:
1. 상호 존중하는 대화
2. 근거 있는 주장
3. 개인정보 보호
4. 건전한 언어 사용

감사합니다.', true),

(1, NULL, '익명사용자', '첫 번째 자유게시판 글입니다', 
'자유게시판에 첫 글을 작성해봅니다. 
FactLab 커뮤니티가 활성화되길 기대합니다!', false),

(2, NULL, '뉴스관심러', '최근 뉴스에 대한 의견', 
'최근 보도된 뉴스들에 대해 함께 토론해보면 좋겠습니다. 
다양한 관점에서 사실을 확인하고 건전한 토론을 진행해봅시다.', false),

(3, NULL, '질문자', 'FactLab 사용법 문의', 
'FactLab을 처음 사용하는데 몇 가지 궁금한 점이 있습니다.
1. 게시글 작성 방법
2. 팩트체크 참여 방법
3. 포인트 시스템

자세한 안내 부탁드립니다.', false);

-- 샘플 댓글 데이터
INSERT INTO comments (post_id, user_id, author_name, content) VALUES
(2, NULL, '댓글러1', '좋은 글 감사합니다! 저도 적극 참여하겠습니다.'),
(2, NULL, '댓글러2', '커뮤니티가 활성화되면 좋겠어요.'),
(3, NULL, '토론좋아', '건전한 토론 문화 만들어봅시다!'),
(4, NULL, '도움이', '친절한 설명 감사합니다. 많은 도움이 되었어요.');

-- 게시글 댓글 수 업데이트
UPDATE posts SET comment_count = (
  SELECT COUNT(*) FROM comments WHERE post_id = posts.id AND status = 'ACTIVE'
);

-- 게시판 게시글 수 업데이트  
UPDATE boards SET post_count = (
  SELECT COUNT(*) FROM posts WHERE board_id = boards.id AND status = 'ACTIVE'
);

-- 게시판 마지막 게시글 시간 업데이트
UPDATE boards SET last_post_at = (
  SELECT MAX(created_at) FROM posts WHERE board_id = boards.id AND status = 'ACTIVE'
);

-- 시스템 설정 기본값 삽입
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
('best.min_view_count', '100', 'BEST 게시판 최소 조회수 기준', 'community'),
('best.min_like_count', '10', 'BEST 게시판 최소 추천수 기준', 'community'),
('board.posts_per_page', '20', '게시판 페이지당 게시글 수', 'community'),
('board.comments_per_page', '50', '댓글 페이지당 댓글 수', 'community');

-- =============================================
-- 뉴스 투표 테이블 생성
-- =============================================

-- 뉴스 투표 테이블
CREATE TABLE news_votes (
    id SERIAL PRIMARY KEY,
    news_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('FACT', 'PARTIAL_FACT', 'SLIGHT_DOUBT', 'DOUBT', 'UNKNOWN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(news_id, user_id) -- 한 사용자는 하나의 뉴스에 하나의 투표만 가능
);

-- 뉴스 투표 인덱스 생성
CREATE INDEX idx_news_votes_news_id ON news_votes(news_id);
CREATE INDEX idx_news_votes_user_id ON news_votes(user_id);
CREATE INDEX idx_news_votes_vote_type ON news_votes(vote_type);

-- =============================================
-- 팝업 관리 테이블
-- =============================================

-- 팝업 테이블
CREATE TABLE popups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    position VARCHAR(20) NOT NULL DEFAULT 'CENTER' CHECK (position IN ('CENTER', 'CUSTOM')),
    position_x INTEGER,
    position_y INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- 팝업 테이블 인덱스 생성
CREATE INDEX idx_popups_active ON popups(active);
CREATE INDEX idx_popups_start_date ON popups(start_date);
CREATE INDEX idx_popups_end_date ON popups(end_date);
CREATE INDEX idx_popups_display_period ON popups(start_date, end_date, active);
CREATE INDEX idx_popups_created_at ON popups(created_at);

-- =============================================
-- 기존 테스트 데이터 (뉴스 관련)
-- =============================================

