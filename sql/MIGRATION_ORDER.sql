-- ═══════════════════════════════════════════════
-- MockTestPro — DATABASE MIGRATION ORDER
-- 
-- Run these in EXACT order in Supabase SQL Editor.
-- Each file is idempotent (safe to re-run).
-- ═══════════════════════════════════════════════

-- ── STEP 1: Core Questions Table ──
-- \i sql/01_production_schema.sql
-- Creates: questions table, RLS policies, random_seed index
-- Dependencies: NONE

-- ── STEP 2: Users (lightweight) ──
-- \i sql/02_users_light.sql
-- Creates: users_light table
-- Dependencies: NONE

-- ── STEP 3: Events/Tracking ──
-- \i sql/03_events_table.sql
-- Creates: events table
-- Dependencies: NONE

-- ── STEP 4: Production System (attempts, leaderboard) ──
-- \i sql/04_production_system.sql
-- Creates: test_attempts, leaderboard views, RPC functions
-- Dependencies: 01, 02

-- ── STEP 5: Hindi/Bilingual Columns ──
-- \i sql/add_hindi_columns.sql
-- Adds: question_hi, options_hi to questions
-- Dependencies: 01

-- ── STEP 6: Gamification System ──
-- \i sql/06_gamification_hardened.sql
-- Creates: wallets, badges, streaks, daily goals
-- Dependencies: 02

-- ── STEP 7: Test Attempts Evolution ──
-- \i sql/08_evolve_attempts.sql
-- Adds: total_questions, attempted, etc to test_attempts
-- Dependencies: 04

-- ── STEP 8: Admin System ──
-- \i sql/09_admin_users.sql
-- Creates: admin_users, admin_sessions (with csrf_token), admin_login_log
-- Dependencies: NONE
-- ⚠️ REQUIRES manual password hash insertion after running

-- ── STEP 9: Extended Question Schema ──
-- \i sql/10_extended_question_schema.sql
-- Adds: board, topic, year, source, marks to questions
-- Dependencies: 01

-- ═══════════════════════════════════════════════
-- DEPRECATED / ALREADY MERGED
-- Do NOT run these standalone:
--   05_clerk_migration.sql  → Clerk removed, not needed
--   07_rival_battles.sql    → Optional, run after step 6
--   daily_system.sql        → Merged into 06
--   leaderboard_v3.sql      → Merged into 04
--   rate_limits.sql         → Handled in-memory
--   seed_questions.sql      → One-time seed, already run
--   02_users_light.sql      → Superseded by step 10 (13_canonical_users.sql)
-- ═══════════════════════════════════════════════

-- ── STEP 10: Canonical Users (rename users_light → users) ──
-- \i sql/13_canonical_users.sql
-- Renames users_light → users OR creates fresh users table
-- Dependencies: 02 (must exist first to rename)
-- ⚠️ RUN THIS BEFORE step 11

-- ── STEP 11: User Sessions ──
-- \i sql/11_user_sessions.sql
-- Creates: user_sessions table for httpOnly cookie auth
-- Dependencies: 10 (users table)

-- ── STEP 12: Exam Configs ──
-- \i sql/12_exam_configs.sql
-- Creates: exam_configs table + seeds SSC/Railway/Banking exams
-- Dependencies: NONE

-- ═══════════════════════════════════════════════
-- REQUIRED TABLE VERIFICATION
-- Run AFTER all migrations:
-- ═══════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'questions',
    'users',
    'events',
    'test_attempts',
    'user_sessions',
    'admin_users',
    'admin_sessions',
    'admin_login_log',
    'exam_configs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      RAISE WARNING '❌ MISSING TABLE: %', tbl;
    ELSE
      RAISE NOTICE '✅ TABLE EXISTS: %', tbl;
    END IF;
  END LOOP;
END $$;
