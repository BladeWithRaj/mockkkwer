-- ═══════════════════════════════════════════════
-- MIGRATION 14: Admin Platform Governance
-- Applied via Supabase MCP on 2026-05-18
-- ═══════════════════════════════════════════════

-- PHASE 1: Exam Governance
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📝';
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS marks_per_question DOUBLE PRECISION DEFAULT 2;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS section_timers BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS calculator_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS palette_type TEXT DEFAULT 'default';
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS keyboard_nav BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE exam_configs ADD CONSTRAINT exam_configs_status_check CHECK (status IN ('draft', 'published', 'archived', 'disabled'));
CREATE INDEX IF NOT EXISTS idx_exam_configs_status ON exam_configs(status);
CREATE INDEX IF NOT EXISTS idx_exam_configs_published ON exam_configs(status, sort_order) WHERE status = 'published';

-- Config Versioning
CREATE TABLE IF NOT EXISTS exam_config_versions (
    id BIGSERIAL PRIMARY KEY,
    exam_config_id BIGINT NOT NULL REFERENCES exam_configs(id) ON DELETE CASCADE,
    exam_slug TEXT NOT NULL,
    config_snapshot JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    change_summary TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ecv_unique_version ON exam_config_versions(exam_config_id, version_number);
ALTER TABLE exam_config_versions ENABLE ROW LEVEL SECURITY;

-- PHASE 2: Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_username TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    action TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- PHASE 3: Question Quality
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_hash TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE questions ADD CONSTRAINT questions_moderation_check CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_hash ON questions(question_hash) WHERE question_hash IS NOT NULL;

-- Admin Roles
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'superadmin';
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('superadmin', 'moderator', 'analyst', 'content_manager'));
