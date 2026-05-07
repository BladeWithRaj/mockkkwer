-- ============================================================
-- RIVAL BATTLES TABLE — Battle history tracking
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rival_battles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  rival_name  TEXT NOT NULL,
  rival_level TEXT NOT NULL,
  total_questions INT NOT NULL,
  user_score  INT NOT NULL,
  rival_score INT NOT NULL,
  user_accuracy FLOAT NOT NULL DEFAULT 0,
  rival_accuracy FLOAT NOT NULL DEFAULT 0,
  winner      TEXT NOT NULL, -- 'user', 'rival', 'draw'
  user_streak INT NOT NULL DEFAULT 0,
  rival_streak INT NOT NULL DEFAULT 0,
  duration    INT NOT NULL DEFAULT 0, -- seconds
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rival_battles_user ON public.rival_battles(user_id, created_at DESC);

-- RLS
ALTER TABLE public.rival_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_battles" ON public.rival_battles
  FOR SELECT USING (true);

GRANT SELECT, INSERT ON public.rival_battles TO anon, authenticated;
