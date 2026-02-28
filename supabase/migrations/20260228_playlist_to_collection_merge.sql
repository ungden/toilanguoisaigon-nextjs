-- Playlist → Collection Full Merge Migration
-- Date: 2026-02-28
--
-- This migration merges the playlists/playlist_locations tables into
-- collections/collection_locations, completing the UI merge done earlier.
--
-- Steps performed (via Management API before this file was created):
-- 1. Added columns to collections: mood, emoji, status, is_featured,
--    generated_date, ai_context, source, updated_at
-- 2. Added columns to collection_locations: position, ai_note
-- 3. Migrated 28 playlists → collections (source='ai')
-- 4. Migrated 190 playlist_locations → collection_locations
-- 5. Set source='manual' for 16 existing collections
-- 6. Dropped playlists and playlist_locations tables

-- These are the DDL statements for reference (already applied):

-- ALTER TABLE collections
--   ADD COLUMN IF NOT EXISTS mood text,
--   ADD COLUMN IF NOT EXISTS emoji text,
--   ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
--   ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
--   ADD COLUMN IF NOT EXISTS generated_date date,
--   ADD COLUMN IF NOT EXISTS ai_context text,
--   ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
--   ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- ALTER TABLE collection_locations
--   ADD COLUMN IF NOT EXISTS position integer,
--   ADD COLUMN IF NOT EXISTS ai_note text;

-- Data migration:
-- INSERT INTO collections (title, description, slug, ..., source)
--   SELECT title, description, slug, ..., 'ai' FROM playlists;
-- INSERT INTO collection_locations (collection_id, location_id, position, ai_note)
--   SELECT mapping.new_id, pl.location_id, pl.position, pl.ai_note
--   FROM playlist_locations pl JOIN mapping ...;

-- DROP TABLE IF EXISTS playlist_locations CASCADE;
-- DROP TABLE IF EXISTS playlists CASCADE;

-- UPDATE collections SET source = 'manual' WHERE source IS NULL;
