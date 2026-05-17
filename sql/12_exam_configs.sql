-- ═══════════════════════════════════════════════
-- EXAM CONFIGS — DB-driven exam definitions
-- Replaces hardcoded ExamPresets.js for new exams
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS exam_configs (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,          -- 'ssc-cgl', 'rrb-ntpc'
  board TEXT NOT NULL,                -- 'SSC', 'Railway', 'Banking'
  exam_name TEXT NOT NULL,            -- 'SSC CGL', 'RRB NTPC'
  full_name TEXT,                     -- 'SSC Combined Graduate Level'
  renderer_type TEXT NOT NULL DEFAULT 'ssc',  -- which frontend renderer to use
  icon TEXT DEFAULT '📝',
  
  -- Timing
  duration_minutes INT NOT NULL DEFAULT 60,
  
  -- Questions
  total_questions INT NOT NULL DEFAULT 100,
  marks_per_question NUMERIC DEFAULT 2,
  negative_marking NUMERIC DEFAULT 0,        -- 0 = none, 0.5 = half mark, etc.
  
  -- Sections (JSONB array)
  sections JSONB DEFAULT '[]',
  
  -- Rules
  section_locking BOOLEAN DEFAULT false,
  section_timers BOOLEAN DEFAULT false,
  calculator_allowed BOOLEAN DEFAULT false,
  palette_type TEXT DEFAULT 'default',       -- 'default', 'ibps', 'paper'
  keyboard_nav BOOLEAN DEFAULT false,
  
  -- Metadata
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_configs_slug ON exam_configs(slug);
CREATE INDEX IF NOT EXISTS idx_exam_configs_board ON exam_configs(board);
CREATE INDEX IF NOT EXISTS idx_exam_configs_active ON exam_configs(is_active);

-- RLS
ALTER TABLE exam_configs ENABLE ROW LEVEL SECURITY;

-- Anyone can read exam configs
DO $$ BEGIN
  CREATE POLICY "Anyone can read exam configs"
    ON exam_configs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only service_role can modify
DO $$ BEGIN
  CREATE POLICY "Service role can manage configs"
    ON exam_configs FOR ALL
    USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════
-- SEED: Complete exam registry (30+ exams)
-- Maps 1:1 with legacy ExamPresets._presets
-- ═══════════════════════════════════════════════

-- Wipe old partial seeds and re-insert
DELETE FROM exam_configs;

INSERT INTO exam_configs (slug, board, exam_name, full_name, renderer_type, icon, duration_minutes, total_questions, marks_per_question, negative_marking, category, sections, section_locking, section_timers, calculator_allowed, palette_type, keyboard_nav, description, sort_order)
VALUES
-- ── SSC ──────────────────────────────────
('ssc-cgl', 'SSC', 'SSC CGL', 'Combined Graduate Level (Tier 1)', 'ssc', '🎓', 60, 100, 2, 0.50, 'SSC',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":25},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":25},{"name":"English Language","subject":"english","questions":25},{"name":"General Awareness","subject":"gk","questions":25}]'::jsonb,
  false, false, false, 'default', false, 'SSC CGL Tier-1: 100 questions, 60 min, -0.50 marking', 1),

('ssc-chsl', 'SSC', 'SSC CHSL', 'Combined Higher Secondary (Tier 1)', 'ssc', '📝', 60, 100, 2, 0.50, 'SSC',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":25},{"name":"General Intelligence","subject":"reasoning","questions":25},{"name":"English Language","subject":"english","questions":25},{"name":"General Awareness","subject":"gk","questions":25}]'::jsonb,
  false, false, false, 'default', false, 'SSC CHSL: 100 questions, 60 min, -0.50 per wrong', 2),

('ssc-mts', 'SSC', 'SSC MTS', 'Multi Tasking Staff', 'ssc', '🔧', 45, 75, 1, 0.25, 'SSC',
  '[{"name":"Numerical Aptitude","subject":"math","questions":20},{"name":"Reasoning","subject":"reasoning","questions":20},{"name":"English Language","subject":"english","questions":15},{"name":"General Awareness","subject":"gk","questions":20}]'::jsonb,
  false, false, false, 'default', false, 'SSC MTS: 75 questions, 45 min, -0.25 marking', 3),

('ssc-cpo', 'SSC', 'SSC CPO', 'Central Police Organisation', 'ssc', '🛡️', 120, 200, 1, 0.25, 'SSC',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":50},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":50},{"name":"English Comprehension","subject":"english","questions":50},{"name":"General Knowledge","subject":"gk","questions":50}]'::jsonb,
  false, false, false, 'default', false, 'SSC CPO: 200 questions, 2 hours, -0.25 marking', 4),

('ssc-gd', 'SSC', 'SSC GD', 'GD Constable', 'ssc', '💂', 60, 80, 2, 0.50, 'SSC',
  '[{"name":"Mathematics","subject":"math","questions":20},{"name":"Reasoning","subject":"reasoning","questions":20},{"name":"English/Hindi","subject":"english","questions":20},{"name":"General Awareness","subject":"gk","questions":20}]'::jsonb,
  false, false, false, 'default', false, 'SSC GD Constable: 80 questions, 60 min, -0.50 marking', 5),

('ssc-steno', 'SSC', 'SSC Steno', 'Stenographer Grade C & D', 'ssc', '⌨️', 120, 200, 1, 0.25, 'SSC',
  '[{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":50},{"name":"General Awareness","subject":"gk","questions":50},{"name":"English Language","subject":"english","questions":100}]'::jsonb,
  false, false, false, 'default', false, 'SSC Steno: 200 questions, 2 hours, -0.25 marking', 6),

('ssc-je', 'SSC', 'SSC JE', 'Junior Engineer (Paper 1)', 'ssc', '🔩', 120, 200, 1, 0.25, 'SSC',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":50},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":50},{"name":"General Awareness","subject":"gk","questions":50},{"name":"English Language","subject":"english","questions":50}]'::jsonb,
  false, false, false, 'default', false, 'SSC JE Paper-1: 200 questions, 2 hours, -0.25 marking', 7),

-- ── RAILWAY ──────────────────────────────
('rrb-ntpc', 'Railway', 'RRB NTPC', 'Non-Technical Popular Categories (CBT-1)', 'railway', '📊', 90, 100, 1, 0.33, 'Railway',
  '[{"name":"Mathematics","subject":"math","questions":30},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":30},{"name":"General Awareness","subject":"gk","questions":40}]'::jsonb,
  false, false, false, 'default', false, 'RRB NTPC CBT-1: 100 questions, 90 min, -1/3 marking', 10),

('rrb-group-d', 'Railway', 'RRB Group D', 'Level 1 Posts', 'railway', '⚙️', 90, 100, 1, 0.33, 'Railway',
  '[{"name":"Mathematics","subject":"math","questions":25},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":30},{"name":"General Science","subject":"science","questions":25},{"name":"General Awareness","subject":"gk","questions":20}]'::jsonb,
  false, false, false, 'default', false, 'RRB Group D: 100 questions, 90 min, -1/3 marking', 11),

('rrb-alp', 'Railway', 'RRB ALP', 'Assistant Loco Pilot (CBT-1)', 'railway', '🚆', 60, 75, 1, 0.33, 'Railway',
  '[{"name":"Mathematics","subject":"math","questions":20},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":25},{"name":"General Science","subject":"science","questions":20},{"name":"General Awareness","subject":"gk","questions":10}]'::jsonb,
  false, false, false, 'default', false, 'RRB ALP CBT-1: 75 questions, 60 min, -1/3 marking', 12),

('rrb-je', 'Railway', 'RRB JE', 'Junior Engineer (CBT-1)', 'railway', '🔧', 90, 100, 1, 0.33, 'Railway',
  '[{"name":"Mathematics","subject":"math","questions":30},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":25},{"name":"General Awareness","subject":"gk","questions":15},{"name":"General Science","subject":"science","questions":30}]'::jsonb,
  false, false, false, 'default', false, 'RRB JE CBT-1: 100 questions, 90 min, -1/3 marking', 13),

('rpf-constable', 'Railway', 'RPF Constable', 'Railway Protection Force', 'railway', '🛡️', 90, 120, 1, 0.33, 'Railway',
  '[{"name":"Arithmetic","subject":"math","questions":35},{"name":"General Intelligence & Reasoning","subject":"reasoning","questions":35},{"name":"General Awareness","subject":"gk","questions":50}]'::jsonb,
  false, false, false, 'default', false, 'RPF Constable: 120 questions, 90 min, -1/3 marking', 14),

-- ── BANKING ──────────────────────────────
('ibps-po', 'Banking', 'IBPS PO', 'Probationary Officer (Prelims)', 'banking', '💼', 60, 100, 1, 0.25, 'Banking',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":35,"sectionTime":1200},{"name":"Reasoning Ability","subject":"reasoning","questions":35,"sectionTime":1200},{"name":"English Language","subject":"english","questions":30,"sectionTime":1200}]'::jsonb,
  true, true, true, 'ibps', true, 'IBPS PO Prelims: 100 questions, 60 min, -0.25 marking', 20),

('ibps-clerk', 'Banking', 'IBPS Clerk', 'Clerical Cadre (Prelims)', 'banking', '📋', 60, 100, 1, 0.25, 'Banking',
  '[{"name":"Numerical Ability","subject":"math","questions":35,"sectionTime":1200},{"name":"Reasoning Ability","subject":"reasoning","questions":35,"sectionTime":1200},{"name":"English Language","subject":"english","questions":30,"sectionTime":1200}]'::jsonb,
  true, true, true, 'ibps', true, 'IBPS Clerk Prelims: 100 questions, 60 min, -0.25 marking', 21),

('sbi-po', 'Banking', 'SBI PO', 'Probationary Officer (Prelims)', 'banking', '🏛️', 60, 100, 1, 0.25, 'Banking',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":35,"sectionTime":1200},{"name":"Reasoning Ability","subject":"reasoning","questions":35,"sectionTime":1200},{"name":"English Language","subject":"english","questions":30,"sectionTime":1200}]'::jsonb,
  true, true, true, 'ibps', true, 'SBI PO Prelims: 100 questions, 60 min, -0.25 marking', 22),

('sbi-clerk', 'Banking', 'SBI Clerk', 'Junior Associate (Prelims)', 'banking', '📄', 60, 100, 1, 0.25, 'Banking',
  '[{"name":"Numerical Ability","subject":"math","questions":35,"sectionTime":1200},{"name":"Reasoning Ability","subject":"reasoning","questions":35,"sectionTime":1200},{"name":"English Language","subject":"english","questions":30,"sectionTime":1200}]'::jsonb,
  true, true, true, 'ibps', true, 'SBI Clerk Prelims: 100 questions, 60 min, -0.25 marking', 23),

('rbi-assistant', 'Banking', 'RBI Assistant', 'Reserve Bank Assistant (Prelims)', 'banking', '🏦', 60, 100, 1, 0.25, 'Banking',
  '[{"name":"Numerical Ability","subject":"math","questions":35,"sectionTime":1200},{"name":"Reasoning Ability","subject":"reasoning","questions":35,"sectionTime":1200},{"name":"English Language","subject":"english","questions":30,"sectionTime":1200}]'::jsonb,
  true, true, true, 'ibps', true, 'RBI Assistant Prelims: 100 questions, 60 min, -0.25 marking', 24),

('ibps-rrb', 'Banking', 'IBPS RRB', 'Regional Rural Bank Officer (Prelims)', 'banking', '🌾', 45, 80, 1, 0.25, 'Banking',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":40,"sectionTime":1380},{"name":"Reasoning Ability","subject":"reasoning","questions":40,"sectionTime":1320}]'::jsonb,
  true, true, true, 'ibps', true, 'IBPS RRB Officer Prelims: 80 questions, 45 min, -0.25 marking', 25),

-- ── STATE EXAMS ──────────────────────────
('up-police', 'State', 'UP Police', 'UP Police Constable', 'ssc', '🔰', 120, 150, 1, 0.25, 'State',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":38},{"name":"General Intelligence","subject":"reasoning","questions":38},{"name":"Hindi Language","subject":"hindi","questions":37},{"name":"General Knowledge","subject":"gk","questions":37}]'::jsonb,
  false, false, false, 'default', false, 'UP Police: 150 questions, 2 hours, -0.25 marking', 30),

('bihar-si', 'State', 'Bihar SI', 'Bihar Sub Inspector', 'ssc', '⭐', 120, 200, 1, 0.25, 'State',
  '[{"name":"Mathematics","subject":"math","questions":50},{"name":"General Intelligence","subject":"reasoning","questions":50},{"name":"Hindi Language","subject":"hindi","questions":50},{"name":"General Knowledge","subject":"gk","questions":50}]'::jsonb,
  false, false, false, 'default', false, 'Bihar SI: 200 questions, 2 hours, -0.25 marking', 31),

('mp-patwari', 'State', 'MP Patwari', 'Madhya Pradesh Patwari', 'ssc', '📜', 120, 100, 1, 0, 'State',
  '[{"name":"Quantitative Aptitude","subject":"math","questions":25},{"name":"General Intelligence","subject":"reasoning","questions":25},{"name":"Hindi Language","subject":"hindi","questions":25},{"name":"General Knowledge","subject":"gk","questions":25}]'::jsonb,
  false, false, false, 'default', false, 'MP Patwari: 100 questions, 2 hours, no negative marking', 32),

('raj-police', 'State', 'Raj Police', 'Rajasthan Police Constable', 'ssc', '🏜️', 120, 150, 1, 0, 'State',
  '[{"name":"Reasoning","subject":"reasoning","questions":30},{"name":"Mathematics","subject":"math","questions":30},{"name":"Hindi","subject":"hindi","questions":30},{"name":"GK & Current Affairs","subject":"gk","questions":30},{"name":"Science","subject":"science","questions":30}]'::jsonb,
  false, false, false, 'default', false, 'Raj Police: 150 questions, 2 hours, no negative marking', 33),

('upsssc-pet', 'State', 'UPSSSC PET', 'UP Preliminary Eligibility Test', 'ssc', '📋', 120, 100, 1, 0.25, 'State',
  '[{"name":"Hindi","subject":"hindi","questions":15},{"name":"Mathematics","subject":"math","questions":15},{"name":"Reasoning","subject":"reasoning","questions":15},{"name":"General Awareness","subject":"gk","questions":15},{"name":"Science","subject":"science","questions":15},{"name":"English","subject":"english","questions":10},{"name":"History & Polity","subject":"polity","questions":15}]'::jsonb,
  false, false, false, 'default', false, 'UPSSSC PET: 100 questions, 2 hours, -0.25 marking', 34),

-- ── DEFENCE ──────────────────────────────
('cds', 'Defence', 'CDS', 'Combined Defence Services (GK)', 'ssc', '⚔️', 120, 120, 1, 0.33, 'Defence',
  '[{"name":"General Knowledge","subject":"gk","questions":120}]'::jsonb,
  false, false, false, 'default', false, 'CDS GK Paper: 120 questions, 2 hours, -1/3 marking', 40),

('nda', 'Defence', 'NDA', 'National Defence Academy (GAT)', 'ssc', '🎖️', 150, 150, 1, 0.33, 'Defence',
  '[{"name":"Mathematics","subject":"math","questions":30},{"name":"General Science","subject":"science","questions":25},{"name":"History","subject":"history","questions":25},{"name":"Geography","subject":"geography","questions":20},{"name":"Polity","subject":"polity","questions":20},{"name":"English","subject":"english","questions":30}]'::jsonb,
  false, false, false, 'default', false, 'NDA GAT: 150 questions, 2.5 hours, -1/3 marking', 41),

('afcat', 'Defence', 'AFCAT', 'Air Force Common Admission Test', 'ssc', '✈️', 120, 100, 3, 0.33, 'Defence',
  '[{"name":"General Awareness","subject":"gk","questions":25},{"name":"Verbal Ability","subject":"english","questions":25},{"name":"Numerical Ability","subject":"math","questions":25},{"name":"Reasoning & Military Aptitude","subject":"reasoning","questions":25}]'::jsonb,
  false, false, false, 'default', false, 'AFCAT: 100 questions, 2 hours, -1/3 marking', 42),

-- ── TEACHING ──────────────────────────────
('ctet', 'Teaching', 'CTET', 'Central Teacher Eligibility (Paper 1)', 'ssc', '📚', 150, 150, 1, 0, 'Teaching',
  '[{"name":"Child Development & Pedagogy","subject":"reasoning","questions":30},{"name":"Hindi Language","subject":"hindi","questions":30},{"name":"English Language","subject":"english","questions":30},{"name":"Mathematics","subject":"math","questions":30},{"name":"Environmental Studies","subject":"science","questions":30}]'::jsonb,
  false, false, false, 'default', false, 'CTET Paper-1: 150 questions, 2.5 hours, no negative', 50),

('dsssb-tgt', 'Teaching', 'DSSSB TGT', 'Delhi TGT (Tier 1)', 'ssc', '🎓', 120, 200, 1, 0.25, 'Teaching',
  '[{"name":"Mental Ability & Reasoning","subject":"reasoning","questions":40},{"name":"Quantitative Aptitude","subject":"math","questions":40},{"name":"General Awareness","subject":"gk","questions":40},{"name":"English Language","subject":"english","questions":40},{"name":"Hindi Language","subject":"hindi","questions":40}]'::jsonb,
  false, false, false, 'default', false, 'DSSSB TGT Tier-1: 200 questions, 2 hours, -0.25 marking', 51),

('super-tet', 'Teaching', 'SUPER TET', 'UP Super TET', 'ssc', '🏫', 150, 150, 1, 0, 'Teaching',
  '[{"name":"Hindi","subject":"hindi","questions":20},{"name":"Mathematics","subject":"math","questions":20},{"name":"Science","subject":"science","questions":15},{"name":"General Knowledge","subject":"gk","questions":30},{"name":"Reasoning","subject":"reasoning","questions":15},{"name":"English","subject":"english","questions":15},{"name":"Child Psychology","subject":"reasoning","questions":20},{"name":"Social Studies","subject":"history","questions":15}]'::jsonb,
  false, false, false, 'default', false, 'UP Super TET: 150 questions, 2.5 hours, no negative', 52),

-- ── UPSC / PSC ──────────────────────────
('upsc-prelims', 'UPSC', 'UPSC Prelims', 'Civil Services Prelims (GS Paper 1)', 'upsc', '🏛️', 120, 100, 2, 0.33, 'UPSC',
  '[{"name":"History & Culture","subject":"history","questions":15},{"name":"Geography","subject":"geography","questions":15},{"name":"Polity & Governance","subject":"polity","questions":15},{"name":"Economy","subject":"gk","questions":15},{"name":"Science & Technology","subject":"science","questions":15},{"name":"Environment & Ecology","subject":"science","questions":10},{"name":"Current Affairs","subject":"gk","questions":15}]'::jsonb,
  false, false, false, 'paper', false, 'UPSC Prelims GS-1: 100 questions, 2 hours, -1/3 marking', 60),

('uppsc-prelims', 'UPSC', 'UPPSC Prelims', 'UP PCS Prelims (GS Paper 1)', 'upsc', '📜', 120, 150, 1, 0.33, 'UPSC',
  '[{"name":"History","subject":"history","questions":25},{"name":"Geography","subject":"geography","questions":20},{"name":"Polity","subject":"polity","questions":25},{"name":"Science","subject":"science","questions":20},{"name":"Economy & GK","subject":"gk","questions":30},{"name":"Current Affairs","subject":"gk","questions":30}]'::jsonb,
  false, false, false, 'paper', false, 'UPPSC GS-1: 150 questions, 2 hours, -1/3 marking', 61),

('bpsc-prelims', 'UPSC', 'BPSC Prelims', 'Bihar PCS Prelims (GS)', 'upsc', '⚖️', 120, 150, 1, 0, 'UPSC',
  '[{"name":"History","subject":"history","questions":25},{"name":"Geography","subject":"geography","questions":25},{"name":"Polity","subject":"polity","questions":25},{"name":"Science","subject":"science","questions":25},{"name":"General Knowledge","subject":"gk","questions":25},{"name":"Current Affairs","subject":"gk","questions":25}]'::jsonb,
  false, false, false, 'paper', false, 'BPSC Prelims: 150 questions, 2 hours, no negative marking', 62),

-- ── QUICK MODES ──────────────────────────
('quick-10', 'Quick', 'Quick 10', '10-Question Speed Round', 'ssc', '⚡', 5, 10, 1, 0, 'Quick',
  '[{"name":"Mixed","subject":"all","questions":10}]'::jsonb,
  false, false, false, 'default', false, '10 random questions, 5 min — warm up!', 90),

('daily-challenge', 'Daily', 'Daily Challenge', 'Daily 15-Question Challenge', 'ssc', '🔥', 10, 15, 1, 0.25, 'Daily',
  '[{"name":"Math","subject":"math","questions":5},{"name":"Reasoning","subject":"reasoning","questions":5},{"name":"GK","subject":"gk","questions":5}]'::jsonb,
  false, false, false, 'default', false, '15 questions, 10 min — daily streak builder!', 91);
