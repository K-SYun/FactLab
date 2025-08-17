-- Insert default settings for BEST board criteria
-- These settings can be modified by administrators

INSERT INTO system_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES 
    ('best.min_view_count', '100', 'board', 'BEST 게시판에 포함되기 위한 최소 조회수', NOW(), NOW()),
    ('best.min_like_count', '10', 'board', 'BEST 게시판에 포함되기 위한 최소 추천수', NOW(), NOW())
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Add comment for table
COMMENT ON TABLE system_settings IS 'System configuration settings including BEST board criteria';