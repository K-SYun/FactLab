-- Fix remaining VARCHAR limitations that are still causing crawler issues

-- Increase title length to handle very long news titles
ALTER TABLE news ALTER COLUMN title TYPE VARCHAR(500);

-- Increase source name length to handle long source names
ALTER TABLE news ALTER COLUMN source TYPE VARCHAR(200);

-- Increase category length for longer category names
ALTER TABLE news ALTER COLUMN category TYPE VARCHAR(100);

-- Comments for future reference
COMMENT ON COLUMN news.title IS 'News title, increased to 500 chars for longer titles';
COMMENT ON COLUMN news.source IS 'News source, increased to 200 chars for longer source names';
COMMENT ON COLUMN news.category IS 'News category, increased to 100 chars for longer categories';