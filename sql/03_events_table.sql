-- sql/03_events_table.sql
CREATE TABLE IF NOT EXISTS public.events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimize for analytics queries
CREATE INDEX IF NOT EXISTS idx_events_event ON public.events (event);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events (created_at);
