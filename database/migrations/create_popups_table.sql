-- 팝업 관리 테이블 생성
CREATE TABLE IF NOT EXISTS popups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    position VARCHAR(20) NOT NULL DEFAULT 'CENTER',
    position_x INTEGER,
    position_y INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_popups_active ON popups(active);
CREATE INDEX IF NOT EXISTS idx_popups_dates ON popups(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_popups_created_at ON popups(created_at);

-- 트리거 함수 생성 (updated_at 자동 갱신용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_popups_updated_at ON popups;
CREATE TRIGGER update_popups_updated_at
    BEFORE UPDATE ON popups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 추가 (테스트용)
INSERT INTO popups (title, content, link_url, link_text, start_date, end_date, position, created_by) VALUES
('FactLab 서비스 오픈 기념 이벤트', 
 '<h3>🎉 FactLab 정식 오픈 기념!</h3><p>신뢰할 수 있는 뉴스 플랫폼 FactLab이 정식 오픈했습니다.</p><p><strong>지금 가입하고 다양한 혜택을 받아보세요!</strong></p>', 
 '/register', 
 '회원가입 하기',
 NOW(),
 NOW() + INTERVAL '7 days',
 'CENTER',
 'admin'),
('중요 공지사항', 
 '<h4>📢 서비스 점검 안내</h4><p>더 나은 서비스 제공을 위해 시스템 점검을 실시합니다.</p><p><strong>점검시간:</strong> 2025년 8월 20일 오전 2시 ~ 6시</p><p>점검 중에는 일시적으로 서비스 이용이 제한됩니다.</p>', 
 '/notice', 
 '자세히 보기',
 NOW(),
 NOW() + INTERVAL '3 days',
 'CENTER',
 'admin')
ON CONFLICT DO NOTHING;