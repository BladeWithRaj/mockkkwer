-- ============================================================
-- merge_anonymous_results RPC
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================

-- Add created_by column for audit trail (if not exists)
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Atomic merge function
CREATE OR REPLACE FUNCTION public.merge_anonymous_results(
  old_uid UUID,
  new_uid UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- runs with owner privileges
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Guard 1: old user must be anonymous (no email in auth.users)
  IF (SELECT email FROM auth.users WHERE id = old_uid) IS NOT NULL THEN
    RAISE EXCEPTION 'Old UID is not anonymous';
  END IF;

  -- Guard 2: new user must be verified (has email)
  IF (SELECT email FROM auth.users WHERE id = new_uid) IS NULL THEN
    RAISE EXCEPTION 'New UID must be a verified user';
  END IF;

  -- Guard 3: don't merge into self
  IF old_uid = new_uid THEN
    RETURN 0;
  END IF;

  -- Atomic update — all rows or none
  UPDATE public.results
  SET user_id    = new_uid,
      created_by = COALESCE(created_by, old_uid)  -- preserve original creator
  WHERE user_id = old_uid;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

-- Grant execute to service_role only (server-side calls)
REVOKE ALL ON FUNCTION public.merge_anonymous_results(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_anonymous_results(UUID, UUID) TO service_role;
