// submit.js – Secure Test Submission (Vercel Serverless)
// ─────────────────────────────────────────────────────
// Anti-cheat:
//   1. Questions fetched from DB (not from client payload)
//   2. Minimum-time validation (5s per question)
//   3. Duplicate test_id rejection
//   4. Per-user rate limiting
// ─────────────────────────────────────────────────────

import supabase from "./_lib/supabaseAdmin.js";
import { verifyUser } from "./_lib/auth.js";
import { calculateResult } from "./_lib/utils.js";
import { rateLimit } from "./_lib/rateLimiter.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ── 1. Auth ─────────────────────────────────
    const user = await verifyUser(req);
    rateLimit(user.id);

    // ── 2. Extract payload ──────────────────────
    const { questionIds, answers, timeTaken, testId, isDaily } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: "questionIds must be a non-empty array" });
    }
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "answers must be an object" });
    }
    if (typeof timeTaken !== "number" || timeTaken < 0) {
      return res.status(400).json({ error: "timeTaken must be a positive number" });
    }

    // ── 3. Fetch canonical questions from DB ────
    const { data: dbQuestions, error: qErr } = await supabase
      .from("questions")
      .select("id, correct_answer, subject")
      .in("id", questionIds);

    if (qErr) throw qErr;

    if (!dbQuestions || dbQuestions.length !== questionIds.length) {
      return res.status(400).json({ error: "Question tampering detected — ID mismatch" });
    }

    // ── 3.5 Daily Challenge Validation ──────────
    if (isDaily) {
      const { getUTCDateString, generateDailyChallenge } = await import("./_lib/dailyUtils.js");
      const todayStr = getUTCDateString();
      
      // We must load all questions to generate the seed correctly.
      // Optimally, we just fetch IDs.
      const { data: allIds } = await supabase.from("questions").select("id");
      const dailyIds = generateDailyChallenge(allIds, todayStr);
      
      // Verify submitted IDs match today's seeded IDs exactly
      const submittedIdsSet = new Set(questionIds);
      const isMatch = dailyIds.length === questionIds.length && dailyIds.every(id => submittedIdsSet.has(id));
      
      if (!isMatch) {
         return res.status(400).json({ error: "Daily Challenge questions do not match today's seed" });
      }

      // ── Enforce exactly 1 daily challenge per UTC day (Server-Side Lock) ──
      const { data: existingDaily } = await supabase
        .from("results")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_daily", true)
        .gte("created_at", `${todayStr}T00:00:00Z`)
        .lt("created_at", `${todayStr}T23:59:59.999Z`)
        .limit(1);

      if (existingDaily && existingDaily.length > 0) {
        return res.status(409).json({ error: "Daily challenge already completed today" });
      }
    }

    // ── 4. Time validation ──────────────────────
    const avgTimePerQ = timeTaken / dbQuestions.length;
    if (avgTimePerQ < 5) {
      console.warn("[SUBMIT] BLOCKED – too fast:", { userId: user.id, avgTimePerQ });
      return res.status(400).json({ error: "Suspiciously fast submission" });
    }
    if (avgTimePerQ < 8) {
      console.warn("[SUBMIT] FLAGGED – borderline fast:", { userId: user.id, avgTimePerQ });
      // Persist flag to DB — leaderboard reads this
      await supabase.from("user_flags").upsert({
        user_id: user.id,
        is_flagged: true,
        flag_reason: `avg_time_per_q=${avgTimePerQ.toFixed(1)}s (threshold: 8s)`
      }, { onConflict: "user_id" }).catch(() => {});
    }

    // ── 5. Duplicate test prevention ────────────
    const test_id = testId || crypto.randomUUID();

    const { data: existing } = await supabase
      .from("results")
      .select("id")
      .eq("test_id", test_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Duplicate test submission", alreadyExists: true });
    }

    // ── 6. Server-side scoring ──────────────────
    const result = calculateResult(dbQuestions, answers);

    // ── 7. Insert Result ────────────────────────
    const { error: insErr } = await supabase.from("results").insert([{
      user_id: user.id,
      test_id,
      score_percent: result.scorePercent,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      time_taken: timeTaken,
      topic_wise_accuracy: result.topicStats,
      is_daily: !!isDaily
    }]);

    if (insErr) throw insErr;

    // ── 8. Streak Update (If Daily) ─────────────
    let streakData = null;
    if (isDaily) {
      const { getUTCDateString } = await import("./_lib/dailyUtils.js");
      const today = getUTCDateString();
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      // Fetch current streak
      const { data: currentStreakRow } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let current_streak = 1;
      let longest_streak = 1;

      if (currentStreakRow) {
        if (currentStreakRow.last_challenge_date === yesterday) {
          current_streak = currentStreakRow.current_streak + 1;
        } else if (currentStreakRow.last_challenge_date !== today) {
          current_streak = 1; // missed a day, reset
        } else {
          current_streak = currentStreakRow.current_streak; // already done today (should be blocked above, but safe fallback)
        }
        longest_streak = Math.max(current_streak, currentStreakRow.longest_streak);
      }

      await supabase.from("user_streaks").upsert({
        user_id: user.id,
        current_streak,
        longest_streak,
        last_challenge_date: today
      });

      streakData = { current_streak, longest_streak };
    }

    // ── 9. Invalidate Cache ─────────────────────
    // For MVP serverless, we emit a signal or drop local.
    // In production, this would be `kv.del("leaderboard:weekly")`
    // We will simulate it by telling the API to fetch fresh next time.
    // However, Vercel caches per-instance.
    
    return res.json({ success: true, test_id, result, streak: streakData });

  } catch (err) {
    const status = err.message.includes("Too many") ? 429 : 400;
    return res.status(status).json({ error: err.message });
  }
}
