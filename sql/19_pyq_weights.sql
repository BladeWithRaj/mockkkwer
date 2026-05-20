-- ============================================================
-- PYQ WEIGHT ENGINE — Topic Importance Scoring
-- File: 19_pyq_weights.sql
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add PYQ columns to existing units table
ALTER TABLE polytechnic_subject_units
  ADD COLUMN IF NOT EXISTS pyq_frequency INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS importance_score FLOAT DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS last_seen_year INTEGER DEFAULT NULL;

-- 2. Granular per-topic PYQ weights
CREATE TABLE IF NOT EXISTS pyq_topic_weights (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES polytechnic_board_subjects(id),
  unit_no INTEGER NOT NULL,
  topic_keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  importance_score FLOAT DEFAULT 0.5,       -- 0.0 to 1.0
  last_seen_year INTEGER DEFAULT NULL,
  years_appeared INTEGER[] DEFAULT '{}',
  question_type TEXT DEFAULT 'any',         -- mcq, short, long, numerical, derivation
  sample_question TEXT DEFAULT NULL,        -- example wording from PYQ
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pyq_subject_unit_topic
  ON pyq_topic_weights(subject_id, unit_no, topic_keyword);

-- RLS
ALTER TABLE pyq_topic_weights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read PYQ weights" ON pyq_topic_weights;
CREATE POLICY "Anyone can read PYQ weights"
  ON pyq_topic_weights FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service can manage PYQ weights" ON pyq_topic_weights;
CREATE POLICY "Service can manage PYQ weights"
  ON pyq_topic_weights FOR ALL USING (true);

GRANT SELECT ON pyq_topic_weights TO anon, authenticated;
GRANT ALL ON pyq_topic_weights TO service_role;

-- ============================================================
-- SEED: Mathematics-II (subject_id from polytechnic_board_subjects WHERE code='4201')
-- Based on common BTEUP patterns 2018-2024
-- ============================================================

-- Update unit-level PYQ data
UPDATE polytechnic_subject_units SET pyq_frequency = 12, importance_score = 0.9, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4201') AND unit_no = 1;
UPDATE polytechnic_subject_units SET pyq_frequency = 10, importance_score = 0.85, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4201') AND unit_no = 2;
UPDATE polytechnic_subject_units SET pyq_frequency = 11, importance_score = 0.9, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4201') AND unit_no = 3;
UPDATE polytechnic_subject_units SET pyq_frequency = 9, importance_score = 0.8, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4201') AND unit_no = 4;
UPDATE polytechnic_subject_units SET pyq_frequency = 8, importance_score = 0.75, last_seen_year = 2023
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4201') AND unit_no = 5;

-- Topic-level PYQ weights for Mathematics-II
INSERT INTO pyq_topic_weights (subject_id, unit_no, topic_keyword, frequency, importance_score, last_seen_year, years_appeared, question_type, sample_question) VALUES
-- Unit 1: Determinants & Matrices
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 1, 'determinant evaluation', 10, 0.95, 2024, '{2019,2020,2021,2022,2023,2024}', 'short', 'Evaluate the determinant |1 2 3; 4 5 6; 7 8 9|'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 1, 'cramers rule', 8, 0.9, 2024, '{2019,2020,2022,2023,2024}', 'long', 'Solve the following system of equations using Cramers rule'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 1, 'matrix inverse', 7, 0.85, 2024, '{2020,2021,2022,2024}', 'long', 'Find the inverse of the matrix A = [[1,2],[3,4]]'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 1, 'matrix rank', 5, 0.7, 2023, '{2020,2022,2023}', 'short', 'Find the rank of the matrix'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 1, 'adjoint matrix', 6, 0.75, 2023, '{2019,2021,2023}', 'short', 'Find the adjoint of the given matrix'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 1, 'consistency of equations', 4, 0.65, 2022, '{2020,2022}', 'short', 'Check whether the system of equations is consistent'),
-- Unit 2: Differential Calculus-II
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 2, 'successive differentiation', 6, 0.8, 2024, '{2020,2021,2023,2024}', 'long', 'Find the nth derivative of x²eˣ'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 2, 'leibnitz theorem', 8, 0.9, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'Apply Leibnitz theorem to find nth derivative'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 2, 'partial differentiation', 7, 0.85, 2024, '{2019,2021,2022,2024}', 'short', 'If u = f(x,y), find ∂u/∂x and ∂u/∂y'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 2, 'eulers theorem', 9, 0.92, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'Verify Eulers theorem for the function u = ...'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 2, 'maxima minima two variables', 5, 0.7, 2023, '{2021,2023}', 'long', 'Find the maxima and minima of f(x,y)'),
-- Unit 3: Integral Calculus
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 3, 'integration by parts', 9, 0.9, 2024, '{2019,2020,2021,2022,2023,2024}', 'short', 'Evaluate ∫x²eˣdx using integration by parts'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 3, 'definite integral properties', 6, 0.75, 2023, '{2020,2021,2023}', 'short', 'Evaluate ∫₀^π sin²x dx'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 3, 'beta gamma functions', 8, 0.88, 2024, '{2019,2020,2022,2023,2024}', 'long', 'Evaluate using Beta and Gamma functions'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 3, 'reduction formula', 5, 0.7, 2022, '{2020,2022}', 'long', 'Derive the reduction formula for ∫sinⁿx dx'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 3, 'trapezoidal rule', 7, 0.82, 2024, '{2019,2021,2022,2024}', 'numerical', 'Evaluate the integral using Trapezoidal rule'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 3, 'simpsons rule', 7, 0.82, 2024, '{2019,2020,2023,2024}', 'numerical', 'Evaluate using Simpsons 1/3 rule'),
-- Unit 4: Differential Equations
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 4, 'variable separable', 6, 0.8, 2024, '{2020,2022,2024}', 'short', 'Solve dy/dx = xy'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 4, 'linear differential equation', 8, 0.88, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'Solve the linear differential equation dy/dx + Py = Q'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 4, 'bernoulli equation', 5, 0.72, 2023, '{2020,2023}', 'long', 'Solve the Bernoulli equation'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 4, 'exact differential equation', 6, 0.78, 2023, '{2019,2021,2023}', 'long', 'Solve the exact differential equation'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 4, 'second order constant coefficients', 7, 0.85, 2024, '{2020,2021,2023,2024}', 'long', 'Solve d²y/dx² + 3dy/dx + 2y = eˣ'),
-- Unit 5: Coordinate Geometry & Vectors
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 5, 'circle equation', 5, 0.7, 2023, '{2020,2023}', 'short', 'Find the equation of circle with centre (h,k) and radius r'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 5, 'parabola', 4, 0.65, 2022, '{2020,2022}', 'short', 'Find the vertex, focus and directrix of the parabola'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 5, 'dot product cross product', 7, 0.8, 2024, '{2019,2021,2023,2024}', 'short', 'Find the dot product and cross product of vectors'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4201'), 5, 'scalar triple product', 5, 0.72, 2023, '{2020,2023}', 'short', 'Find the scalar triple product of three vectors')
ON CONFLICT (subject_id, unit_no, topic_keyword) DO UPDATE SET
  frequency = EXCLUDED.frequency,
  importance_score = EXCLUDED.importance_score,
  last_seen_year = EXCLUDED.last_seen_year,
  years_appeared = EXCLUDED.years_appeared,
  question_type = EXCLUDED.question_type,
  sample_question = EXCLUDED.sample_question;

-- ============================================================
-- SEED: FEEE (subject_id from polytechnic_board_subjects WHERE code='4209')
-- ============================================================

UPDATE polytechnic_subject_units SET pyq_frequency = 10, importance_score = 0.85, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4209') AND unit_no = 1;
UPDATE polytechnic_subject_units SET pyq_frequency = 9, importance_score = 0.8, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4209') AND unit_no = 2;
UPDATE polytechnic_subject_units SET pyq_frequency = 10, importance_score = 0.88, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4209') AND unit_no = 3;
UPDATE polytechnic_subject_units SET pyq_frequency = 11, importance_score = 0.9, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4209') AND unit_no = 4;
UPDATE polytechnic_subject_units SET pyq_frequency = 8, importance_score = 0.78, last_seen_year = 2024
  WHERE subject_id = (SELECT id FROM polytechnic_board_subjects WHERE code = '4209') AND unit_no = 5;

INSERT INTO pyq_topic_weights (subject_id, unit_no, topic_keyword, frequency, importance_score, last_seen_year, years_appeared, question_type, sample_question) VALUES
-- Unit 1: DC & Magnetic
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 1, 'kirchhoffs laws', 10, 0.95, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'State and explain Kirchhoffs current and voltage laws with examples'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 1, 'star delta conversion', 6, 0.78, 2024, '{2020,2022,2024}', 'numerical', 'Convert the given star network to equivalent delta network'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 1, 'faradays law', 9, 0.92, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'State and explain Faradays laws of electromagnetic induction'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 1, 'lenz law', 6, 0.75, 2023, '{2020,2021,2023}', 'short', 'State Lenz law and explain with example'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 1, 'self mutual inductance', 5, 0.7, 2023, '{2021,2023}', 'short', 'Define self inductance and mutual inductance'),
-- Unit 2: AC Circuits
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 2, 'phasor diagram', 8, 0.88, 2024, '{2019,2020,2022,2023,2024}', 'long', 'Draw the phasor diagram for series RLC circuit'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 2, 'power factor', 7, 0.82, 2024, '{2020,2021,2023,2024}', 'short', 'Define power factor. Why is it important in AC circuits?'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 2, 'resonance', 8, 0.85, 2024, '{2019,2021,2022,2024}', 'long', 'Derive the condition for resonance in series RLC circuit'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 2, 'three phase system', 5, 0.7, 2023, '{2020,2023}', 'short', 'Compare star and delta connections in three phase system'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 2, 'rms average values', 6, 0.75, 2023, '{2019,2021,2023}', 'short', 'Define RMS and average value of AC. Derive for sinusoidal wave'),
-- Unit 3: Electrical Machines
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 3, 'transformer working', 10, 0.95, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'Explain the construction and working of a single-phase transformer'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 3, 'emf equation transformer', 7, 0.85, 2024, '{2020,2022,2024}', 'derivation', 'Derive the EMF equation of a transformer'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 3, 'dc motor types', 6, 0.78, 2023, '{2019,2021,2023}', 'short', 'Classify DC motors and explain any one type'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 3, 'induction motor principle', 8, 0.88, 2024, '{2019,2020,2022,2024}', 'long', 'Explain the principle and working of 3-phase induction motor'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 3, 'transformer losses efficiency', 6, 0.78, 2023, '{2020,2023}', 'long', 'Explain various losses in a transformer and derive efficiency'),
-- Unit 4: Electronic Devices
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 4, 'pn junction diode', 9, 0.92, 2024, '{2019,2020,2021,2022,2023,2024}', 'long', 'Explain the working of PN junction diode with V-I characteristics'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 4, 'zener diode regulator', 8, 0.88, 2024, '{2019,2020,2022,2023,2024}', 'long', 'Explain Zener diode as a voltage regulator with circuit diagram'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 4, 'rectifier circuits', 8, 0.85, 2024, '{2019,2021,2022,2024}', 'long', 'Explain half-wave and full-wave rectifier with waveforms'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 4, 'transistor bjt', 6, 0.78, 2023, '{2020,2021,2023}', 'long', 'Explain the working of NPN transistor in CE configuration'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 4, 'mosfet', 5, 0.7, 2023, '{2021,2023}', 'short', 'Explain the construction and working of MOSFET'),
-- Unit 5: Digital Electronics & Instruments
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 5, 'logic gates', 9, 0.9, 2024, '{2019,2020,2021,2022,2023,2024}', 'short', 'Draw truth tables for AND, OR, NOT, NAND, NOR gates'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 5, 'boolean algebra', 6, 0.75, 2023, '{2020,2022,2023}', 'short', 'Simplify the Boolean expression using laws'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 5, 'half full adder', 5, 0.7, 2022, '{2020,2022}', 'short', 'Design a half adder using logic gates'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 5, 'cro construction', 7, 0.82, 2024, '{2019,2021,2023,2024}', 'long', 'Explain the construction and working of CRO with block diagram'),
((SELECT id FROM polytechnic_board_subjects WHERE code='4209'), 5, 'multimeter wattmeter', 4, 0.6, 2022, '{2020,2022}', 'short', 'Explain the working of a wattmeter')
ON CONFLICT (subject_id, unit_no, topic_keyword) DO UPDATE SET
  frequency = EXCLUDED.frequency,
  importance_score = EXCLUDED.importance_score,
  last_seen_year = EXCLUDED.last_seen_year,
  years_appeared = EXCLUDED.years_appeared,
  question_type = EXCLUDED.question_type,
  sample_question = EXCLUDED.sample_question;
