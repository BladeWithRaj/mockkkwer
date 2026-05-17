-- ═══════════════════════════════════════════════
-- EXTENDED QUESTION SCHEMA — Content Operating System
-- Adds: board, topic, year, source, marks
-- Safe to run on existing tables (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ═══════════════════════════════════════════════

-- Extended metadata columns for question tagging
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS board TEXT;       -- SSC, Railway, Banking, UPSC
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic TEXT;       -- Algebra, Polity, Geography...
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS year TEXT;        -- PYQ year: 2023, 2024
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source TEXT;      -- Official paper, Book name
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS marks NUMERIC;   -- Per-question marks (2, 0.5...)

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_questions_board ON public.questions(board);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_year ON public.questions(year);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_questions_board_subject ON public.questions(board, subject);
