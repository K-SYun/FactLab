-- 기존 테스트 데이터 삭제
-- 실행일: 2024-07-30

-- 외래키 순서 고려하여 삭제
DELETE FROM news_summary;
DELETE FROM ai_analysis_tasks;
DELETE FROM news;

-- AUTO_INCREMENT 초기화 (PostgreSQL의 경우 SERIAL 시퀀스 초기화)
ALTER SEQUENCE news_id_seq RESTART WITH 1;
ALTER SEQUENCE news_summary_id_seq RESTART WITH 1;
ALTER SEQUENCE ai_analysis_tasks_id_seq RESTART WITH 1;

-- 삭제 확인
SELECT 'News count: ' || COUNT(*) as result FROM news
UNION ALL
SELECT 'News Summary count: ' || COUNT(*) FROM news_summary
UNION ALL
SELECT 'AI Analysis Tasks count: ' || COUNT(*) FROM ai_analysis_tasks;