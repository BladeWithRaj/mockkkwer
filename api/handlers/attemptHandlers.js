// ═══════════════════════════════════════════════
// ATTEMPT HANDLERS — Submit test, scoring
// ═══════════════════════════════════════════════

import { extractUserToken } from "../_lib/userSession.js";
import { verifyUserSession } from "../_lib/userSession.js";

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

export async function handleSubmit(supabase, req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { questionIds, answers, timeTaken, testId, isDaily, username } = req.body || {};

    // Session-based identity (httpOnly cookie)
    const userToken = extractUserToken(req);
    let user_id = null;
    let displayName = "User";

    if (userToken) {
      const session = await verifyUserSession(supabase, userToken);
      if (session.valid) {
        user_id = session.userId;
        displayName = session.username;
      }
    }

    // Fallback: accept username from body for backward compat (will be removed)
    if (!user_id) {
      if (username && username !== "User") {
        displayName = username;
        user_id = username.toLowerCase().trim();
        console.warn("[SUBMIT] ⚠️ Using body username (no session cookie) — will be deprecated");
      } else {
        return res.status(401).json({ error: "Authentication required. Please login." });
      }
    }

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
      .select("id, correct_index, subject")
      .in("id", questionIds);

    if (qErr) return res.status(500).json({ error: "DB error: " + qErr.message });
    if (!dbQuestions || dbQuestions.length === 0) {
      return res.status(400).json({ error: "No matching questions found in DB" });
    }

    // Score
    const result = calculateResult(dbQuestions, answers);

    // Upsert user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, total_tests, total_score")
      .eq("id", user_id)
      .single();

    if (!existingUser) {
      await supabase.from("users").insert([{
        id: user_id, username: displayName,
        total_tests: 1, total_score: result.scorePercent
      }]);
    } else {
      await supabase.from("users").update({
        username: displayName,
        total_tests: (existingUser.total_tests || 0) + 1,
        total_score: (existingUser.total_score || 0) + result.scorePercent
      }).eq("id", user_id);
    }

    // Insert attempt
    const test_id = testId || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const { error: insErr } = await supabase.from("test_attempts").insert([{
      user_id, username: displayName, test_id,
      score_percent: result.scorePercent,
      correct: result.correct, wrong: result.wrong, skipped: result.skipped,
      time_taken: timeTaken,
      topic_wise_accuracy: result.topicStats,
      is_daily: !!isDaily
    }]);

    if (insErr) {
      if (insErr.code === "23505") return res.status(409).json({ error: "Duplicate submission" });
      return res.status(500).json({ error: "Insert failed: " + insErr.message });
    }

    // Streak update (non-critical)
    let streakData = null;
    try {
      const { data } = await supabase.rpc("update_streak_with_grace", { p_user_id: user_id });
      streakData = data || null;
    } catch (e) { console.warn("[STREAK] RPC failed:", e.message); }

    // Daily stats (non-critical)
    try {
      await supabase.rpc("upsert_daily_stats", {
        p_user_id: user_id, p_score: result.scorePercent,
        p_total_questions: dbQuestions.length, p_correct: result.correct, p_time_taken: timeTaken
      });
    } catch (e) { console.warn("[DAILY STATS] RPC failed:", e.message); }

    // Gamification rewards (non-critical)
    let gamification = null;
    try {
      const totalTime = req.body.totalTime || 99999;
      const speedRatio = totalTime < 99999 ? timeTaken / totalTime : 1;
      const { data: gamData } = await supabase.rpc("process_test_rewards", {
        p_user_id: user_id, p_accuracy: result.scorePercent,
        p_speed_ratio: speedRatio, p_max_combo: req.body.maxCombo || 0,
        p_correct: result.correct, p_is_daily: !!isDaily
      });
      gamification = gamData || null;
    } catch (e) { console.warn("[GAMIFICATION] RPC failed:", e.message); }

    return res.json({
      success: true, test_id, result,
      streak: streakData || { streak: 0, best: 0, graceUsed: false, graceDays: 0 },
      gamification
    });
  } catch (err) {
    console.error("[SUBMIT] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
