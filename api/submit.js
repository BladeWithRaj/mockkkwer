// submit.js – Secure Test Submission (Vercel Serverless)
// ─────────────────────────────────────────────────────
import supabase from "./_lib/supabaseAdmin.js";
import { calculateResult } from "./_lib/utils.js";
import { rateLimit } from "./_lib/rateLimiter.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ── 1. Extract payload ──────────────────────
    const { questionIds, answers, timeTaken, testId, isDaily, user_id, username } = req.body;

    if (!user_id || !username) {
      return res.status(400).json({ error: "user_id and username are required" });
    }
    
    // ── 2. Rate Limit (by user_id) ───────────────
    rateLimit(user_id);

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

    // ── 4. Time validation ──────────────────────
    const avgTimePerQ = timeTaken / dbQuestions.length;
    if (avgTimePerQ < 2) {
      console.warn("[SUBMIT] BLOCKED – too fast:", { userId: user_id, avgTimePerQ });
      return res.status(400).json({ error: "Suspiciously fast submission" });
    }

    // ── 5. Server-side scoring ──────────────────
    const result = calculateResult(dbQuestions, answers);

    // ── 6. Upsert User Light ────────────────────
    await supabase.from("users_light").upsert({
      id: user_id,
      username: username
    }, { onConflict: "id" }).catch(() => {});

    // ── 7. Insert Result ────────────────────────
    const test_id = testId || crypto.randomUUID();
    const { error: insErr } = await supabase.from("results").insert([{
      user_id: user_id,
      username: username,
      test_id,
      score_percent: result.scorePercent,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      time_taken: timeTaken,
      topic_wise_accuracy: result.topicStats,
      is_daily: !!isDaily
    }]);

    if (insErr) {
       // if duplicate
       if (insErr.code === '23505') {
          return res.status(409).json({ error: "Duplicate test submission", alreadyExists: true });
       }
       throw insErr;
    }

    return res.json({ success: true, test_id, result });

  } catch (err) {
    const status = err.message.includes("Too many") ? 429 : 400;
    return res.status(status).json({ error: err.message });
  }
}
