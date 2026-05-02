-- ============================================================
-- PRODUCTION SYSTEM v4 — Full Stack Upgrade
-- Server-side Streaks, Daily Stats, Avatar, Enhanced Leaderboard
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================

-- ══════════════════════════════════════════════════
-- 1. UPGRADE users_light TABLE
-- Add streak, last_active, avatar columns
-- ══════════════════════════════════════════════════

ALTER TABLE public.users_light 
  ADD COLUMN IF NOT EXISTS streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active DATE,
  ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS total_tests INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score FLOAT NOT NULL DEFAULT 0;

-- Index for fast leaderboard
CREATE INDEX IF NOT EXISTS idx_users_light_streak ON public.users_light(streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_light_total_tests ON public.users_light(total_tests DESC);

-- ══════════════════════════════════════════════════
-- 2. DAILY STATS TABLE
-- Tracks per-user per-day aggregated stats
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.daily_stats (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL,
  stat_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  tests_taken INT NOT NULL DEFAULT 0,
  total_score FLOAT NOT NULL DEFAULT 0,
  best_score  FLOAT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  total_time  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_daily_user_date UNIQUE (user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user ON public.daily_stats(user_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(stat_date DESC);

-- RLS: read own, service_role writes
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own daily stats" ON public.daily_stats;
CREATE POLICY "Users read own daily stats"
ON public.daily_stats FOR SELECT
USING (true);

-- ══════════════════════════════════════════════════
-- 3. RPC: UPSERT DAILY STATS
-- Called from /api/submit after each test
-- ══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION upsert_daily_stats(
  p_user_id UUID,
  p_score FLOAT,
  p_total_questions INT DEFAULT 0,
  p_correct INT DEFAULT 0,
  p_time_taken INT DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_stats (user_id, stat_date, tests_taken, total_score, best_score, total_questions, correct_answers, total_time)
  VALUES (p_user_id, CURRENT_DATE, 1, p_score, p_score, p_total_questions, p_correct, p_time_taken)
  ON CONFLICT (user_id, stat_date)
  DO UPDATE SET
    tests_taken = daily_stats.tests_taken + 1,
    total_score = daily_stats.total_score + EXCLUDED.total_score,
    best_score = GREATEST(daily_stats.best_score, EXCLUDED.best_score),
    total_questions = daily_stats.total_questions + EXCLUDED.total_questions,
    correct_answers = daily_stats.correct_answers + EXCLUDED.correct_answers,
    total_time = daily_stats.total_time + EXCLUDED.total_time,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════
-- 4. RPC: UPDATE STREAK
-- Server-side streak logic (replaces client-only)
-- ══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE(new_streak INT, is_new_day BOOLEAN) AS $$
DECLARE
  v_last_active DATE;
  v_current_streak INT;
  v_longest INT;
  v_diff INT;
  v_new_streak INT;
  v_is_new BOOLEAN := false;
BEGIN
  SELECT last_active, streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest
  FROM public.users_light
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, false;
    RETURN;
  END IF;

  -- Already active today
  IF v_last_active = CURRENT_DATE THEN
    RETURN QUERY SELECT v_current_streak, false;
    RETURN;
  END IF;

  v_is_new := true;

  IF v_last_active IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_diff := CURRENT_DATE - v_last_active;
    IF v_diff = 1 THEN
      -- Consecutive day → increment
      v_new_streak := v_current_streak + 1;
    ELSE
      -- Streak broken → reset
      v_new_streak := 1;
    END IF;
  END IF;

  -- Update user
  UPDATE public.users_light
  SET streak = v_new_streak,
      longest_streak = GREATEST(v_longest, v_new_streak),
      last_active = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_new_streak, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════
-- 5. RPC: ENHANCED LEADERBOARD
-- Shows best_score, total_tests, streak, avatar
-- ══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_leaderboard_v2(
  p_mode TEXT DEFAULT 'alltime',
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  username TEXT,
  best_score FLOAT,
  total_tests BIGINT,
  avg_score FLOAT,
  streak INT,
  avatar TEXT
) AS $$
BEGIN
  IF p_mode = 'daily' THEN
    -- Today's best scores
    RETURN QUERY
    SELECT 
      r.username,
      CAST(MAX(r.score_percent) AS FLOAT) as best_score,
      COUNT(*) as total_tests,
      CAST(AVG(r.score_percent) AS FLOAT) as avg_score,
      COALESCE(u.streak, 0) as streak,
      COALESCE(u.avatar, 'default') as avatar
    FROM public.results r
    LEFT JOIN public.users_light u ON u.username = r.username
    WHERE r.username IS NOT NULL
      AND r.created_at::DATE = CURRENT_DATE
    GROUP BY r.username, u.streak, u.avatar
    ORDER BY best_score DESC
    LIMIT p_limit;

  ELSIF p_mode = 'weekly' THEN
    -- This week's best scores
    RETURN QUERY
    SELECT 
      r.username,
      CAST(MAX(r.score_percent) AS FLOAT) as best_score,
      COUNT(*) as total_tests,
      CAST(AVG(r.score_percent) AS FLOAT) as avg_score,
      COALESCE(u.streak, 0) as streak,
      COALESCE(u.avatar, 'default') as avatar
    FROM public.results r
    LEFT JOIN public.users_light u ON u.username = r.username
    WHERE r.username IS NOT NULL
      AND r.created_at >= date_trunc('week', CURRENT_DATE)
    GROUP BY r.username, u.streak, u.avatar
    ORDER BY best_score DESC
    LIMIT p_limit;

  ELSE
    -- All-time leaderboard
    RETURN QUERY
    SELECT 
      r.username,
      CAST(MAX(r.score_percent) AS FLOAT) as best_score,
      COUNT(*) as total_tests,
      CAST(AVG(r.score_percent) AS FLOAT) as avg_score,
      COALESCE(u.streak, 0) as streak,
      COALESCE(u.avatar, 'default') as avatar
    FROM public.results r
    LEFT JOIN public.users_light u ON u.username = r.username
    WHERE r.username IS NOT NULL
    GROUP BY r.username, u.streak, u.avatar
    HAVING COUNT(*) >= 1
    ORDER BY best_score DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════
-- 6. RPC: GET USER PROFILE
-- For dashboard / profile page
-- ══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_profile(p_username TEXT)
RETURNS TABLE(
  username TEXT,
  streak INT,
  longest_streak INT,
  avatar TEXT,
  total_tests INT,
  avg_score FLOAT,
  best_score FLOAT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      r.username,
      MAX(r.score_percent) as max_score,
      ROW_NUMBER() OVER (ORDER BY MAX(r.score_percent) DESC) as rn
    FROM public.results r
    WHERE r.username IS NOT NULL
    GROUP BY r.username
  )
  SELECT 
    u.username,
    u.streak,
    u.longest_streak,
    COALESCE(u.avatar, 'default') as avatar,
    u.total_tests,
    CASE WHEN u.total_tests > 0 THEN u.total_score / u.total_tests ELSE 0 END as avg_score,
    COALESCE(rk.max_score, 0) as best_score,
    COALESCE(rk.rn, 0) as rank
  FROM public.users_light u
  LEFT JOIN ranked rk ON rk.username = u.username
  WHERE u.username = p_username
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════
-- 7. GRANT PERMISSIONS
-- ══════════════════════════════════════════════════

-- Allow anon/authenticated to read daily_stats
GRANT SELECT ON public.daily_stats TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users_light TO anon, authenticated;

-- Allow RPC execution
GRANT EXECUTE ON FUNCTION upsert_daily_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO anon, authenticated;
