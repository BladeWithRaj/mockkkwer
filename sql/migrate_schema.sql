-- ═══════════════════════════════════════════════
-- MockTestPro — Schema Migration
-- FROM: option_a/b/c/d + correct_answer (text)
-- TO:   options_en (jsonb) + correct_index (int)
-- ═══════════════════════════════════════════════
-- ⚠️ RUN STEP BY STEP — verify after each step
-- ═══════════════════════════════════════════════


-- ═══════════════════════════════════════════════
-- STEP 1: Add new columns (safe, no data loss)
-- ═══════════════════════════════════════════════
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS options_en JSONB,
  ADD COLUMN IF NOT EXISTS options_hi JSONB,
  ADD COLUMN IF NOT EXISTS correct_index INT;

-- Rename question → question_en (if column exists as "question")
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'question'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'question_en'
  ) THEN
    ALTER TABLE questions RENAME COLUMN question TO question_en;
  END IF;
END $$;


-- ═══════════════════════════════════════════════
-- STEP 2: Migrate English options → jsonb array
-- ═══════════════════════════════════════════════
UPDATE questions
SET options_en = to_jsonb(ARRAY[
  COALESCE(option_a, ''),
  COALESCE(option_b, ''),
  COALESCE(option_c, ''),
  COALESCE(option_d, '')
])
WHERE options_en IS NULL
  AND option_a IS NOT NULL;


-- ═══════════════════════════════════════════════
-- STEP 3: Migrate Hindi options → jsonb array
-- ═══════════════════════════════════════════════
UPDATE questions
SET options_hi = to_jsonb(ARRAY[
  COALESCE(option_a_hi, option_a, ''),
  COALESCE(option_b_hi, option_b, ''),
  COALESCE(option_c_hi, option_c, ''),
  COALESCE(option_d_hi, option_d, '')
])
WHERE options_hi IS NULL
  AND option_a_hi IS NOT NULL;


-- ═══════════════════════════════════════════════
-- STEP 4: Convert correct_answer text → correct_index (0-3)
-- ═══════════════════════════════════════════════
UPDATE questions
SET correct_index = CASE
  WHEN LOWER(TRIM(correct_answer)) = LOWER(TRIM(option_a)) THEN 0
  WHEN LOWER(TRIM(correct_answer)) = LOWER(TRIM(option_b)) THEN 1
  WHEN LOWER(TRIM(correct_answer)) = LOWER(TRIM(option_c)) THEN 2
  WHEN LOWER(TRIM(correct_answer)) = LOWER(TRIM(option_d)) THEN 3
  ELSE 0
END
WHERE correct_index IS NULL
  AND correct_answer IS NOT NULL;


-- ═══════════════════════════════════════════════
-- STEP 5: Normalize subject → lowercase
-- ═══════════════════════════════════════════════
UPDATE questions SET subject = LOWER(TRIM(subject))
WHERE subject IS NOT NULL AND subject != LOWER(TRIM(subject));


-- ═══════════════════════════════════════════════
-- STEP 6: ⚠️ VERIFY BEFORE PROCEEDING
-- Run this and check output looks correct!
-- ═══════════════════════════════════════════════
-- SELECT id, question_en, options_en, options_hi, correct_index, subject
-- FROM questions LIMIT 10;


-- ═══════════════════════════════════════════════
-- STEP 7: DROP old columns (ONLY after Step 6 verified!)
-- ⚠️ THIS IS DESTRUCTIVE — no undo after this
-- ═══════════════════════════════════════════════
ALTER TABLE questions
  DROP COLUMN IF EXISTS option_a,
  DROP COLUMN IF EXISTS option_b,
  DROP COLUMN IF EXISTS option_c,
  DROP COLUMN IF EXISTS option_d,
  DROP COLUMN IF EXISTS option_a_hi,
  DROP COLUMN IF EXISTS option_b_hi,
  DROP COLUMN IF EXISTS option_c_hi,
  DROP COLUMN IF EXISTS option_d_hi,
  DROP COLUMN IF EXISTS correct_answer,
  DROP COLUMN IF EXISTS exam;

-- Old question_hi column rename (if still called question_hi, keep it)
-- No action needed — question_hi stays as is
