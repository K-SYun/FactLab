-- 뉴스 승인 시간 컬럼 추가 마이그레이션
-- 실행일: 2024-07-30

-- approved_at 컬럼 추가
ALTER TABLE news ADD COLUMN approved_at TIMESTAMP;

-- 기존 승인된 뉴스들에 대해 승인 시간을 updated_at으로 설정
UPDATE news 
SET approved_at = updated_at 
WHERE status = 'APPROVED';

-- 인덱스 추가 (승인된 뉴스의 승인 시간 기준 정렬을 위해)
CREATE INDEX idx_news_approved_at ON news(approved_at) WHERE status = 'APPROVED';

-- 승인 시간 기준 정렬을 위한 복합 인덱스
CREATE INDEX idx_news_status_approved_at ON news(status, approved_at);
CREATE INDEX idx_news_category_status_approved_at ON news(category, status, approved_at);

COMMENT ON COLUMN news.approved_at IS '뉴스 승인 시간 (status가 APPROVED로 변경된 시점)';