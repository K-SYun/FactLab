-- Add excluded_from_best column to posts table
-- This column allows administrators to exclude specific posts from appearing in the BEST board

ALTER TABLE posts ADD COLUMN excluded_from_best BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_posts_excluded_from_best ON posts(excluded_from_best);

-- Add comment for documentation
COMMENT ON COLUMN posts.excluded_from_best IS 'Flag to exclude this post from BEST board (managed by admin)';