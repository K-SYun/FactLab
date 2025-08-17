-- Add suspicious_points column to news_summary table
-- This column stores AI-generated suspicious points for fact-checking

ALTER TABLE news_summary 
ADD COLUMN IF NOT EXISTS suspicious_points TEXT;

-- Update column comment for documentation
COMMENT ON COLUMN news_summary.suspicious_points IS 'AI-generated suspicious points for fact-checking analysis';

-- Create index for better performance when querying suspicious points
CREATE INDEX IF NOT EXISTS idx_news_summary_suspicious_points ON news_summary(suspicious_points) WHERE suspicious_points IS NOT NULL;

-- Add default values for existing records
UPDATE news_summary 
SET suspicious_points = '팩트체킹이 필요한 내용을 분석 중입니다.'
WHERE suspicious_points IS NULL OR suspicious_points = '';