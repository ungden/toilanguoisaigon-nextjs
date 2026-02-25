-- ============================================
-- Add Google Maps review fields to locations
-- Run this on Supabase SQL Editor
-- ============================================

ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_maps_uri TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_review_count INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_review_summary TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_highlights TEXT[];

-- Index for deduplication by place_id
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id
  ON locations(google_place_id) WHERE google_place_id IS NOT NULL;
