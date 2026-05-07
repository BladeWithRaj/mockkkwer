-- ============================================================
-- GAMIFICATION HARDENED v1 — Server-side authority
-- Backend validation for coins, XP, rewards, combo caps
-- Run in Supabase SQL Editor
-- ============================================================

-- ══════════════════════════════════════════════
-- 1. USER WALLETS TABLE (if not exists)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_wallets (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     TEXT NOT NULL UNIQUE,
  coins       INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  xp          INT NOT NULL DEFAULT 0,
  tier        INT NOT NULL DEFAULT 1,
  combo_coins_today INT NOT NULL DEFAULT 0,
  combo_date  DATE DEFAULT CURRENT_DATE,
  grace_days  INT NOT NULL DEFAULT 0,
  last_activity_bonus DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════
-- 2. COIN TRANSACTIONS TABLE (if not exists)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     TEXT NOT NULL,
  amount      INT NOT NULL,
  type        TEXT NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions(user_id, created_at DESC);

-- ══════════════════════════════════════════════
-- 3. USER REWARDS TABLE (if not exists)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     TEXT NOT NULL,
  reward_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_reward UNIQUE (user_id, reward_id)
);

-- ══════════════════════════════════════════════
-- 4. USER STREAKS TABLE (enhanced with grace day)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_streaks (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE,
  current_streak  INT NOT NULL DEFAULT 0,
  best_streak     INT NOT NULL DEFAULT 0,
  grace_days      INT NOT NULL DEFAULT 0,
  last_active     DATE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════
-- 5. Add combo_coins_today to daily_stats
-- ══════════════════════════════════════════════

ALTER TABLE public.daily_stats
  ADD COLUMN IF NOT EXISTS combo_coins_earned INT NOT NULL DEFAULT 0;

-- ══════════════════════════════════════════════
-- 6. RPC: SERVER-SIDE REWARD PROCESSOR
-- Called from /api/submit — single source of truth
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION process_test_rewards(
  p_user_id TEXT,
  p_accuracy FLOAT,
  p_speed_ratio FLOAT,
  p_max_combo INT,
  p_correct INT,
  p_is_daily BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_coins INT := 0;
  v_xp INT := 0;
  v_combo_coins INT := 0;
  v_combo_today INT := 0;
  v_combo_cap INT := 50;
  v_rewards JSONB := '[]'::JSONB;
  v_wallet RECORD;
  v_streak RECORD;
  v_old_tier INT;
  v_new_tier INT;
  v_total_tests INT;
  v_activity_bonus BOOLEAN := false;
BEGIN
  -- Get or create wallet
  INSERT INTO public.user_wallets (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;
  v_old_tier := v_wallet.tier;

  -- Reset combo counter if new day
  IF v_wallet.combo_date IS NULL OR v_wallet.combo_date < CURRENT_DATE THEN
    v_combo_today := 0;
  ELSE
    v_combo_today := v_wallet.combo_coins_today;
  END IF;

  -- 1. Base: test complete
  v_coins := v_coins + 10;
  v_xp := v_xp + 20;
  v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','✅','label','Test Complete','coins',10,'xp',20));

  -- 2. High score (90%+)
  IF p_accuracy >= 90 THEN
    v_coins := v_coins + 25;
    v_xp := v_xp + 30;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','🎯','label','90%+ Accuracy','coins',25,'xp',30));
  END IF;

  -- 3. Perfect score
  IF p_accuracy >= 100 THEN
    v_coins := v_coins + 50;
    v_xp := v_xp + 50;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','💯','label','Perfect Score!','coins',50,'xp',50));
  END IF;

  -- 4. Speed bonus
  IF p_speed_ratio <= 0.5 AND p_speed_ratio > 0 THEN
    v_coins := v_coins + 10;
    v_xp := v_xp + 15;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','⚡','label','Speed Bonus','coins',10,'xp',15));
  END IF;

  -- 5. Combo bonus (CAPPED at 50/day)
  IF p_max_combo >= 10 AND v_combo_today < v_combo_cap THEN
    v_combo_coins := LEAST(15, v_combo_cap - v_combo_today);
    v_coins := v_coins + v_combo_coins;
    v_xp := v_xp + 20;
    v_combo_today := v_combo_today + v_combo_coins;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','🔥','label',p_max_combo || 'x Combo!','coins',v_combo_coins,'xp',20));
  ELSIF p_max_combo >= 5 AND v_combo_today < v_combo_cap THEN
    v_combo_coins := LEAST(5, v_combo_cap - v_combo_today);
    v_coins := v_coins + v_combo_coins;
    v_xp := v_xp + 10;
    v_combo_today := v_combo_today + v_combo_coins;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','🔥','label',p_max_combo || 'x Combo','coins',v_combo_coins,'xp',10));
  END IF;

  -- 6. Daily challenge bonus
  IF p_is_daily THEN
    v_coins := v_coins + 15;
    v_xp := v_xp + 25;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','📅','label','Daily Challenge','coins',15,'xp',25));
  END IF;

  -- 7. XP for correct answers
  v_xp := v_xp + (p_correct * 5);

  -- 8. Daily Activity Reward (replaces login bonus) — only once per day, requires test
  IF v_wallet.last_activity_bonus IS NULL OR v_wallet.last_activity_bonus < CURRENT_DATE THEN
    v_coins := v_coins + 5;
    v_xp := v_xp + 10;
    v_activity_bonus := true;
    v_rewards := v_rewards || jsonb_build_array(jsonb_build_object('icon','🌟','label','Daily Activity Reward','coins',5,'xp',10));
  END IF;

  -- Calculate new tier (5 tiers)
  v_new_tier := CASE
    WHEN (v_wallet.xp + v_xp) >= 12000 THEN 5
    WHEN (v_wallet.xp + v_xp) >= 5000 THEN 4
    WHEN (v_wallet.xp + v_xp) >= 2000 THEN 3
    WHEN (v_wallet.xp + v_xp) >= 500 THEN 2
    ELSE 1
  END;

  -- Update wallet
  UPDATE public.user_wallets SET
    coins = coins + v_coins,
    total_earned = total_earned + v_coins,
    xp = xp + v_xp,
    tier = v_new_tier,
    combo_coins_today = v_combo_today,
    combo_date = CURRENT_DATE,
    last_activity_bonus = CASE WHEN v_activity_bonus THEN CURRENT_DATE ELSE last_activity_bonus END,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, reason)
  VALUES (p_user_id, v_coins, 'earn', 'Test completion rewards');

  -- Return result
  RETURN jsonb_build_object(
    'totalCoins', v_coins,
    'totalXP', v_xp,
    'rewards', v_rewards,
    'newTier', v_new_tier,
    'leveledUp', v_new_tier > v_old_tier,
    'wallet', jsonb_build_object('coins', v_wallet.coins + v_coins, 'xp', v_wallet.xp + v_xp, 'tier', v_new_tier)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════
-- 7. RPC: GET PROFILE SUMMARY (unified endpoint)
-- Single call returns everything
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_profile_summary(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_streak RECORD;
  v_badges JSONB;
  v_stats RECORD;
  v_subjects JSONB;
  v_trends JSONB;
BEGIN
  -- Wallet
  SELECT coins, total_earned, xp, tier, grace_days
  INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;

  -- Streak
  SELECT current_streak, best_streak, grace_days as gd
  INTO v_streak FROM public.user_streaks WHERE user_id = p_user_id;

  -- Badges
  SELECT COALESCE(jsonb_agg(reward_id), '[]'::JSONB)
  INTO v_badges FROM public.user_rewards WHERE user_id = p_user_id;

  -- Stats
  SELECT COUNT(*) as total_tests,
         COALESCE(AVG(score_percent), 0) as avg_score,
         COALESCE(MAX(score_percent), 0) as best_score
  INTO v_stats FROM public.results WHERE user_id = p_user_id;

  -- Subject analytics (aggregated from topic_wise_accuracy)
  SELECT COALESCE(jsonb_agg(s), '[]'::JSONB)
  INTO v_subjects
  FROM (
    SELECT key as subject,
           SUM((value->>'correct')::INT) as correct,
           SUM((value->>'wrong')::INT) as wrong,
           ROUND(SUM((value->>'correct')::INT)::NUMERIC /
             NULLIF(SUM((value->>'correct')::INT) + SUM((value->>'wrong')::INT), 0) * 100) as accuracy
    FROM public.results, jsonb_each(topic_wise_accuracy::JSONB)
    WHERE user_id = p_user_id AND topic_wise_accuracy IS NOT NULL
    GROUP BY key
    ORDER BY accuracy ASC
  ) s;

  -- Trends (last 15 tests)
  SELECT COALESCE(jsonb_agg(t ORDER BY t.created_at), '[]'::JSONB)
  INTO v_trends
  FROM (
    SELECT score_percent, created_at
    FROM public.results
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 15
  ) t;

  RETURN jsonb_build_object(
    'wallet', jsonb_build_object(
      'coins', COALESCE(v_wallet.coins, 0),
      'totalEarned', COALESCE(v_wallet.total_earned, 0),
      'xp', COALESCE(v_wallet.xp, 0),
      'tier', COALESCE(v_wallet.tier, 1)
    ),
    'streak', jsonb_build_object(
      'current', COALESCE(v_streak.current_streak, 0),
      'best', COALESCE(v_streak.best_streak, 0),
      'graceDays', COALESCE(v_streak.gd, 0)
    ),
    'badges', v_badges,
    'stats', jsonb_build_object(
      'totalTests', v_stats.total_tests,
      'avgScore', ROUND(v_stats.avg_score::NUMERIC, 1),
      'bestScore', v_stats.best_score
    ),
    'subjects', v_subjects,
    'trends', v_trends
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════
-- 8. STREAK WITH GRACE DAY
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_streak_with_grace(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_rec RECORD;
  v_new_streak INT;
  v_grace_used BOOLEAN := false;
  v_diff INT;
BEGIN
  -- Get or create streak
  INSERT INTO public.user_streaks (user_id, current_streak, best_streak, grace_days, last_active)
  VALUES (p_user_id, 0, 0, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_rec FROM public.user_streaks WHERE user_id = p_user_id;

  -- Already active today
  IF v_rec.last_active = CURRENT_DATE THEN
    RETURN jsonb_build_object('streak', v_rec.current_streak, 'best', v_rec.best_streak, 'graceUsed', false, 'graceDays', v_rec.grace_days);
  END IF;

  IF v_rec.last_active IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_diff := CURRENT_DATE - v_rec.last_active;
    IF v_diff = 1 THEN
      v_new_streak := v_rec.current_streak + 1;
    ELSIF v_diff = 2 AND v_rec.grace_days > 0 THEN
      -- Grace day saves streak!
      v_new_streak := v_rec.current_streak + 1;
      v_grace_used := true;
    ELSE
      v_new_streak := 1;
    END IF;
  END IF;

  -- Auto-grant grace day every 7-day streak (max 2)
  UPDATE public.user_streaks SET
    current_streak = v_new_streak,
    best_streak = GREATEST(v_rec.best_streak, v_new_streak),
    grace_days = CASE
      WHEN v_grace_used THEN v_rec.grace_days - 1
      WHEN v_new_streak > 0 AND v_new_streak % 7 = 0 THEN LEAST(v_rec.grace_days + 1, 2)
      ELSE v_rec.grace_days
    END,
    last_active = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'streak', v_new_streak,
    'best', GREATEST(v_rec.best_streak, v_new_streak),
    'graceUsed', v_grace_used,
    'graceDays', CASE WHEN v_grace_used THEN v_rec.grace_days - 1 ELSE v_rec.grace_days END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════
-- 9. PERMISSIONS
-- ══════════════════════════════════════════════

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Open read for now (service_role writes)
CREATE POLICY IF NOT EXISTS "read_wallets" ON public.user_wallets FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_tx" ON public.coin_transactions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_rewards" ON public.user_rewards FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_streaks" ON public.user_streaks FOR SELECT USING (true);

GRANT SELECT ON public.user_wallets TO anon, authenticated;
GRANT SELECT ON public.coin_transactions TO anon, authenticated;
GRANT SELECT ON public.user_rewards TO anon, authenticated;
GRANT SELECT ON public.user_streaks TO anon, authenticated;

GRANT EXECUTE ON FUNCTION process_test_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_profile_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_streak_with_grace TO anon, authenticated;
