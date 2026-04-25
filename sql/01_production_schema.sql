-- ============================================================
-- PRODUCTION SCHEMA & SCALING
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. User Roles System (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own role
CREATE POLICY "Users can read own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Only service_role (backend) or existing admins can insert/update roles
CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 2. Questions Table Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read questions (needed for tests)
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
CREATE POLICY "Anyone can read questions" 
ON public.questions FOR SELECT 
USING (true);

-- Write: Only admins can Insert/Update/Delete
DROP POLICY IF EXISTS "Admins can insert questions" ON public.questions;
CREATE POLICY "Admins can insert questions" 
ON public.questions FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update questions" ON public.questions;
CREATE POLICY "Admins can update questions" 
ON public.questions FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;
CREATE POLICY "Admins can delete questions" 
ON public.questions FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 3. Optimized Random Fetch Setup
-- Add a random_seed column to questions for ultra-fast random selection
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS random_seed FLOAT DEFAULT random();
CREATE INDEX IF NOT EXISTS idx_questions_random_seed ON public.questions(random_seed);

-- 4. Smart Question Engine RPC (Scalable, no full table scan)
CREATE OR REPLACE FUNCTION get_random_questions(
  p_limit INT,
  p_subject TEXT DEFAULT NULL,
  p_exam TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_seen_ids BIGINT[] DEFAULT '{}'
) RETURNS SETOF public.questions AS $$
DECLARE
  v_rand FLOAT := random();
BEGIN
  -- We use the random_seed index to fetch a random slice.
  -- UNION ALL handles wrap-around if v_rand is close to 1.0
  RETURN QUERY
  (
    SELECT * FROM public.questions q
    WHERE (p_subject IS NULL OR p_subject = 'all' OR q.subject = p_subject)
      AND (p_difficulty IS NULL OR p_difficulty = 'all' OR q.difficulty = p_difficulty)
      AND (p_exam IS NULL OR p_exam = 'all' OR q.exam ILIKE '%' || p_exam || '%')
      AND (NOT (q.id = ANY(p_seen_ids)))
      AND random_seed >= v_rand
    ORDER BY random_seed ASC
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT * FROM public.questions q
    WHERE (p_subject IS NULL OR p_subject = 'all' OR q.subject = p_subject)
      AND (p_difficulty IS NULL OR p_difficulty = 'all' OR q.difficulty = p_difficulty)
      AND (p_exam IS NULL OR p_exam = 'all' OR q.exam ILIKE '%' || p_exam || '%')
      AND (NOT (q.id = ANY(p_seen_ids)))
      AND random_seed < v_rand
    ORDER BY random_seed ASC
    LIMIT p_limit
  )
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
