-- ═══════════════════════════════════════════════
-- CANONICAL USERS TABLE
-- Replaces users_light. If users_light exists,
-- rename it. If neither exists, create fresh.
-- ═══════════════════════════════════════════════

-- Option A: If users_light exists, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users_light'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE users_light RENAME TO users;
    RAISE NOTICE '✅ Renamed users_light → users';
  END IF;
END $$;

-- Option B: Create fresh if neither exists
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT 'default',
  total_tests INT DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  best_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Ensure RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read users
CREATE POLICY "Public read" ON users
  FOR SELECT USING (true);

-- Service role manages
CREATE POLICY "Service role manage" ON users
  FOR ALL USING (false) WITH CHECK (false);
