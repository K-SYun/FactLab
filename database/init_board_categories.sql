-- Board Categories 테이블 생성 및 초기 데이터 삽입

-- 테이블 생성
CREATE TABLE IF NOT EXISTS board_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 초기 카테고리 데이터 삽입
INSERT INTO board_categories (name, description, display_order, is_active) VALUES
-- Lab실
('Lab실', 'Lab실 - 다양한 주제의 토론과 정보 공유', 1, true),

-- 취미  
('취미', '취미 활동과 관련된 게시판들', 2, true),

-- 먹고살기
('먹고살기', '경제, 투자, 생활 관련 게시판들', 3, true),

-- 갤러리
('갤러리', '이미지, 사진, 창작 관련 게시판들', 4, true)

ON CONFLICT (name) DO NOTHING;

-- boards 테이블에 category_id 외래키 컬럼 추가 (기존 category 컬럼은 유지)
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES board_categories(id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_board_categories_display_order ON board_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_board_categories_active ON board_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_boards_category_id ON boards(category_id);

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_board_categories_updated_at ON board_categories;
CREATE TRIGGER update_board_categories_updated_at
    BEFORE UPDATE ON board_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();