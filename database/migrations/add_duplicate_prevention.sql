-- 뉴스 중복 방지를 위한 제약 조건 및 인덱스 추가

-- 1. 정규화된 제목 체크를 위한 함수 생성
CREATE OR REPLACE FUNCTION normalize_title(input_title TEXT) 
RETURNS TEXT AS $$
BEGIN
    IF input_title IS NULL OR input_title = '' THEN
        RETURN '';
    END IF;
    
    -- 특수문자 제거 후 공백 정규화 및 소문자 변환
    RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(input_title, '[^\w\s가-힣]', '', 'g'), '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. 기존 중복 데이터 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW duplicate_news AS
SELECT 
    n1.id as id1,
    n2.id as id2,
    n1.title,
    n1.url as url1,
    n2.url as url2,
    n1.source,
    n1.publish_date
FROM news n1
JOIN news n2 ON n1.id < n2.id
WHERE (
    -- URL 기반 중복 (정규화된 URL 비교)
    REGEXP_REPLACE(n1.url, '/comment/', '/', 'g') = REGEXP_REPLACE(n2.url, '/comment/', '/', 'g')
    OR
    -- 제목 기반 중복 (같은 날짜, 같은 소스)
    (
        n1.source = n2.source 
        AND DATE(n1.publish_date) = DATE(n2.publish_date)
        AND normalize_title(n1.title) = normalize_title(n2.title)
        AND normalize_title(n1.title) != ''
    )
);

-- 3. 중복 방지를 위한 부분 인덱스 추가
-- 제목 기반 중복 방지: 같은 출처, 같은 날짜, 정규화된 제목
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_duplicate_title 
ON news (source, date(publish_date), normalize_title(title)) 
WHERE normalize_title(title) != '';

-- URL 정규화 기반 중복 방지
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_normalized_url 
ON news (REGEXP_REPLACE(url, '/comment/', '/', 'g'));

-- 4. 중복 체크 성능 향상을 위한 추가 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_source_date 
ON news (source, publish_date);

-- 5. 중복 데이터 정리를 위한 함수 생성
CREATE OR REPLACE FUNCTION clean_duplicate_news() 
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    duplicate_record RECORD;
    total_deleted INTEGER := 0;
BEGIN
    -- 중복 데이터 삭제 (더 높은 ID를 가진 중복 데이터 삭제)
    FOR duplicate_record IN 
        SELECT id2 as duplicate_id FROM duplicate_news 
        ORDER BY id2
    LOOP
        DELETE FROM news WHERE id = duplicate_record.duplicate_id;
        total_deleted := total_deleted + 1;
        
        -- 진행 상황 로그
        IF total_deleted % 10 = 0 THEN
            RAISE NOTICE '중복 뉴스 삭제 진행: % 개 삭제됨', total_deleted;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT total_deleted;
END;
$$ LANGUAGE plpgsql;

-- 6. 통계 정보 업데이트
ANALYZE news;

-- 사용법 안내 주석
-- 중복 데이터 확인: SELECT * FROM duplicate_news;
-- 중복 데이터 정리: SELECT clean_duplicate_news();
-- 정규화 함수 테스트: SELECT normalize_title('제목 테스트!!!');