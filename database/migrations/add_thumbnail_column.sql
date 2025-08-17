-- Add thumbnail field to news table
-- Date: 2024-08-02
-- Description: Add thumbnail image URL field for news articles

ALTER TABLE news 
ADD COLUMN thumbnail VARCHAR(500) NULL 
COMMENT '뉴스 썸네일 이미지 URL';

-- Create index for performance if needed (optional)
-- CREATE INDEX idx_news_thumbnail ON news(thumbnail);

-- Update existing records with null thumbnail (optional)
-- UPDATE news SET thumbnail = NULL WHERE thumbnail IS NULL;