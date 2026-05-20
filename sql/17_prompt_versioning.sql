-- ============================================================
-- PROMPT VERSIONING — Reproducibility for Generated Papers
-- File: 17_prompt_versioning.sql
-- Run in Supabase SQL Editor
-- ============================================================

-- Add versioning columns to generated_papers
ALTER TABLE generated_papers
  ADD COLUMN IF NOT EXISTS prompt_version TEXT DEFAULT 'v2.0',
  ADD COLUMN IF NOT EXISTS model_name TEXT DEFAULT 'gemini-2.0-flash',
  ADD COLUMN IF NOT EXISTS temperature FLOAT DEFAULT 0.55,
  ADD COLUMN IF NOT EXISTS generation_meta JSONB DEFAULT '{}';
  -- generation_meta stores: {
  --   provider_per_section: { partA: "gemini", q3: "groq" },
  --   total_latency_ms: 12500,
  --   total_retries: 2,
  --   job_id: "uuid",
  --   prompt_version: "v2.0",
  --   dedup_collisions: 3,
  --   validation_issues: []
  -- }

-- Also add view/download counts for future gallery
ALTER TABLE generated_papers
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'bilingual';

-- Index for gallery queries (future)
CREATE INDEX IF NOT EXISTS idx_papers_public
  ON generated_papers(is_public, created_at DESC);
