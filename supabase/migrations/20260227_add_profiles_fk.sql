-- ============================================================================
-- Add foreign key constraints from user-referencing tables → public.profiles
-- ============================================================================
-- PostgREST requires a direct FK to resolve `profiles(...)` joins.
-- Currently these columns reference auth.users(id) but NOT profiles(id).
-- Since profiles.id = auth.users.id (1:1), adding FKs to profiles is safe.
--
-- Run this in Supabase Dashboard → SQL Editor.
-- ============================================================================

-- posts.author_id → profiles.id
-- (allows: .select('*, profiles(full_name, avatar_url)') on posts)
ALTER TABLE public.posts
  ADD CONSTRAINT fk_posts_author_profile
  FOREIGN KEY (author_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- reviews.user_id → profiles.id
-- (allows: .select('*, profiles(full_name, avatar_url)') on reviews)
ALTER TABLE public.reviews
  ADD CONSTRAINT fk_reviews_user_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- location_submissions.user_id → profiles.id
-- (allows: .select('*, profiles(full_name)') on location_submissions)
ALTER TABLE public.location_submissions
  ADD CONSTRAINT fk_submissions_user_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- user_xp_logs.user_id → profiles.id
ALTER TABLE public.user_xp_logs
  ADD CONSTRAINT fk_xp_logs_user_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- user_badges.user_id → profiles.id
ALTER TABLE public.user_badges
  ADD CONSTRAINT fk_user_badges_user_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- daily_checkins.user_id → profiles.id
ALTER TABLE public.daily_checkins
  ADD CONSTRAINT fk_checkins_user_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- saved_locations.user_id → profiles.id (for future joins)
ALTER TABLE public.saved_locations
  ADD CONSTRAINT fk_saved_locations_user_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;
