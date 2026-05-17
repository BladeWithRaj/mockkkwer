-- ═══════════════════════════════════════════════
-- MIGRATION 15: TOTP Authenticator Admin Auth
-- Replaces password/cookie/session/CSRF with Authenticator-based login
-- Applied via Supabase MCP on 2026-05-18
-- ═══════════════════════════════════════════════

-- TOTP secrets table
CREATE TABLE IF NOT EXISTS admin_totp (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES admin_users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    setup_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_totp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_totp" ON admin_totp FOR ALL USING (false);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_totp_admin ON admin_totp(admin_id);

-- Token storage on admin_users (from previous migration)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_expires TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_admin_session_token ON admin_users(session_token) WHERE session_token IS NOT NULL;
