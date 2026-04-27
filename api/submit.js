// submit.js – Secure Test Submission (Vercel Serverless)
// ─────────────────────────────────────────────────────
import supabase from "./_lib/supabaseAdmin.js";
import { calculateResult } from "./_lib/utils.js";
import { rateLimitAsync } from "./_lib/rateLimiter.js";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ── 1. Extract payload ──────────────────────
    const { questionIds, answers, timeTaken, testId, isDaily, username } = req.body;

    // ── 2. Authenticate: Verify JWT Token ────────
    let user_id = null;

    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (token) {
      // Verify with Supabase using anon key (validates JWT signature)
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
      // Fallback: Accept client user_id for anonymous sessions (temporary)
      user_id = req.body.user_id;
      if (!user_id) {
        return res.status(401).json({ error: "Authentication required — no token or user_id provided" });
      }
      console.warn("[SUBMIT] No JWT token — using client-provided user_id:", user_id);
    }

    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }

    // ── 3. Rate Limit (durable, cross-instance) ─
    await rateLimitAsync(user_id, 5000);

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: "questionIds must be a non-empty array" });
    }
    if (questionIds.length > 200) {
      return res.status(400).json({ error: "Too many questions (max 200)" });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ error: "answers must be a non-array object" });
    }
    // Validate each answer value is a valid option index (0-3) or null
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

    // ── 4. Fetch canonical questions from DB ────
    const { data: dbQuestions, error: qErr } = await supabase
      .from("questions")
      .select("id, correct_answer, subject, option_a, option_b, option_c, option_d")
      .in("id", questionIds);

    if (qErr) throw qErr;

    if (!dbQuestions || dbQuestions.length !== questionIds.length) {
      return res.status(400).json({ error: "Question tampering detected — ID mismatch" });
    }

    // ── 5. Time validation ──────────────────────
    const avgTimePerQ = timeTaken / dbQuestions.length;
    if (avgTimePerQ < 2) {
      console.warn("[SUBMIT] BLOCKED – too fast:", { userId: user_id, avgTimePerQ });
      return res.status(400).json({ error: "Suspiciously fast submission" });
    }

    // ── 6. Server-side scoring ──────────────────
    const result = calculateResult(dbQuestions, answers);

    // ── 7. Upsert User Light ────────────────────
    await supabase.from("users_light").upsert({
      id: user_id,
      username: username
    }, { onConflict: "id" }).catch(() => {});

    // ── 8. Insert Result ────────────────────────
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

