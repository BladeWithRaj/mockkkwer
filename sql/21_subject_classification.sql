-- ============================================================
-- SUBJECT CLASSIFICATION ARCHITECTURE
-- Migration: 21_subject_classification.sql
--
-- 4 Subject Tiers:
--   core_theory    → heavy PYQ, advanced_prediction engine
--   optional_theory → moderate_prediction engine  
--   practical      → viva_and_practical engine (NO fake theory)
--   qualifying     → pass_assist engine (MCQs + repeated PYQs)
-- ============================================================

-- Add classification columns
ALTER TABLE polytechnic_board_subjects
  ADD COLUMN IF NOT EXISTS subject_category TEXT DEFAULT 'core_theory',
  ADD COLUMN IF NOT EXISTS generation_mode TEXT DEFAULT 'advanced_prediction',
  ADD COLUMN IF NOT EXISTS prediction_priority INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_qualifying BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_ai_prediction BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_practical_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marks_not_counted BOOLEAN DEFAULT false;

-- Constraints
ALTER TABLE polytechnic_board_subjects
  DROP CONSTRAINT IF EXISTS chk_subject_category;
ALTER TABLE polytechnic_board_subjects
  ADD CONSTRAINT chk_subject_category
  CHECK (subject_category IN ('core_theory','optional_theory','practical','qualifying'));

ALTER TABLE polytechnic_board_subjects
  DROP CONSTRAINT IF EXISTS chk_generation_mode;
ALTER TABLE polytechnic_board_subjects
  ADD CONSTRAINT chk_generation_mode
  CHECK (generation_mode IN ('advanced_prediction','moderate_prediction','viva_and_practical','pass_assist'));

-- Semester 1 Classification
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=10, is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4101';
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=9,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4102';
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=9,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4103';
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=8,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4104';
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=9,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4105';
UPDATE polytechnic_board_subjects SET subject_category='qualifying',     generation_mode='pass_assist',         prediction_priority=2,  is_qualifying=true,  supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=true  WHERE code='4106';
UPDATE polytechnic_board_subjects SET subject_category='practical',      generation_mode='viva_and_practical',  prediction_priority=2,  is_qualifying=false, supports_ai_prediction=false, supports_practical_mode=true,  marks_not_counted=false WHERE code='4107';
UPDATE polytechnic_board_subjects SET subject_category='practical',      generation_mode='viva_and_practical',  prediction_priority=2,  is_qualifying=false, supports_ai_prediction=false, supports_practical_mode=true,  marks_not_counted=false WHERE code='4108';

-- Semester 2 Classification
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=10, is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4201';
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=9,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4202';
UPDATE polytechnic_board_subjects SET subject_category='optional_theory',generation_mode='moderate_prediction', prediction_priority=5,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4203';
UPDATE polytechnic_board_subjects SET subject_category='core_theory',    generation_mode='advanced_prediction', prediction_priority=9,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4204';
UPDATE polytechnic_board_subjects SET subject_category='qualifying',     generation_mode='pass_assist',         prediction_priority=2,  is_qualifying=true,  supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=true  WHERE code='4205';
UPDATE polytechnic_board_subjects SET subject_category='practical',      generation_mode='viva_and_practical',  prediction_priority=2,  is_qualifying=false, supports_ai_prediction=false, supports_practical_mode=true,  marks_not_counted=false WHERE code='4206';
UPDATE polytechnic_board_subjects SET subject_category='practical',      generation_mode='viva_and_practical',  prediction_priority=2,  is_qualifying=false, supports_ai_prediction=false, supports_practical_mode=true,  marks_not_counted=false WHERE code='4207';
UPDATE polytechnic_board_subjects SET subject_category='optional_theory',generation_mode='moderate_prediction', prediction_priority=6,  is_qualifying=false, supports_ai_prediction=true,  supports_practical_mode=false, marks_not_counted=false WHERE code='4209';
