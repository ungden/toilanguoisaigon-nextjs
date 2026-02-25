-- ============================================
-- Playlists: AI-generated daily food playlists
-- Run this on Supabase SQL Editor
-- ============================================

-- 1. Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  mood TEXT CHECK (mood IN (
    'morning', 'lunch', 'dinner', 'late-night',
    'rainy-day', 'weekend', 'date-night', 'family',
    'budget', 'premium', 'adventure', 'comfort',
    'healthy', 'street-food', 'seasonal'
  )),
  emoji TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_context TEXT,
  location_count INTEGER NOT NULL DEFAULT 0
);

-- 2. Playlist-Location join table (ordered)
CREATE TABLE IF NOT EXISTS playlist_locations (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  ai_note TEXT,
  PRIMARY KEY (playlist_id, location_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlists_generated_date ON playlists(generated_date DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_is_featured ON playlists(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_playlists_mood ON playlists(mood);
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);
CREATE INDEX IF NOT EXISTS idx_playlist_locations_playlist ON playlist_locations(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_locations_location ON playlist_locations(location_id);

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_playlist_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_updated_at();

-- 5. Auto-update location_count trigger
CREATE OR REPLACE FUNCTION update_playlist_location_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE playlists 
    SET location_count = (
      SELECT COUNT(*) FROM playlist_locations WHERE playlist_id = NEW.playlist_id
    )
    WHERE id = NEW.playlist_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE playlists 
    SET location_count = (
      SELECT COUNT(*) FROM playlist_locations WHERE playlist_id = OLD.playlist_id
    )
    WHERE id = OLD.playlist_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_playlist_location_count
  AFTER INSERT OR UPDATE OR DELETE ON playlist_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_location_count();

-- 6. RLS policies
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_locations ENABLE ROW LEVEL SECURITY;

-- Public read access for published playlists
CREATE POLICY "Anyone can view published playlists"
  ON playlists FOR SELECT
  USING (status = 'published');

-- Admin full access
CREATE POLICY "Admins can manage playlists"
  ON playlists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Public read for playlist_locations (if playlist is published)
CREATE POLICY "Anyone can view playlist locations of published playlists"
  ON playlist_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = playlist_id AND status = 'published'
    )
  );

-- Admin full access for playlist_locations
CREATE POLICY "Admins can manage playlist locations"
  ON playlist_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
