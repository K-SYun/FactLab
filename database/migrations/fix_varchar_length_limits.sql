-- Fix character varying length limits that are causing crawler failures
-- Issue: "value too long for type character varying(500)" errors

-- Increase thumbnail URL length limit to handle longer URLs
ALTER TABLE news ALTER COLUMN thumbnail TYPE VARCHAR(1000);

-- Increase keywords field length to handle longer keyword strings  
ALTER TABLE news_summary ALTER COLUMN keywords TYPE TEXT;

-- Also increase URL length as a preventive measure
ALTER TABLE news ALTER COLUMN url TYPE VARCHAR(1000);

-- Add index on url for better performance with longer URLs
DROP INDEX IF EXISTS idx_news_url;
CREATE INDEX idx_news_url ON news(url);

-- Add comment for future reference
COMMENT ON COLUMN news.thumbnail IS 'Thumbnail image URL, increased to 1000 chars to handle long URLs';
COMMENT ON COLUMN news_summary.keywords IS 'News keywords, changed to TEXT to handle unlimited length';
COMMENT ON COLUMN news.url IS 'Source URL, increased to 1000 chars to handle long URLs';