-- ============================================================
-- BTEUP Polytechnic Paper Generator — Schema + Seed
-- File: 00_polytechnic_engine.sql
-- ============================================================

-- 1. Subjects master table
CREATE TABLE IF NOT EXISTS polytechnic_board_subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester INTEGER NOT NULL,
  renderer_type TEXT NOT NULL DEFAULT 'PATTERN_MATH',
  prompt_namespace TEXT NOT NULL,
  marks_total INTEGER NOT NULL DEFAULT 60,
  paper_style TEXT NOT NULL DEFAULT 'descriptive',
  supports_bilingual BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Unit-level syllabus table
CREATE TABLE IF NOT EXISTS polytechnic_subject_units (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES polytechnic_board_subjects(id),
  unit_no INTEGER NOT NULL,
  unit_name TEXT NOT NULL,
  topics TEXT NOT NULL,
  weightage INTEGER DEFAULT 20,
  important_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEED: Subject 1 — Mathematics-II (4201)
-- ============================================================
INSERT INTO polytechnic_board_subjects (name, code, semester, renderer_type, prompt_namespace, marks_total, paper_style, supports_bilingual)
VALUES ('Mathematics-II', '4201', 2, 'PATTERN_MATH', 'math2', 60, 'part_abcd', true);

INSERT INTO polytechnic_subject_units (subject_id, unit_no, unit_name, topics, weightage, important_keywords) VALUES
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4201'),
  1,
  'Determinants & Matrices',
  'Properties of determinants (up to 3rd order), Minors & Cofactors, Cramer''s rule, Types of matrices (symmetric, skew-symmetric, orthogonal, Hermitian, skew-Hermitian, unitary), Algebra of matrices, Adjoint & Inverse, Rank, Consistency',
  20,
  ARRAY['determinant','matrix','cramer','adjoint','inverse','rank','consistency']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4201'),
  2,
  'Differential Calculus-II',
  'Successive differentiation, Leibnitz theorem, Partial differentiation, Euler''s theorem on homogeneous functions, Total differential coefficients, Maxima and Minima of two variables',
  20,
  ARRAY['leibnitz','partial','euler','maxima','minima','successive']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4201'),
  3,
  'Integral Calculus',
  'Integration by parts, Definite integrals and properties, Reduction formulae, Beta and Gamma functions, Numerical integration — Trapezoidal, Simpson''s 1/3, Simpson''s 3/8',
  20,
  ARRAY['integration','beta','gamma','trapezoidal','simpson','reduction']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4201'),
  4,
  'Differential Equations',
  'Order and degree, Formation of DE, Variable separable, Homogeneous, Linear, Bernoulli, Exact, Second order with constant coefficients',
  20,
  ARRAY['differential equation','bernoulli','exact','homogeneous','complementary','particular integral']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4201'),
  5,
  'Coordinate Geometry & Vector Algebra',
  'Circle equation, center & radius, tangent & normal, Parabola, Ellipse, Hyperbola, Vector types, Dot product, Cross product, Scalar triple product',
  20,
  ARRAY['circle','parabola','ellipse','hyperbola','vector','dot product','cross product']
);

-- ============================================================
-- SEED: Subject 2 — FEEE (4209)
-- ============================================================
INSERT INTO polytechnic_board_subjects (name, code, semester, renderer_type, prompt_namespace, marks_total, paper_style, supports_bilingual)
VALUES ('Fundamentals of Electrical and Electronics Engineering', '4209', 2, 'PATTERN_FEEE', 'feee', 60, 'question_choice', true);

INSERT INTO polytechnic_subject_units (subject_id, unit_no, unit_name, topics, weightage, important_keywords) VALUES
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4209'),
  1,
  'DC Circuits & Magnetic Circuits',
  'Ohm''s law, Kirchhoff''s laws, Series-parallel circuits, Star-delta conversion, Electromagnetic induction, Faraday''s laws, Lenz''s law, Self and mutual inductance',
  20,
  ARRAY['ohm','kirchhoff','series','parallel','faraday','lenz','inductance']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4209'),
  2,
  'AC Circuits',
  'AC fundamentals, RMS and average values, Phasor diagrams, R-L, R-C, R-L-C circuits, Power factor, Resonance, Three-phase systems',
  20,
  ARRAY['phasor','power factor','resonance','RLC','three-phase','AC']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4209'),
  3,
  'Electrical Machines',
  'Transformer construction and working, EMF equation, Losses and efficiency, DC motor types, Induction motor principle, Synchronous motor basics',
  20,
  ARRAY['transformer','EMF','induction motor','DC motor','synchronous','efficiency']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4209'),
  4,
  'Electronic Devices',
  'PN junction diode, Zener diode, Rectifiers (half-wave, full-wave, bridge), Transistor (BJT) basics, FET/MOSFET, Transistor as switch/amplifier',
  20,
  ARRAY['diode','zener','rectifier','transistor','MOSFET','FET','BJT']
),
(
  (SELECT id FROM polytechnic_board_subjects WHERE code = '4209'),
  5,
  'Digital Electronics & Instruments',
  'Logic gates (AND, OR, NOT, NAND, NOR, XOR), Boolean algebra, Half/Full adder, Flip-flops, CRO construction and applications, Multimeters, Wattmeter',
  20,
  ARRAY['logic gates','boolean','adder','flip-flop','CRO','wattmeter','multimeter']
);
