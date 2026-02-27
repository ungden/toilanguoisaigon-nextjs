-- ============================================================================
-- Row Level Security (RLS) Policies for Production Launch
-- ============================================================================
-- This migration enables RLS on all major tables and creates policies
-- so that only admin users can perform write operations on content tables,
-- while all users can read published content.
-- ============================================================================

-- ─── Helper function: check if current user is admin ────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATIONS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read published locations
CREATE POLICY "locations_select_published"
  ON public.locations FOR SELECT
  USING (status = 'published' OR public.is_admin());

-- Only admins can insert/update/delete
CREATE POLICY "locations_insert_admin"
  ON public.locations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "locations_update_admin"
  ON public.locations FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "locations_delete_admin"
  ON public.locations FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- COLLECTIONS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_select_all"
  ON public.collections FOR SELECT
  USING (true);

CREATE POLICY "collections_insert_admin"
  ON public.collections FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "collections_update_admin"
  ON public.collections FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "collections_delete_admin"
  ON public.collections FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- COLLECTION_LOCATIONS (join table)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.collection_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_locations_select_all"
  ON public.collection_locations FOR SELECT
  USING (true);

CREATE POLICY "collection_locations_insert_admin"
  ON public.collection_locations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "collection_locations_delete_admin"
  ON public.collection_locations FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- COLLECTION_CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.collection_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_categories_select_all"
  ON public.collection_categories FOR SELECT
  USING (true);

CREATE POLICY "collection_categories_insert_admin"
  ON public.collection_categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "collection_categories_update_admin"
  ON public.collection_categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "collection_categories_delete_admin"
  ON public.collection_categories FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- PLAYLISTS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlists_select_published"
  ON public.playlists FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "playlists_insert_admin"
  ON public.playlists FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "playlists_update_admin"
  ON public.playlists FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "playlists_delete_admin"
  ON public.playlists FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- PLAYLIST_LOCATIONS (join table)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.playlist_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_locations_select_all"
  ON public.playlist_locations FOR SELECT
  USING (true);

CREATE POLICY "playlist_locations_insert_admin"
  ON public.playlist_locations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "playlist_locations_delete_admin"
  ON public.playlist_locations FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- POSTS (blog)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_published"
  ON public.posts FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "posts_insert_admin"
  ON public.posts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "posts_update_admin"
  ON public.posts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "posts_delete_admin"
  ON public.posts FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "reviews_select_all"
  ON public.reviews FOR SELECT
  USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews; admins can update any
CREATE POLICY "reviews_update_own_or_admin"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can delete their own reviews; admins can delete any
CREATE POLICY "reviews_delete_own_or_admin"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (for leaderboard, review authors, etc.)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile (e.g. XP adjustments)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- USER_ROLES
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role; admins can read all
CREATE POLICY "user_roles_select"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Only admins can modify roles
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATION_SUBMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.location_submissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own submissions; admins can see all
CREATE POLICY "submissions_select"
  ON public.location_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Authenticated users can submit locations
CREATE POLICY "submissions_insert_own"
  ON public.location_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update submission status
CREATE POLICY "submissions_update_admin"
  ON public.location_submissions FOR UPDATE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- SAVED_LOCATIONS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_locations_select_own"
  ON public.saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_locations_insert_own"
  ON public.saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_locations_delete_own"
  ON public.saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- LEVELS & XP_ACTIONS & BADGES (gamification - admin-managed)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "levels_select_all"
  ON public.levels FOR SELECT
  USING (true);

CREATE POLICY "levels_modify_admin"
  ON public.levels FOR ALL
  USING (public.is_admin());

ALTER TABLE public.xp_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_actions_select_all"
  ON public.xp_actions FOR SELECT
  USING (true);

CREATE POLICY "xp_actions_modify_admin"
  ON public.xp_actions FOR ALL
  USING (public.is_admin());

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_all"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "badges_modify_admin"
  ON public.badges FOR ALL
  USING (public.is_admin());
