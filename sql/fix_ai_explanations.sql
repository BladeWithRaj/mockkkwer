drop table if exists ai_explanations;

create table ai_explanations (
  id uuid primary key default gen_random_uuid(),
  question_hash text unique,
  explanation text,
  created_at timestamp default now()
);
