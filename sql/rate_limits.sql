-- Rate Limits table for durable cross-instance rate limiting
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  last_request TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Auto-cleanup: delete entries older than 1 hour
-- (prevents table from growing indefinitely)
-- Run as a Supabase cron job or pg_cron:
-- SELECT cron.schedule('cleanup-rate-limits', '*/30 * * * *', 
--   $$DELETE FROM rate_limits WHERE last_request < now() - interval '1 hour'$$
-- );

-- RLS: only service role can access (server-side only)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role key can access (correct for server-side)
