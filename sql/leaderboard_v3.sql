-- ============================================================
-- Leaderboard v3 Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================

-- 1. User flags table (persistent cheat detection)
CREATE TABLE IF NOT EXISTS public.user_flags (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL,
  is_flagged  BOOLEAN NOT NULL DEFAULT true,
  flag_reason TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,  -- null = still flagged

  CONSTRAINT fk_user_flags_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_flags_user_id ON public.user_flags(user_id) WHERE is_flagged = true;

-- 2. RLS: only service_role can read/write (backend-only table)
ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;

-- No public policies = blocked for anon/authenticated
-- Only service_role (used by our API) can access

-- 3. Precomputed leaderboard cache table (optional, for scale)
--    Avoids full scan on every request
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season          TEXT NOT NULL,            -- 'weekly', 'monthly', 'alltime'
  season_start    DATE NOT NULL,
  user_id         UUID NOT NULL,
  rank            INT NOT NULL,
  adjusted_score  INT NOT NULL,
  median_score    INT NOT NULL,
  total_tests     INT NOT NULL,
  best_score      INT NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_leaderboard_season_user UNIQUE (season, season_start, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lb_cache_season ON public.leaderboard_cache(season, season_start, rank);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
-- Again, only service_role
