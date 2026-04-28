-- Add Hindi bilingual columns to questions table
-- Run this in Supabase SQL Editor

ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS question_hi TEXT,
  ADD COLUMN IF NOT EXISTS option_a_hi TEXT,
  ADD COLUMN IF NOT EXISTS option_b_hi TEXT,
  ADD COLUMN IF NOT EXISTS option_c_hi TEXT,
  ADD COLUMN IF NOT EXISTS option_d_hi TEXT;

-- Optional: Add comment for clarity
COMMENT ON COLUMN questions.question_hi IS 'Hindi translation of the question text';
COMMENT ON COLUMN questions.option_a_hi IS 'Hindi translation of option A';
