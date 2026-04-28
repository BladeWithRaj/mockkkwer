// ═══════════════════════════════════════════════
// UNIFIED API — Single serverless function
// All routes handled here. No extras.
// ═══════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

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

// ── Scoring utility (inline, no import needed) ──
function calculateResult(questions, answers) {
  let correct = 0, wrong = 0, skipped = 0;
  const topicStats = {};
  const optionKeys = ["option_a", "option_b", "option_c", "option_d"];

  questions.forEach(q => {
    const userIdx = answers[q.id];
    if (!topicStats[q.subject]) topicStats[q.subject] = { correct: 0, wrong: 0 };

    if (userIdx === undefined || userIdx === null) {
      skipped++;
      return;
    }

    const optKey = optionKeys[userIdx];
    if (!optKey) { wrong++; topicStats[q.subject].wrong++; return; }

    const userText = q[optKey];
    if (userText === q.correct_answer) {
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
    if (path.includes("/questions"))       return await handleQuestions(req, res);
    if (path.includes("/submit"))          return await handleSubmit(req, res);
    if (path.includes("/track"))           return await handleTrack(req, res);
    if (path.includes("/analytics"))       return await handleAnalytics(req, res);
    if (path.includes("/leaderboard"))     return await handleLeaderboard(req, res);
    if (path.includes("/set-anon-cookie")) return handleSetAnonCookie(req, res);
    if (path.includes("/clear-anon-cookie")) return handleClearAnonCookie(req, res);
    if (path.includes("/merge-anonymous")) return await handleMergeAnonymous(req, res);

    return res.status(404).json({ error: "Route not found", path });
  } catch (err) {
    console.error("[API ERROR]", err.message, err.stack);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// ═══════════════════════════════════════════════
// /api/questions — Fetch random questions
// ═══════════════════════════════════════════════

async function handleQuestions(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    let { limit = 50, subject, difficulty, exam, seen_ids = [] } = req.body || {};

    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 200) limit = 200;
    if (!Array.isArray(seen_ids)) seen_ids = [];
    if (seen_ids.length > 300) seen_ids = seen_ids.slice(-300);

    subject = subject === "all" ? null : (subject || null);
    difficulty = difficulty === "all" ? null : (difficulty || null);
    exam = exam === "all" ? null : (exam || null);

    // Try RPC first, fallback to direct query
    let questions = [];

    const { data, error } = await supabase.rpc("get_random_questions", {
      p_limit: limit,
      p_subject: subject,
      p_difficulty: difficulty,
      p_exam: exam,
      p_seen_ids: seen_ids
    });

    if (error) {
      console.warn("[QUESTIONS] RPC failed, trying direct query:", error.message);
      // Fallback: direct table query
      let query = supabase.from("questions").select("*").limit(limit);
      if (subject) query = query.eq("subject", subject);
      if (difficulty) query = query.eq("difficulty", difficulty);

      const { data: fallbackData, error: fallbackErr } = await query;
      if (fallbackErr) {
        console.error("[QUESTIONS] Fallback also failed:", fallbackErr);
        return res.status(500).json({ error: "Failed to fetch questions: " + fallbackErr.message });
      }
      questions = fallbackData || [];
    } else {
      questions = data || [];
    }

    // Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return res.json({ success: true, questions });
  } catch (err) {
    console.error("[QUESTIONS] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/submit — Submit test answers
// ═══════════════════════════════════════════════

async function handleSubmit(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { questionIds, answers, timeTaken, testId, isDaily, username } = req.body || {};

    // Auth: try JWT first, fallback to client user_id
    let user_id = null;
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (token && SUPABASE_ANON_KEY) {
      try {
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await authClient.auth.getUser(token);
        if (!error && data?.user) user_id = data.user.id;
      } catch (e) {
        console.warn("[SUBMIT] JWT check failed:", e.message);
      }
    }

    if (!user_id) {
      user_id = req.body?.user_id;
      if (!user_id) {
        return res.status(401).json({ error: "No user_id or valid token" });
      }
    }

    if (!username) return res.status(400).json({ error: "username required" });
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: "questionIds required" });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ error: "answers must be object" });
    }
    if (typeof timeTaken !== "number" || timeTaken < 0) {
      return res.status(400).json({ error: "timeTaken required" });
    }

    // Fetch questions from DB
    const { data: dbQuestions, error: qErr } = await supabase
      .from("questions")
      .select("id, correct_answer, subject, option_a, option_b, option_c, option_d")
      .in("id", questionIds);

    if (qErr) {
      return res.status(500).json({ error: "DB error: " + qErr.message });
    }

    if (!dbQuestions || dbQuestions.length === 0) {
      return res.status(400).json({ error: "No matching questions found in DB" });
    }

    // Score
    const result = calculateResult(dbQuestions, answers);

    // Upsert user
    await supabase.from("users_light").upsert(
      { id: user_id, username },
      { onConflict: "id" }
    ).catch(() => {});

    // Insert result
    const test_id = testId || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const { error: insErr } = await supabase.from("results").insert([{
      user_id, username, test_id,
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

    return res.json({ success: true, test_id, result });
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
// /api/leaderboard — Top users
// ═══════════════════════════════════════════════

async function handleLeaderboard(req, res) {
  try {
    const { data, error } = await supabase.rpc("get_leaderboard_lite");

    if (error) {
      // Fallback: simple query
      console.warn("[LEADERBOARD] RPC failed:", error.message);
      const { data: fallback, error: fbErr } = await supabase
        .from("results")
        .select("username, score_percent")
        .order("score_percent", { ascending: false })
        .limit(20);

      if (fbErr) return res.status(500).json({ error: fbErr.message });

      const ranked = (fallback || []).map((r, i) => ({ ...r, rank: i + 1 }));
      return res.json({ success: true, leaderboard: ranked });
    }

    const ranked = (data || []).map((r, i) => ({ ...r, rank: i + 1 }));
    return res.json({ success: true, leaderboard: ranked });
  } catch (err) {
    console.error("[LEADERBOARD] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/set-anon-cookie
// ═══════════════════════════════════════════════

function handleSetAnonCookie(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "Token required" });
    res.setHeader("Set-Cookie", `anon_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// /api/clear-anon-cookie
// ═══════════════════════════════════════════════

function handleClearAnonCookie(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  res.setHeader("Set-Cookie", "anon_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return res.json({ success: true });
}

// ═══════════════════════════════════════════════
// /api/merge-anonymous
// ═══════════════════════════════════════════════

async function handleMergeAnonymous(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const authHeader = req.headers.authorization || "";
    const emailToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!emailToken || !SUPABASE_ANON_KEY) {
      return res.json({ merged: 0, message: "No token" });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: emailUser } = await authClient.auth.getUser(emailToken);
    if (!emailUser?.user?.email) {
      return res.json({ merged: 0, message: "No email session" });
    }

    const cookies = req.headers.cookie || "";
    const match = cookies.match(/anon_token=([^;]+)/);
    if (!match) return res.json({ merged: 0, message: "No anon cookie" });

    const { data: anonUser } = await authClient.auth.getUser(match[1]);
    if (!anonUser?.user) return res.json({ merged: 0, message: "Bad anon token" });

    if (anonUser.user.id === emailUser.user.id) {
      return res.json({ merged: 0, message: "Same user" });
    }

    const { data: updated } = await supabase
      .from("results")
      .update({ user_id: emailUser.user.id })
      .eq("user_id", anonUser.user.id)
      .select("id");

    res.setHeader("Set-Cookie", "anon_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return res.json({ merged: updated?.length || 0 });
  } catch (err) {
    console.error("[MERGE] Crash:", err);
    return res.json({ merged: 0, message: err.message });
  }
}
