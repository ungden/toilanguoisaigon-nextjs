-- ============================================================
-- Migration: Blog SEO fields on posts table
-- Date: 2026-03-02
-- ============================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'guide';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS related_location_slugs TEXT[] DEFAULT '{}';

-- Backfill published_at from created_at for existing posts
UPDATE posts SET published_at = created_at WHERE published_at IS NULL;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC);
