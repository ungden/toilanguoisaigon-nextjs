-- ============================================================================
-- Gamification System: user_xp_logs, user_badges, daily_checkins
-- ============================================================================

-- ─── XP Logs (audit trail of all XP transactions) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.user_xp_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_name text NOT NULL REFERENCES public.xp_actions(action_name),
  xp_value integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_xp_logs_user_id ON public.user_xp_logs(user_id);
CREATE INDEX idx_user_xp_logs_action ON public.user_xp_logs(action_name);
CREATE INDEX idx_user_xp_logs_created ON public.user_xp_logs(created_at DESC);

-- ─── User Badges (which badges a user has earned) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id integer NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- ─── Daily Check-ins (streak tracking) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  streak integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_daily_checkins_user_id ON public.daily_checkins(user_id);
CREATE INDEX idx_daily_checkins_date ON public.daily_checkins(checkin_date DESC);

-- ─── Add SAVE_LOCATION xp_action if not exists ─────────────────────────────
INSERT INTO public.xp_actions (action_name, xp_value, description)
VALUES ('SAVE_LOCATION', 3, 'Lưu một địa điểm vào sổ tay.')
ON CONFLICT (action_name) DO NOTHING;

-- ─── Add DAILY_CHECKIN xp_action (separate from DAILY_LOGIN) ────────────────
INSERT INTO public.xp_actions (action_name, xp_value, description)
VALUES ('DAILY_CHECKIN', 10, 'Điểm danh hàng ngày.')
ON CONFLICT (action_name) DO NOTHING;

-- ─── Add CHECKIN_STREAK_BONUS xp_action ─────────────────────────────────────
INSERT INTO public.xp_actions (action_name, xp_value, description)
VALUES ('CHECKIN_STREAK_BONUS', 5, 'Bonus XP cho mỗi ngày streak liên tiếp (nhân với số ngày streak).')
ON CONFLICT (action_name) DO NOTHING;

-- ─── Seed some default badges ───────────────────────────────────────────────
INSERT INTO public.badges (name, description, icon_name) VALUES
  ('Người mới', 'Tạo tài khoản và bắt đầu hành trình', 'baby'),
  ('Nhà phê bình', 'Viết 5 đánh giá', 'message-square'),
  ('Reviewer chuyên nghiệp', 'Viết 20 đánh giá', 'message-circle'),
  ('Thám tử ẩm thực', 'Lưu 10 địa điểm vào sổ tay', 'bookmark'),
  ('Sưu tầm viên', 'Lưu 50 địa điểm vào sổ tay', 'library'),
  ('Người đóng góp', 'Gửi 3 địa điểm mới', 'map-pin'),
  ('Siêng năng', 'Điểm danh 7 ngày liên tiếp', 'flame'),
  ('Kiên trì', 'Điểm danh 30 ngày liên tiếp', 'trophy'),
  ('Cấp 5 đạt được', 'Đạt cấp độ Thổ Địa Quận 1', 'award'),
  ('Cấp 10 đạt được', 'Đạt cấp độ Tôi là người Sài Gòn', 'crown')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ATOMIC award_xp() FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════
-- Awards XP to a user, logs the transaction, and auto-levels up.
-- Returns JSON with: xp_awarded, new_xp, old_level, new_level, leveled_up
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_action_name text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_value integer;
  v_old_xp integer;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
BEGIN
  -- 1. Look up XP value for this action
  SELECT xp_value INTO v_xp_value
  FROM public.xp_actions
  WHERE action_name = p_action_name;

  IF v_xp_value IS NULL THEN
    RETURN jsonb_build_object('error', 'Unknown action: ' || p_action_name);
  END IF;

  -- 2. Get current XP and level
  SELECT xp, level INTO v_old_xp, v_old_level
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_old_xp IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- 3. Calculate new XP
  v_new_xp := v_old_xp + v_xp_value;

  -- 4. Calculate new level based on XP thresholds
  SELECT COALESCE(MAX(level), v_old_level) INTO v_new_level
  FROM public.levels
  WHERE xp_required <= v_new_xp;

  -- 5. Update profile
  UPDATE public.profiles
  SET xp = v_new_xp,
      level = v_new_level,
      updated_at = now()
  WHERE id = p_user_id;

  -- 6. Log the XP transaction
  INSERT INTO public.user_xp_logs (user_id, action_name, xp_value, metadata)
  VALUES (p_user_id, p_action_name, v_xp_value, p_metadata);

  -- 7. Return result
  RETURN jsonb_build_object(
    'xp_awarded', v_xp_value,
    'new_xp', v_new_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- daily_checkin() FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════
-- Handles daily check-in: checks if already checked in today, calculates
-- streak, awards base XP + streak bonus, returns result.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.daily_checkin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_existing_checkin_id bigint;
  v_yesterday_streak integer;
  v_new_streak integer;
  v_base_xp_result jsonb;
  v_streak_bonus integer;
  v_streak_xp_per_day integer;
  v_total_xp integer;
BEGIN
  -- 1. Check if already checked in today
  SELECT id INTO v_existing_checkin_id
  FROM public.daily_checkins
  WHERE user_id = p_user_id AND checkin_date = v_today;

  IF v_existing_checkin_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'already_checked_in', true,
      'checkin_date', v_today
    );
  END IF;

  -- 2. Check yesterday's streak
  SELECT streak INTO v_yesterday_streak
  FROM public.daily_checkins
  WHERE user_id = p_user_id AND checkin_date = v_yesterday;

  v_new_streak := COALESCE(v_yesterday_streak, 0) + 1;

  -- 3. Insert today's check-in
  INSERT INTO public.daily_checkins (user_id, checkin_date, streak)
  VALUES (p_user_id, v_today, v_new_streak);

  -- 4. Award base check-in XP
  v_base_xp_result := public.award_xp(
    p_user_id,
    'DAILY_CHECKIN',
    jsonb_build_object('streak', v_new_streak, 'date', v_today)
  );

  v_total_xp := (v_base_xp_result->>'xp_awarded')::integer;

  -- 5. Award streak bonus if streak > 1
  -- Bonus = streak_xp_per_day * (streak - 1), capped at streak 30
  IF v_new_streak > 1 THEN
    SELECT xp_value INTO v_streak_xp_per_day
    FROM public.xp_actions
    WHERE action_name = 'CHECKIN_STREAK_BONUS';

    v_streak_bonus := COALESCE(v_streak_xp_per_day, 5) * LEAST(v_new_streak - 1, 29);

    -- Directly add streak bonus (don't go through award_xp to avoid double-logging)
    UPDATE public.profiles
    SET xp = xp + v_streak_bonus,
        updated_at = now()
    WHERE id = p_user_id;

    -- Log streak bonus separately
    INSERT INTO public.user_xp_logs (user_id, action_name, xp_value, metadata)
    VALUES (p_user_id, 'CHECKIN_STREAK_BONUS', v_streak_bonus,
            jsonb_build_object('streak', v_new_streak, 'date', v_today));

    v_total_xp := v_total_xp + v_streak_bonus;

    -- Recalculate level after bonus
    DECLARE
      v_current_xp integer;
      v_recalc_level integer;
    BEGIN
      SELECT xp INTO v_current_xp FROM public.profiles WHERE id = p_user_id;
      SELECT COALESCE(MAX(level), 1) INTO v_recalc_level
      FROM public.levels WHERE xp_required <= v_current_xp;
      UPDATE public.profiles SET level = v_recalc_level WHERE id = p_user_id;
    END;
  END IF;

  -- 6. Return result
  RETURN jsonb_build_object(
    'already_checked_in', false,
    'streak', v_new_streak,
    'xp_awarded', v_total_xp,
    'checkin_date', v_today,
    'new_xp', (SELECT xp FROM public.profiles WHERE id = p_user_id),
    'new_level', (SELECT level FROM public.profiles WHERE id = p_user_id),
    'leveled_up', (v_base_xp_result->>'leveled_up')::boolean
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES for new tables
-- ═══════════════════════════════════════════════════════════════════════════

-- user_xp_logs: users see own, admins see all
ALTER TABLE public.user_xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_logs_select_own"
  ON public.user_xp_logs FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "xp_logs_insert_system"
  ON public.user_xp_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_badges: everyone can see (for profile display), system inserts
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_all"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "user_badges_insert_system"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_badges_delete_admin"
  ON public.user_badges FOR DELETE
  USING (public.is_admin());

-- daily_checkins: users see own, admins see all
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_select_own"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "checkins_insert_own"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);
