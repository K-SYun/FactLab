-- Final fix for all VARCHAR limitations - make all potentially long fields TEXT

-- Change URL to TEXT to handle extremely long URLs
ALTER TABLE news ALTER COLUMN url TYPE TEXT;

-- Change thumbnail to TEXT to handle extremely long thumbnail URLs  
ALTER TABLE news ALTER COLUMN thumbnail TYPE TEXT;

-- Comments
COMMENT ON COLUMN news.url IS 'Source URL, changed to TEXT for unlimited length';
COMMENT ON COLUMN news.thumbnail IS 'Thumbnail URL, changed to TEXT for unlimited length';