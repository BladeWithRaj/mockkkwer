-- AI Explanations Cache Table
-- Run this in Supabase SQL Editor

create table if not exists ai_explanations (
  id uuid primary key default gen_random_uuid(),
  question_hash text unique,
  question text,
  explanation text,
  created_at timestamp default now()
);

-- Index for fast lookups
create index if not exists idx_ai_explanations_hash on ai_explanations(question_hash);
