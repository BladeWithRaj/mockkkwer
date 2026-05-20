-- ============================================================
-- QUESTION DEDUP HASHES — For AI-Generated Paper Deduplication
-- File: 18_question_hashes.sql
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS generated_question_hashes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id INTEGER REFERENCES polytechnic_board_subjects(id),
  question_hash TEXT NOT NULL,
  concept_hash TEXT DEFAULT NULL,          -- broader concept-level hash
  question_text TEXT NOT NULL,             -- original EN text for debugging
  section TEXT NOT NULL,                   -- 'partA', 'q3', etc.
  unit_no INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique per subject+hash to prevent exact dupes
CREATE UNIQUE INDEX IF NOT EXISTS idx_gqh_subject_hash
  ON generated_question_hashes(subject_id, question_hash);

-- Fast lookup by subject for dedup checks
CREATE INDEX IF NOT EXISTS idx_gqh_subject_created
  ON generated_question_hashes(subject_id, created_at DESC);

-- Concept-level index for semantic dedup
CREATE INDEX IF NOT EXISTS idx_gqh_concept
  ON generated_question_hashes(subject_id, concept_hash)
  WHERE concept_hash IS NOT NULL;

-- RLS
ALTER TABLE generated_question_hashes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage hashes" ON generated_question_hashes;
CREATE POLICY "Service can manage hashes"
  ON generated_question_hashes FOR ALL USING (true);

GRANT ALL ON generated_question_hashes TO service_role;
