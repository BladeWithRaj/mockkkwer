-- ═══════════════════════════════════════════════
-- MIGRATION: Add new columns to exam_configs
-- Safe to run multiple times (IF NOT EXISTS checks)
-- ═══════════════════════════════════════════════

-- Add missing columns if they don't exist
DO $$ BEGIN
  ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS section_timers BOOLEAN DEFAULT false;
  ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS palette_type TEXT DEFAULT 'default';
  ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS keyboard_nav BOOLEAN DEFAULT false;
  ALTER TABLE exam_configs ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'exam_configs table does not exist yet — will be created by 12_exam_configs.sql';
END $$;
