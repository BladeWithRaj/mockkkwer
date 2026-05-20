-- ============================================================
-- GENERATION JOBS — Async Job Queue for Paper Generation
-- File: 16_generation_jobs.sql
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Job queue table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id INTEGER REFERENCES polytechnic_board_subjects(id),
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending → processing → completed | failed | partial
  progress INTEGER DEFAULT 0,              -- 0-100
  current_stage TEXT DEFAULT 'init',        -- init, partA, q3, render, etc.
  message TEXT DEFAULT '',                  -- human-readable stage message
  paper_data JSONB DEFAULT NULL,            -- final generated paper sections
  subject_meta JSONB DEFAULT NULL,          -- subject info snapshot for rendering
  error_text TEXT DEFAULT NULL,             -- error message if failed
  failed_sections JSONB DEFAULT '[]',       -- sections that failed generation
  ip_address TEXT DEFAULT '',
  language TEXT DEFAULT 'bilingual',
  branch TEXT DEFAULT 'Common',
  paper_id INTEGER DEFAULT NULL,            -- FK to generated_papers once cached
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status
  ON generation_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_ip
  ON generation_jobs(ip_address, created_at DESC);

-- Auto-cleanup: jobs older than 24h (run manually or via cron)
-- DELETE FROM generation_jobs WHERE created_at < now() - interval '24 hours';

-- 2. Observability: Generation logs (per-section telemetry)
CREATE TABLE IF NOT EXISTS generation_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id UUID REFERENCES generation_jobs(id) ON DELETE CASCADE,
  section TEXT NOT NULL,                     -- 'partA', 'q3', etc.
  provider TEXT NOT NULL DEFAULT 'gemini',   -- 'gemini', 'groq'
  model_name TEXT DEFAULT 'gemini-2.0-flash',
  latency_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',             -- success, failed, timeout
  error_text TEXT DEFAULT NULL,
  prompt_length INTEGER DEFAULT 0,           -- chars in prompt
  response_length INTEGER DEFAULT 0,         -- chars in response
  temperature FLOAT DEFAULT 0.55,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gen_logs_job
  ON generation_logs(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gen_logs_section
  ON generation_logs(section, status);

-- RLS: Allow anon read for status polling, service_role for writes
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read jobs" ON generation_jobs;
CREATE POLICY "Anyone can read jobs"
  ON generation_jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage jobs" ON generation_jobs;
CREATE POLICY "Service can manage jobs"
  ON generation_jobs FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can read logs" ON generation_logs;
CREATE POLICY "Anyone can read logs"
  ON generation_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage logs" ON generation_logs;
CREATE POLICY "Service can manage logs"
  ON generation_logs FOR ALL USING (true);

-- Grant permissions
GRANT SELECT ON generation_jobs TO anon, authenticated;
GRANT ALL ON generation_jobs TO service_role;
GRANT SELECT ON generation_logs TO anon, authenticated;
GRANT ALL ON generation_logs TO service_role;
