-- ============================================================
-- Migration: Featured Locations + User Features
-- Date: 2026-03-02
-- ============================================================

-- 1. Add is_featured flag to locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 2. Add nickname (display_name) to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;

-- 3. Add google_maps_url + photo_urls to location_submissions
ALTER TABLE location_submissions ADD COLUMN IF NOT EXISTS google_maps_url text;
ALTER TABLE location_submissions ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';
ALTER TABLE location_submissions ADD COLUMN IF NOT EXISTS category_id integer REFERENCES categories(id);

-- 4. Create review_likes table
CREATE TABLE IF NOT EXISTS review_likes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- 5. Create user_collections table
CREATE TABLE IF NOT EXISTS user_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_public boolean DEFAULT true,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- 6. Create user_collection_locations junction table
CREATE TABLE IF NOT EXISTS user_collection_locations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  note text,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, location_id)
);

-- 7. RPC function: get featured/trending locations
CREATE OR REPLACE FUNCTION get_featured_locations(limit_count integer DEFAULT 8)
RETURNS SETOF locations
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM locations
  WHERE status = 'published'
  ORDER BY
    is_featured DESC NULLS LAST,
    (COALESCE(review_count, 0) * 2 + COALESCE(google_review_count, 0) * 0.5 + COALESCE(average_rating, 0) * 10) DESC,
    created_at DESC
  LIMIT limit_count;
$$;

-- 8. RLS policies for new tables
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collection_locations ENABLE ROW LEVEL SECURITY;

-- review_likes: anyone can read, authenticated users can insert/delete own
CREATE POLICY "review_likes_select" ON review_likes FOR SELECT USING (true);
CREATE POLICY "review_likes_insert" ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_likes_delete" ON review_likes FOR DELETE USING (auth.uid() = user_id);

-- user_collections: public ones readable by all, owner can CRUD
CREATE POLICY "user_collections_select" ON user_collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "user_collections_insert" ON user_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_collections_update" ON user_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_collections_delete" ON user_collections FOR DELETE USING (auth.uid() = user_id);

-- user_collection_locations: readable if collection is public/owned, writable by owner
CREATE POLICY "ucl_select" ON user_collection_locations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_collections uc
    WHERE uc.id = collection_id AND (uc.is_public = true OR uc.user_id = auth.uid())
  ));
CREATE POLICY "ucl_insert" ON user_collection_locations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_collections uc
    WHERE uc.id = collection_id AND uc.user_id = auth.uid()
  ));
CREATE POLICY "ucl_delete" ON user_collection_locations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_collections uc
    WHERE uc.id = collection_id AND uc.user_id = auth.uid()
  ));
