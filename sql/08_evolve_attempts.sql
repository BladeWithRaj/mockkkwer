-- ============================================
-- MIGRATION: Evolve test_attempts table
-- DO NOT DROP. Only ADD missing columns.
-- ============================================

-- 1. Add missing columns
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS total_questions INT;

ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS attempted INT;

ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS coins_earned INT DEFAULT 0;

ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS streak_at_time INT DEFAULT 0;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user
ON test_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_attempts_created
ON test_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempts_user_created
ON test_attempts(user_id, created_at DESC);

-- 3. Ensure RLS is off (for current phase)
ALTER TABLE test_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
