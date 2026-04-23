-- ============================================================
-- Daily Challenge & Streak System Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. User Streaks Table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_challenge_date DATE -- Stored as UTC date string 'YYYY-MM-DD'
);

-- RLS: Only service_role can read/write streaks (called via our API)
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- 2. Prevent duplicate daily challenge submissions in results
-- Add an 'is_daily' boolean to results to separate them from normal tests
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS is_daily BOOLEAN NOT NULL DEFAULT false;

-- Create a unique constraint so a user can only have one daily result per day
-- We cast created_at to DATE at UTC for the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_result 
ON public.results (user_id, (created_at AT TIME ZONE 'UTC')::DATE) 
WHERE is_daily = true;
