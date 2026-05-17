-- ═══════════════════════════════════════════════
-- USER SESSIONS — httpOnly cookie-based auth
-- No more trusting username from request body
-- ═══════════════════════════════════════════════

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,           -- matches users.id or users_light.id
  username TEXT NOT NULL,          -- cached for fast lookup
  token TEXT UNIQUE NOT NULL,      -- session token (stored in httpOnly cookie)
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Only service_role can access sessions
CREATE POLICY "Service role only" ON user_sessions
  FOR ALL USING (false)
  WITH CHECK (false);

-- ═══════════════════════════════════════════════
-- AUTO-CLEANUP expired sessions (run periodically)
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cleanup_expired_user_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
