-- ============================================================
-- USERS & RESULTS SCHEMA FOR USERNAME SYSTEM (MOCKTESTPRO LITE V2)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create lightweight users table
CREATE TABLE IF NOT EXISTS public.users_light (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add columns to results table
ALTER TABLE public.results 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS username TEXT;

-- 3. (Optional) Create indexes for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_results_username ON public.results(username);
CREATE INDEX IF NOT EXISTS idx_results_score_percent ON public.results(score_percent DESC);

-- 4. Leaderboard RPC
CREATE OR REPLACE FUNCTION get_leaderboard_lite()
RETURNS TABLE(username TEXT, best_score FLOAT, total_tests BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.username, CAST(MAX(r.score_percent) AS FLOAT) as best_score, COUNT(*) as total_tests
  FROM public.results r
  WHERE r.username IS NOT NULL
  GROUP BY r.username
  HAVING COUNT(*) >= 1  -- Using 1 for MVP so users see themselves immediately
  ORDER BY best_score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
