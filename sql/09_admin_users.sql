-- ═══════════════════════════════════════════════
-- ADMIN USERS — Secure Admin Authentication
-- Brute-force protection + bcrypt password hashing
-- ═══════════════════════════════════════════════

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- bcrypt hash (NEVER plain text)
  failed_attempts INT DEFAULT 0,
  banned_until TIMESTAMP,               -- NULL = not banned
  last_login TIMESTAMP,
  last_ip TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin sessions table (server-side session storage)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  csrf_token TEXT NOT NULL,              -- CSRF protection token
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin login audit log
CREATE TABLE IF NOT EXISTS admin_login_log (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,                          -- e.g., 'invalid_password', 'banned', 'success'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_login_log_username ON admin_login_log(username);
CREATE INDEX IF NOT EXISTS idx_admin_login_log_created ON admin_login_log(created_at);

-- ═══════════════════════════════════════════════
-- SEED DEFAULT ADMIN
-- ⚠️ DO NOT hardcode passwords in SQL files!
-- Generate a bcrypt hash using:
--   node scripts/hash-admin-password.js "YourSecurePassword"
-- Then INSERT manually in Supabase SQL Editor:
--   INSERT INTO admin_users (username, password_hash)
--   VALUES ('superadmin', '<paste_hash_here>')
--   ON CONFLICT (username) DO NOTHING;
-- ═══════════════════════════════════════════════

-- ═══════════════════════════════════════════════
-- CLEANUP: Auto-delete expired sessions (run periodically)
-- ═══════════════════════════════════════════════

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS: Deny all public access to admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
-- No public policies = complete lockdown
