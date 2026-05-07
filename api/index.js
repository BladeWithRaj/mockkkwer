// ═══════════════════════════════════════════════
// UNIFIED API — Single serverless function
// All routes handled here. No extras.
// ═══════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";

// ── Supabase Admin (service role) ─────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
  console.error("❌ MISSING ENV VARS:", {
    SUPABASE_URL: SUPABASE_URL ? "✅" : "❌ MISSING",
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_KEY ? "✅" : "❌ MISSING",
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "✅" : "❌ MISSING"
  });
}

// ── Scoring utility — index-based (no text matching) ──
function calculateResult(questions, answers) {
  let correct = 0, wrong = 0, skipped = 0;
  const topicStats = {};

  questions.forEach(q => {
    const userIdx = answers[q.id];
    if (!topicStats[q.subject]) topicStats[q.subject] = { correct: 0, wrong: 0 };

    if (userIdx === undefined || userIdx === null) {
      skipped++;
      return;
    }

    // Direct index comparison — language-independent
    if (userIdx === q.correct_index) {
      correct++;
      topicStats[q.subject].correct++;
    } else {
      wrong++;
      topicStats[q.subject].wrong++;
    }
  });

  const total = questions.length;
  return {
    correct, wrong, skipped,
    scorePercent: total > 0 ? Math.round((correct / total) * 100) : 0,
    topicStats
  };
}

// ── Valid tracking events ─────────────────────
const VALID_EVENTS = new Set([
  "page_view", "cta_click", "test_start", "test_submit",
  "nav_click", "setup_change", "question_answer",
  "question_review", "test_resume"
]);

// ═══════════════════════════════════════════════
// ROUTER — single entry point
// ═══════════════════════════════════════════════

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Env check
  if (!supabase) {
    return res.status(500).json({
      error: "Server misconfigured — missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      hint: "Set these in Vercel → Project Settings → Environment Variables"
    });
  }

  // Route
  const url = req.url || "";
  const path = url.split("?")[0];

  console.log(`[API] ${req.method} ${path}`);

  try {
    if (path.includes("/submit"))          return await handleSubmit(req, res);
    if (path.includes("/track"))           return await handleTrack(req, res);
    if (path.includes("/analytics"))       return await handleAnalytics(req, res);
    if (path.includes("/leaderboard"))     return await handleLeaderboard(req, res);
    if (path.includes("/avatar"))          return await handleAvatar(req, res);
    if (path.includes("/profile-summary")) return await handleProfileSummary(req, res);
    if (path.includes("/profile"))         return await handleProfile(req, res);
    if (path.includes("/streak"))          return await handleStreak(req, res);
    if (path.includes("/wallet"))          return await handleWallet(req, res);
    if (path.includes("/rewards"))         return await handleRewards(req, res);

    return res.status(404).json({ error: "Route not found", path });
  } catch (err) {
    console.error("[API ERROR]", err.message, err.stack);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// /api/questions — REMOVED (dead code, frontend uses direct Supabase queries)

// ═══════════════════════════════════════════════
// /api/submit — Submit test answers
// ═══════════════════════════════════════════════

async function handleSubmit(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    console.log("---- SUBMIT HIT ----");
    const { questionIds, answers, timeTaken, testId, isDaily, username } = req.body || {};
    console.log("BODY keys:", Object.keys(req.body || {}));

    // 🔐 Verify Clerk session token
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    console.log("TOKEN present:", !!token, "length:", token.length);

    if (!token) {
      console.log("❌ NO TOKEN");
      return res.status(401).json({ error: "No authentication token" });
    }

    let clerkId = null;
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      clerkId = payload.sub;
      console.log("✅ CLERK ID:", clerkId);
    } catch (verifyErr) {
      console.error("❌ VERIFY FAILED:", verifyErr.message);
      console.error("SECRET_KEY set:", !!process.env.CLERK_SECRET_KEY);
      return res.status(401).json({ error: "Invalid or expired session", detail: verifyErr.message });
    }

    if (!clerkId) {
      return res.status(401).json({ error: "Could not extract user identity" });
    }

    // Use clerk_id as the user_id
    const user_id = clerkId;
    const displayName = username || "User";

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: "questionIds required" });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ error: "answers must be object" });
    }
    if (typeof timeTaken !== "number" || timeTaken < 0) {
      return res.status(400).json({ error: "timeTaken required" });
    }

    // Fetch questions from DB (new schema: correct_index)
    const { data: dbQuestions, error: qErr } = await supabase
      .from("questions")
      .select("id, correct_index, subject")
      .in("id", questionIds);

    if (qErr) {
      return res.status(500).json({ error: "DB error: " + qErr.message });
    }

    if (!dbQuestions || dbQuestions.length === 0) {
      return res.status(400).json({ error: "No matching questions found in DB" });
    }

    // Score
    const result = calculateResult(dbQuestions, answers);

    // Upsert user (lookup by id = clerk_id)
    const { data: existingUser, error: lookupErr } = await supabase
      .from("users_light")
      .select("id, total_tests, total_score")
      .eq("id", user_id)
      .single();

    console.log("DB LOOKUP:", existingUser ? "FOUND" : "NOT FOUND", lookupErr?.message || "");

    if (!existingUser) {
      console.log("CREATING USER:", user_id, displayName);
      const { data: newUser, error: insertErr } = await supabase.from("users_light").insert([{
        id: user_id,
        clerk_id: clerkId,
        username: displayName,
        total_tests: 1,
        total_score: result.scorePercent
      }]).select().single();

      if (insertErr) {
        console.error("❌ USER INSERT ERROR:", insertErr.message, insertErr.code, insertErr.details);
      } else {
        console.log("✅ USER CREATED:", newUser?.id);
      }
    } else {
      const { error: updateErr } = await supabase.from("users_light").update({
        username: displayName,
        clerk_id: clerkId,
        total_tests: (existingUser.total_tests || 0) + 1,
        total_score: (existingUser.total_score || 0) + result.scorePercent
      }).eq("id", user_id);

      if (updateErr) {
        console.error("❌ USER UPDATE ERROR:", updateErr.message);
      } else {
        console.log("✅ USER UPDATED");
      }
    }

    // Insert result
    const test_id = testId || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const { error: insErr } = await supabase.from("results").insert([{
      user_id, username: displayName, test_id,
      score_percent: result.scorePercent,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      time_taken: timeTaken,
      topic_wise_accuracy: result.topicStats,
      is_daily: !!isDaily
    }]);

    if (insErr) {
      if (insErr.code === "23505") {
        return res.status(409).json({ error: "Duplicate submission" });
      }
      return res.status(500).json({ error: "Insert failed: " + insErr.message });
    }

    // ── SERVER-SIDE STREAK UPDATE (with grace day) ──
    let streakData = null;
    try {
      const { data } = await supabase.rpc("update_streak_with_grace", { p_user_id: user_id });
      streakData = data || null;
      if (streakData) {
        console.log(`[STREAK] ${displayName}: Day ${streakData.streak}${streakData.graceUsed ? ' (grace day used!)' : ''}`);
      }
    } catch (e) {
      console.warn("[STREAK] RPC failed (non-critical):", e.message);
    }

    // ── DAILY STATS UPSERT ──
    try {
      await supabase.rpc("upsert_daily_stats", {
        p_user_id: user_id,
        p_score: result.scorePercent,
        p_total_questions: dbQuestions.length,
        p_correct: result.correct,
        p_time_taken: timeTaken
      });
    } catch (e) {
      console.warn("[DAILY STATS] RPC failed (non-critical):", e.message);
    }

    // ── SERVER-SIDE GAMIFICATION REWARDS ──
    // Backend is the SINGLE SOURCE OF TRUTH for coins/XP/rewards
    let gamification = null;
    try {
      const totalTime = req.body.totalTime || 99999;
      const speedRatio = totalTime < 99999 ? timeTaken / totalTime : 1;
      const maxCombo = req.body.maxCombo || 0;

      const { data: gamData } = await supabase.rpc("process_test_rewards", {
        p_user_id: user_id,
        p_accuracy: result.scorePercent,
        p_speed_ratio: speedRatio,
        p_max_combo: maxCombo,
        p_correct: result.correct,
        p_is_daily: !!isDaily
      });
      gamification = gamData || null;
      console.log(`[GAMIFICATION] +${gamification?.totalCoins || 0} coins, +${gamification?.totalXP || 0} XP`);
    } catch (e) {
      console.warn("[GAMIFICATION] RPC failed (non-critical):", e.message);
    }

    return res.json({
      success: true,
      test_id,
      result,
      streak: streakData || { streak: 0, best: 0, graceUsed: false, graceDays: 0 },
      gamification
    });
  } catch (err) {
    console.error("[SUBMIT] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/track — Event tracking
// ═══════════════════════════════════════════════

async function handleTrack(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    if (items.length === 0) return res.status(400).json({ error: "Empty" });
    if (items.length > 50) return res.status(400).json({ error: "Max 50" });

    const payload = [];
    for (const item of items) {
      if (!item.event || typeof item.event !== "string") continue;
      if (!VALID_EVENTS.has(item.event)) continue;
      payload.push({
        event: item.event,
        data: typeof item.data === "object" ? item.data : {},
        created_at: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString()
      });
    }

    if (payload.length === 0) return res.status(400).json({ error: "No valid events" });

    const { error } = await supabase.from("events").insert(payload);
    if (error) console.warn("[TRACK] Insert error:", error.message);

    return res.json({ success: true, tracked: payload.length });
  } catch (err) {
    console.error("[TRACK] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/analytics — Growth dashboard data
// ═══════════════════════════════════════════════

async function handleAnalytics(req, res) {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("event, data, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

    if (error) return res.status(500).json({ error: error.message });
    if (!events) return res.json({});

    const count = (n) => events.filter(e => e.event === n).length;
    const pv = count("page_view"), cc = count("cta_click");
    const st = count("test_start"), su = count("test_submit");

    return res.json({
      pageViews: pv, ctaClicks: cc, starts: st, submits: su,
      ctr: pv ? ((cc / pv) * 100).toFixed(1) : 0,
      startRate: cc ? ((st / cc) * 100).toFixed(1) : 0,
      completion: st ? ((su / st) * 100).toFixed(1) : 0
    });
  } catch (err) {
    console.error("[ANALYTICS] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/leaderboard — Top users (v2: daily/weekly/alltime)
// ═══════════════════════════════════════════════

async function handleLeaderboard(req, res) {
  try {
    // Parse mode from query string: /api/leaderboard?mode=daily
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mode = url.searchParams.get("mode") || "alltime";

    // Try enhanced RPC first
    const { data, error } = await supabase.rpc("get_leaderboard_v2", {
      p_mode: mode,
      p_limit: 50
    });

    if (error) {
      // Fallback to v1 RPC
      console.warn("[LEADERBOARD] v2 RPC failed, trying v1:", error.message);
      const { data: v1data, error: v1err } = await supabase.rpc("get_leaderboard_lite");

      if (v1err) {
        // Final fallback: raw query
        const { data: fallback, error: fbErr } = await supabase
          .from("results")
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

      const ranked = (v1data || []).map((r, i) => ({
        ...r, rank: i + 1, streak: 0, avatar: 'default'
      }));
      return res.json({ success: true, leaderboard: ranked, mode });
    }

    const ranked = (data || []).map((r, i) => ({ ...r, rank: i + 1 }));
    return res.json({ success: true, leaderboard: ranked, mode });
  } catch (err) {
    console.error("[LEADERBOARD] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/avatar — Update user avatar
// ═══════════════════════════════════════════════

async function handleAvatar(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { username, avatar } = req.body || {};
    if (!username || !avatar) {
      return res.status(400).json({ error: "username and avatar required" });
    }

    const validAvatars = [
      'default', 'boy1', 'boy2', 'boy3', 'girl1', 'girl2', 'girl3',
      'ninja', 'astronaut', 'robot', 'cat', 'dog', 'panda', 'fox'
    ];

    if (!validAvatars.includes(avatar)) {
      return res.status(400).json({ error: "Invalid avatar" });
    }

    const { error } = await supabase
      .from("users_light")
      .update({ avatar })
      .eq("username", username);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, avatar });
  } catch (err) {
    console.error("[AVATAR] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/profile — Get user profile with rank
// ═══════════════════════════════════════════════

async function handleProfile(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const username = url.searchParams.get("username");

    if (!username) {
      return res.status(400).json({ error: "username required" });
    }

    const { data, error } = await supabase.rpc("get_user_profile", {
      p_username: username
    });

    if (error) {
      // Fallback: basic query
      console.warn("[PROFILE] RPC failed:", error.message);
      const { data: user } = await supabase
        .from("users_light")
        .select("*")
        .eq("username", username)
        .single();

      return res.json({
        success: true,
        profile: user || { username, streak: 0, avatar: 'default' }
      });
    }

    return res.json({
      success: true,
      profile: data?.[0] || { username, streak: 0, avatar: 'default' }
    });
  } catch (err) {
    console.error("[PROFILE] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/streak — Get/update streak
// ═══════════════════════════════════════════════

async function handleStreak(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");

    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      success: true,
      streak: data || { current_streak: 0, best_streak: 0, streak_freeze: 0 }
    });
  } catch (err) {
    console.error("[STREAK] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/wallet — Get user wallet / coins
// ═══════════════════════════════════════════════

async function handleWallet(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");

    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data: wallet, error } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    // Get recent transactions
    const { data: transactions } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

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

// ═══════════════════════════════════════════════
// /api/rewards — Get user rewards
// ═══════════════════════════════════════════════

async function handleRewards(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");

    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data, error } = await supabase
      .from("user_rewards")
      .select("*")
      .eq("user_id", userId);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({
      success: true,
      rewards: data || []
    });
  } catch (err) {
    console.error("[REWARDS] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/profile-summary — UNIFIED profile endpoint
// Single call returns wallet + streak + badges +
// stats + subject analytics + trends
// ═══════════════════════════════════════════════

async function handleProfileSummary(req, res) {
  try {
    // Verify auth
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) return res.status(401).json({ error: "No auth token" });

    let userId = null;
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      userId = payload.sub;
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // Single RPC call for everything
    const { data, error } = await supabase.rpc("get_profile_summary", { p_user_id: userId });

    if (error) {
      console.warn("[PROFILE-SUMMARY] RPC failed:", error.message);
      // Fallback: return basic data
      return res.json({
        success: true,
        wallet: { coins: 0, totalEarned: 0, xp: 0, tier: 1 },
        streak: { current: 0, best: 0, graceDays: 0 },
        badges: [],
        stats: { totalTests: 0, avgScore: 0, bestScore: 0 },
        subjects: [],
        trends: []
      });
    }

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error("[PROFILE-SUMMARY] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
