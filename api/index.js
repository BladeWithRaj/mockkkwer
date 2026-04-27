// ═══════════════════════════════════════════════════════════════
// UNIFIED API ROUTER — All endpoints in a single serverless function
// Vercel Hobby plan: max 12 functions. This keeps it to 1.
// Routes: /api/questions, /api/submit, /api/track, /api/analytics, /api/leaderboard
// ═══════════════════════════════════════════════════════════════

import supabase from "./_lib/supabaseAdmin.js";
import { calculateResult } from "./_lib/utils.js";
import { rateLimitAsync } from "./_lib/rateLimiter.js";
import { createClient } from "@supabase/supabase-js";

// ── Event whitelist for tracking ────────────
const VALID_EVENTS = new Set([
  "page_view", "cta_click", "test_start", "test_submit",
  "nav_click", "setup_change", "question_answer",
  "question_review", "test_resume"
]);

// ═══════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════

export default async function handler(req, res) {
  // Parse the route from the URL path
  const url = req.url || "";
  const path = url.split("?")[0]; // Remove query params

  try {
    // ── /api/questions ──────────────────
    if (path.endsWith("/questions")) {
      return await handleQuestions(req, res);
    }

    // ── /api/submit ─────────────────────
    if (path.endsWith("/submit")) {
      return await handleSubmit(req, res);
    }

    // ── /api/track ──────────────────────
    if (path.endsWith("/track")) {
      return await handleTrack(req, res);
    }

    // ── /api/analytics ──────────────────
    if (path.endsWith("/analytics")) {
      return await handleAnalytics(req, res);
    }

    // ── /api/leaderboard ────────────────
    if (path.endsWith("/leaderboard")) {
      return await handleLeaderboard(req, res);
    }

    // ── /api/set-anon-cookie ────────────
    if (path.endsWith("/set-anon-cookie")) {
      return handleSetAnonCookie(req, res);
    }

    // ── /api/clear-anon-cookie ──────────
    if (path.endsWith("/clear-anon-cookie")) {
      return handleClearAnonCookie(req, res);
    }

    // ── /api/merge-anonymous ────────────
    if (path.endsWith("/merge-anonymous")) {
      return await handleMergeAnonymous(req, res);
    }

    // ── Unknown route ───────────────────
    return res.status(404).json({ error: "Unknown API endpoint", path });

  } catch (err) {
    console.error("[API ROUTER] Unhandled error:", err);
    const status = err.message.includes("Too many") ? 429 : 500;
    return res.status(status).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════
// HANDLER: /api/questions
// ═══════════════════════════════════════════════

async function handleQuestions(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
  await rateLimitAsync(`questions_${clientIp}`, 1000);

  let { limit = 50, subject, difficulty, exam, seen_ids = [] } = req.body;

  limit = parseInt(limit, 10);
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  if (!Array.isArray(seen_ids)) seen_ids = [];
  if (seen_ids.length > 300) seen_ids = seen_ids.slice(-300);

  subject = subject === 'all' ? null : (subject || null);
  difficulty = difficulty === 'all' ? null : (difficulty || null);
  exam = exam === 'all' ? null : (exam || null);

  const { data, error } = await supabase.rpc('get_random_questions', {
    p_limit: limit,
    p_subject: subject,
    p_difficulty: difficulty,
    p_exam: exam,
    p_seen_ids: seen_ids
  });

  if (error) {
    console.error("[API] get_random_questions error:", error);
    throw new Error("Failed to fetch test questions");
  }

  const questions = data || [];
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return res.status(200).json({
    success: true,
    questions: questions,
    next_cursor: null
  });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/submit
// ═══════════════════════════════════════════════

async function handleSubmit(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { questionIds, answers, timeTaken, testId, isDaily, username } = req.body;

  // ── Auth: Verify JWT ──
  let user_id = null;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (token) {
    const authClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    user_id = data.user.id;
  } else {
    user_id = req.body.user_id;
    if (!user_id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    console.warn("[SUBMIT] No JWT — using client user_id:", user_id);
  }

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  await rateLimitAsync(user_id, 5000);

  // ── Validation ──
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return res.status(400).json({ error: "questionIds must be a non-empty array" });
  }
  if (questionIds.length > 200) {
    return res.status(400).json({ error: "Too many questions (max 200)" });
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return res.status(400).json({ error: "answers must be a non-array object" });
  }
  for (const [qId, val] of Object.entries(answers)) {
    if (val !== null && val !== undefined && (typeof val !== 'number' || val < 0 || val > 3 || !Number.isInteger(val))) {
      return res.status(400).json({ error: `Invalid answer value for question ${qId}: must be 0-3` });
    }
  }
  if (typeof timeTaken !== "number" || timeTaken < 0) {
    return res.status(400).json({ error: "timeTaken must be a positive number" });
  }
  if (timeTaken > 36000) {
    return res.status(400).json({ error: "timeTaken exceeds maximum (10 hours)" });
  }

  // ── Fetch questions from DB ──
  const { data: dbQuestions, error: qErr } = await supabase
    .from("questions")
    .select("id, correct_answer, subject, option_a, option_b, option_c, option_d")
    .in("id", questionIds);

  if (qErr) throw qErr;

  if (!dbQuestions || dbQuestions.length !== questionIds.length) {
    return res.status(400).json({ error: "Question tampering detected — ID mismatch" });
  }

  const avgTimePerQ = timeTaken / dbQuestions.length;
  if (avgTimePerQ < 2) {
    return res.status(400).json({ error: "Suspiciously fast submission" });
  }

  // ── Score ──
  const result = calculateResult(dbQuestions, answers);

  await supabase.from("users_light").upsert({
    id: user_id, username
  }, { onConflict: "id" }).catch(() => {});

  const test_id = testId || crypto.randomUUID();
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
    if (insErr.code === '23505') {
      return res.status(409).json({ error: "Duplicate test submission", alreadyExists: true });
    }
    throw insErr;
  }

  return res.json({ success: true, test_id, result });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/track
// ═══════════════════════════════════════════════

async function handleTrack(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const items = Array.isArray(req.body) ? req.body : [req.body];

  if (items.length === 0) {
    return res.status(400).json({ error: "Empty array" });
  }
  if (items.length > 50) {
    return res.status(400).json({ error: "Max 50 events per batch" });
  }

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

  if (payload.length === 0) {
    return res.status(400).json({ error: "No valid events" });
  }

  await supabase.from("events").insert(payload);
  return res.json({ success: true, tracked: payload.length });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/analytics
// ═══════════════════════════════════════════════

async function handleAnalytics(req, res) {
  const { data: events, error } = await supabase
    .from("events")
    .select("event, data, created_at")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;
  if (!events) return res.json({});

  const count = (name) => events.filter(e => e.event === name).length;
  const pageViews = count("page_view");
  const ctaClicks = count("cta_click");
  const starts = count("test_start");
  const submits = count("test_submit");

  const variants = {};
  events.forEach(e => {
    const v = e.data?.variant;
    if (!v) return;
    if (!variants[v]) variants[v] = { views: 0, submits: 0 };
    if (e.event === "page_view") variants[v].views++;
    if (e.event === "test_submit") variants[v].submits++;
  });

  Object.keys(variants).forEach(v => {
    const { views, submits: s } = variants[v];
    variants[v].conversion = views ? ((s / views) * 100).toFixed(1) + "%" : "0%";
  });

  return res.json({
    pageViews, ctaClicks, starts, submits,
    ctr: pageViews ? ((ctaClicks / pageViews) * 100).toFixed(1) : 0,
    startRate: ctaClicks ? ((starts / ctaClicks) * 100).toFixed(1) : 0,
    completion: starts ? ((submits / starts) * 100).toFixed(1) : 0,
    variants
  });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/leaderboard
// ═══════════════════════════════════════════════

async function handleLeaderboard(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data, error } = await supabase.rpc('get_leaderboard_lite');

  if (error) {
    console.error("Leaderboard Error:", error);
    throw new Error("Failed to fetch leaderboard");
  }

  const rankedData = (data || []).map((row, index) => ({
    ...row,
    rank: index + 1
  }));

  return res.status(200).json({ success: true, leaderboard: rankedData });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/set-anon-cookie
// ═══════════════════════════════════════════════

function handleSetAnonCookie(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Token required" });
  }

  // Set httpOnly cookie — invisible to JS, server-only
  res.setHeader("Set-Cookie", `anon_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return res.json({ success: true });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/clear-anon-cookie
// ═══════════════════════════════════════════════

function handleClearAnonCookie(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Expire the cookie immediately
  res.setHeader("Set-Cookie", "anon_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return res.json({ success: true });
}

// ═══════════════════════════════════════════════
// HANDLER: /api/merge-anonymous
// ═══════════════════════════════════════════════

async function handleMergeAnonymous(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Get the email user from Authorization header
  const authHeader = req.headers.authorization || "";
  const emailToken = authHeader.replace(/^Bearer\s+/i, "");

  if (!emailToken) {
    return res.status(401).json({ error: "No auth token" });
  }

  const authClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: emailUserData, error: emailErr } = await authClient.auth.getUser(emailToken);
  if (emailErr || !emailUserData?.user?.email) {
    return res.status(401).json({ error: "Invalid email session" });
  }

  const emailUserId = emailUserData.user.id;

  // 2. Get the anonymous user from cookie
  const cookies = req.headers.cookie || "";
  const anonMatch = cookies.match(/anon_token=([^;]+)/);
  if (!anonMatch) {
    return res.json({ merged: 0, message: "No anonymous cookie found" });
  }

  const anonToken = anonMatch[1];
  const { data: anonUserData, error: anonErr } = await authClient.auth.getUser(anonToken);
  if (anonErr || !anonUserData?.user) {
    return res.json({ merged: 0, message: "Invalid anonymous token" });
  }

  const anonUserId = anonUserData.user.id;

  if (anonUserId === emailUserId) {
    return res.json({ merged: 0, message: "Same user — no merge needed" });
  }

  // 3. Transfer anonymous results to email user
  const { data: updated, error: updateErr } = await supabase
    .from("results")
    .update({ user_id: emailUserId })
    .eq("user_id", anonUserId)
    .select("id");

  if (updateErr) {
    console.error("[MERGE] Error:", updateErr);
    return res.status(500).json({ error: "Merge failed" });
  }

  // 4. Clear cookie
  res.setHeader("Set-Cookie", "anon_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");

  return res.json({ merged: updated?.length || 0, message: "Results merged" });
}
