-- =============================================
-- VERIFY SETUP — Run this in Supabase SQL Editor
-- This checks everything is correct before deploy
-- =============================================

-- 1. CHECK: RLS is enabled + public read policy exists
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'questions';
-- ✅ rowsecurity should be TRUE

-- 2. CHECK: Public SELECT policy exists
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'questions' AND cmd = 'SELECT';
-- ✅ Should show a policy with qual = "true"

-- 3. FIX: If no SELECT policy, create one
-- (safe to run even if it already exists)
DROP POLICY IF EXISTS "public read questions" ON questions;
CREATE POLICY "public read questions"
ON questions
FOR SELECT
USING (true);

-- 4. CHECK: Total question count
SELECT count(*) as total_questions FROM questions;
-- ✅ Should be >= 10

-- 5. CHECK: All subjects are lowercase
SELECT DISTINCT subject FROM questions ORDER BY subject;
-- ✅ All should be lowercase: math, gk, reasoning, etc.

-- 6. FIX: Force lowercase (safe to run always)
UPDATE questions SET subject = LOWER(TRIM(subject))
WHERE subject IS NOT NULL AND subject != LOWER(TRIM(subject));

-- 7. CHECK: Data integrity (options + correct_index)
SELECT
  id,
  question_en,
  options_en,
  correct_index,
  subject,
  CASE
    WHEN options_en IS NULL THEN '❌ NULL options'
    WHEN correct_index IS NULL THEN '❌ NULL correct_index'
    WHEN correct_index < 0 OR correct_index > 3 THEN '❌ BAD correct_index'
    ELSE '✅ OK'
  END as status
FROM questions
ORDER BY status DESC, id;
-- ✅ All rows should show "✅ OK"

-- 8. CHECK: Sample data looks correct
SELECT id, LEFT(question_en, 50) as question, options_en, correct_index, subject
FROM questions
LIMIT 5;

-- 9. DONE — If all checks pass, you're ready to deploy!
