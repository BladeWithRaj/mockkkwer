// ═══════════════════════════════════════════════
// PROFILE HANDLERS — Avatar, Profile, Streak,
// Wallet, Rewards, ProfileSummary, Leaderboard
// ═══════════════════════════════════════════════

import { extractUserToken, verifyUserSession } from "../userSession.js";

export async function handleLeaderboard(supabase, req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mode = url.searchParams.get("mode") || "alltime";

    const { data, error } = await supabase.rpc("get_leaderboard_v2", { p_mode: mode, p_limit: 50 });

    if (error) {
      console.warn("[LEADERBOARD] v2 failed, trying v1:", error.message);
      const { data: v1data, error: v1err } = await supabase.rpc("get_leaderboard_lite");

      if (v1err) {
        const { data: fallback, error: fbErr } = await supabase
          .from("test_attempts")
          .select("username, score_percent")
          .order("score_percent", { ascending: false })
          .limit(20);

        if (fbErr) return res.status(500).json({ error: fbErr.message });
        const ranked = (fallback || []).map((r, i) => ({
          ...r, rank: i + 1, best_score: r.score_percent,
          total_tests: 1, streak: 0, avatar: 'default'
        }));
        return res.json({ success: true, leaderboard: ranked, mode });
      }

      const ranked = (v1data || []).map((r, i) => ({ ...r, rank: i + 1, streak: 0, avatar: 'default' }));
      return res.json({ success: true, leaderboard: ranked, mode });
    }

    const ranked = (data || []).map((r, i) => ({ ...r, rank: i + 1 }));
    return res.json({ success: true, leaderboard: ranked, mode });
  } catch (err) {
    console.error("[LEADERBOARD] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleAvatar(supabase, req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { username, avatar } = req.body || {};
    if (!username || !avatar) return res.status(400).json({ error: "username and avatar required" });

    const validAvatars = [
      'default', 'boy1', 'boy2', 'boy3', 'girl1', 'girl2', 'girl3',
      'ninja', 'astronaut', 'robot', 'cat', 'dog', 'panda', 'fox'
    ];
    if (!validAvatars.includes(avatar)) return res.status(400).json({ error: "Invalid avatar" });

    const { error } = await supabase.from("users").update({ avatar }).eq("username", username);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, avatar });
  } catch (err) {
    console.error("[AVATAR] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleProfile(supabase, req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const username = url.searchParams.get("username");
    if (!username) return res.status(400).json({ error: "username required" });

    const { data, error } = await supabase.rpc("get_user_profile", { p_username: username });

    if (error) {
      console.warn("[PROFILE] RPC failed:", error.message);
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      return res.json({
        success: true,
        user: user || { username, total_tests: 0, total_score: 0 },
        rank: null, recentTests: []
      });
    }
    return res.json({ success: true, ...data });
  } catch (err) {
    console.error("[PROFILE] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleStreak(supabase, req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");
    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data, error } = await supabase
      .from("user_streaks").select("*").eq("user_id", userId).single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    return res.json({
      success: true,
      streak: data || { current_streak: 0, best_streak: 0, streak_freeze: 0 }
    });
  } catch (err) {
    console.error("[STREAK] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleWallet(supabase, req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");
    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data: wallet, error } = await supabase
      .from("user_wallets").select("*").eq("user_id", userId).single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });

    const { data: transactions } = await supabase
      .from("coin_transactions").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(20);

    return res.json({
      success: true,
      wallet: wallet || { coins: 0, total_earned: 0 },
      transactions: transactions || []
    });
  } catch (err) {
    console.error("[WALLET] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleRewards(supabase, req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");
    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data, error } = await supabase.from("user_rewards").select("*").eq("user_id", userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, rewards: data || [] });
  } catch (err) {
    console.error("[REWARDS] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleProfileSummary(supabase, req, res) {
  try {
    const userToken = extractUserToken(req);
    let userId = null;

    if (userToken) {
      const session = await verifyUserSession(supabase, userToken);
      if (session.valid) userId = session.userId;
    }

    if (!userId) {
      const authHeader = req.headers.authorization || "";
      userId = authHeader.replace(/^Bearer\s+/i, "").trim();
    }

    if (!userId) return res.status(401).json({ error: "No user identity" });

    const { data, error } = await supabase.rpc("get_profile_summary", { p_user_id: userId });

    if (error) {
      console.warn("[PROFILE-SUMMARY] RPC failed:", error.message);
      return res.json({
        success: true,
        wallet: { coins: 0, totalEarned: 0, xp: 0, tier: 1 },
        streak: { current: 0, best: 0, graceDays: 0 },
        badges: [], stats: { totalTests: 0, avgScore: 0, bestScore: 0 },
        subjects: [], trends: []
      });
    }

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error("[PROFILE-SUMMARY] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
