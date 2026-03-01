-- ============================================================
-- Migration: Dynamic Homepage — save_count, latest_review_at,
--   triggers, updated RPCs, trending/active RPCs
-- Date: 2026-03-02
-- ============================================================

-- 1. Add computed columns to locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS save_count integer DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS latest_review_at timestamptz;

-- 2. Backfill save_count from saved_locations
UPDATE locations l
SET save_count = sub.cnt
FROM (
  SELECT location_id, COUNT(*) AS cnt
  FROM saved_locations
  GROUP BY location_id
) sub
WHERE l.id = sub.location_id;

-- 3. Backfill latest_review_at from reviews
UPDATE locations l
SET latest_review_at = sub.latest
FROM (
  SELECT location_id, MAX(created_at) AS latest
  FROM reviews
  GROUP BY location_id
) sub
WHERE l.id = sub.location_id;

-- 4. Trigger: auto-update save_count on saved_locations insert
CREATE OR REPLACE FUNCTION update_save_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE locations SET save_count = save_count + 1 WHERE id = NEW.location_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_save_count_insert ON saved_locations;
CREATE TRIGGER trg_save_count_insert
  AFTER INSERT ON saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_save_count_on_insert();

-- 5. Trigger: auto-update save_count on saved_locations delete
CREATE OR REPLACE FUNCTION update_save_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE locations SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.location_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_save_count_delete ON saved_locations;
CREATE TRIGGER trg_save_count_delete
  AFTER DELETE ON saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_save_count_on_delete();

-- 6. Trigger: auto-update latest_review_at on reviews insert
CREATE OR REPLACE FUNCTION update_latest_review_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE locations SET latest_review_at = NEW.created_at WHERE id = NEW.location_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_latest_review ON reviews;
CREATE TRIGGER trg_latest_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_latest_review_at();

-- 7. Updated get_featured_locations — with time-decay + randomization in top 20
CREATE OR REPLACE FUNCTION get_featured_locations(limit_count integer DEFAULT 8)
RETURNS SETOF locations
LANGUAGE sql
STABLE
AS $$
  WITH scored AS (
    SELECT l.*, (
      -- Base score: reviews + rating
      COALESCE(l.review_count, 0) * 3
      + COALESCE(l.google_review_count, 0) * 0.3
      + COALESCE(l.average_rating, 0) * 15
      + COALESCE(l.save_count, 0) * 5
      -- Boost for featured
      + CASE WHEN l.is_featured THEN 50 ELSE 0 END
      -- Time decay: newer locations get a boost (0-30 points, decays over 90 days)
      + GREATEST(0, 30 - EXTRACT(EPOCH FROM (now() - l.created_at)) / 86400 / 3)
      -- Recent activity boost: review in last 7 days
      + CASE WHEN l.latest_review_at > now() - interval '7 days' THEN 20 ELSE 0 END
      -- Add small random factor for variety (0-10)
      + random() * 10
    ) AS _score
    FROM locations l
    WHERE l.status = 'published'
    ORDER BY _score DESC
    LIMIT limit_count * 3
  ),
  top_ids AS (
    SELECT id FROM scored ORDER BY _score DESC LIMIT limit_count
  )
  SELECT l.* FROM locations l INNER JOIN top_ids t ON l.id = t.id;
$$;

-- 8. New RPC: get_trending_locations — highest engagement velocity
CREATE OR REPLACE FUNCTION get_trending_locations(limit_count integer DEFAULT 8)
RETURNS SETOF locations
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM locations
  WHERE status = 'published'
    AND (
      latest_review_at > now() - interval '30 days'
      OR save_count >= 3
      OR created_at > now() - interval '14 days'
    )
  ORDER BY
    -- Prioritize recent reviews
    CASE WHEN latest_review_at > now() - interval '7 days' THEN 3
         WHEN latest_review_at > now() - interval '14 days' THEN 2
         WHEN latest_review_at > now() - interval '30 days' THEN 1
         ELSE 0
    END DESC,
    -- Then by saves
    COALESCE(save_count, 0) DESC,
    -- Then by recency
    created_at DESC
  LIMIT limit_count;
$$;

-- 9. New RPC: get_recently_active_locations — locations with recent activity
CREATE OR REPLACE FUNCTION get_recently_active_locations(limit_count integer DEFAULT 8)
RETURNS SETOF locations
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM locations
  WHERE status = 'published'
    AND (
      latest_review_at > now() - interval '7 days'
      OR created_at > now() - interval '7 days'
    )
  ORDER BY
    GREATEST(
      COALESCE(latest_review_at, '2000-01-01'::timestamptz),
      created_at
    ) DESC
  LIMIT limit_count;
$$;
