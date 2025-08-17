-- Add visibility column to news table
-- This field controls whether approved news are publicly visible to users
-- Values: 'PUBLIC' (default), 'PRIVATE'

ALTER TABLE news ADD COLUMN visibility VARCHAR(20) DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE'));

-- Add index for visibility column for better query performance
CREATE INDEX idx_news_visibility ON news(visibility);

-- Add combined index for status and visibility (commonly used together)
CREATE INDEX idx_news_status_visibility ON news(status, visibility);

-- Update existing approved news to be public by default
UPDATE news SET visibility = 'PUBLIC' WHERE status = 'APPROVED';

-- Add comment for documentation
COMMENT ON COLUMN news.visibility IS 'Controls public visibility of approved news. PUBLIC: visible to users, PRIVATE: hidden from users';