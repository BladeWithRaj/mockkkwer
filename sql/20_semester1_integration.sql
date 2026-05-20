-- ============================================================
-- SEMESTER 1 INTEGRATION — BTEUP Official Subjects
-- Migration: 20_semester1_integration.sql
--
-- ISOLATION RULE: Semester-1 subjects are COMPLETELY SEPARATE
-- from Semester-2. Separate namespaces, prompts, units, PYQs.
-- math1 ≠ math2 | physics1 ≠ physics2 | mechanics1 ≠ engg_mechanics
-- ============================================================

-- 1. Add unique index on code (if not already present from migration)
CREATE UNIQUE INDEX IF NOT EXISTS polytechnic_board_subjects_code_unique
  ON polytechnic_board_subjects(code);

-- 2. Semester-1 Subjects (IDs assigned by DB sequence: 9-16)
INSERT INTO polytechnic_board_subjects
  (name, code, semester, renderer_type, prompt_namespace, marks_total, paper_style,
   supports_bilingual, active, is_optional, paper_type, difficulty_profile, generation_rules)
VALUES
('Mathematics-I',          '4101', 1, 'PATTERN_MATH',    'math1',       60, 'bteup_standard', true,  true, false, 'theory',    '{"numerical_weight":75,"difficulty_bias":"medium"}'::jsonb,             '{"style":"symbolic","key_verbs":["Find","Solve","Evaluate","Prove"]}'::jsonb),
('Applied Physics-I',      '4102', 1, 'PATTERN_GENERAL', 'physics1',    60, 'bteup_standard', true,  true, false, 'theory',    '{"numerical_weight":50,"diagram_weight":15}'::jsonb,                    '{"style":"conceptual_numerical"}'::jsonb),
('Applied Chemistry',      '4103', 1, 'PATTERN_GENERAL', 'chemistry',   60, 'bteup_standard', true,  true, false, 'theory',    '{"numerical_weight":20,"reaction_weight":30}'::jsonb,                   '{"style":"theory_application"}'::jsonb),
('Communication Skills in English','4104',1,'PATTERN_GENERAL','comm_english',60,'bteup_standard',false,true,false,'theory',   '{"descriptive_weight":80,"grammar_weight":60}'::jsonb,                  '{"style":"language_practical"}'::jsonb),
('Engineering Mechanics',  '4105', 1, 'PATTERN_GENERAL', 'mechanics1',  60, 'bteup_standard', true,  true, false, 'theory',    '{"numerical_weight":65,"diagram_weight":25}'::jsonb,                    '{"style":"numerical_mechanics"}'::jsonb),
('Environmental Science',  '4106', 1, 'PATTERN_GENERAL', 'env_science1',60, 'bteup_standard', true,  true, false, 'theory',    '{"descriptive_weight":80}'::jsonb,                                      '{"style":"awareness_theory"}'::jsonb),
('Engineering Workshop Practice','4107',1,'PATTERN_GENERAL','workshop1', 60,'bteup_standard', true,  true, true,  'practical', '{"tool_identification_weight":50}'::jsonb,                              '{"style":"practical_workshop"}'::jsonb),
('Engineering Graphics',   '4108', 1, 'PATTERN_GENERAL', 'graphics1',   60, 'bteup_standard', false, true, true,  'practical', '{"projection_weight":70}'::jsonb,                                       '{"style":"drawing_oriented"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 3. Syllabus Units — see 20_semester1_integration.sql full version
-- Run the full migration from Supabase dashboard for unit inserts
-- (polytechnic_subject_units inserted via apply_migration in deploy)

-- 4. Verify
SELECT id, name, code, semester, prompt_namespace FROM polytechnic_board_subjects
WHERE semester = 1 ORDER BY id;
