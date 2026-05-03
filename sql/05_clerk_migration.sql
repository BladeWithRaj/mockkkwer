-- ============================================
-- CLERK AUTH MIGRATION
-- Adds clerk_id column to users_light table
-- ============================================

-- Add clerk_id column (unique, nullable for backward compat)
ALTER TABLE users_light
ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_light_clerk_id
ON users_light(clerk_id);

-- Optional: If you want to backfill existing users
-- UPDATE users_light SET clerk_id = id WHERE clerk_id IS NULL;
