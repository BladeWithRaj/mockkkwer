// api/questions.js - Secure Random Fetch API
import supabase from "./_lib/supabaseAdmin.js";
import { rateLimitAsync } from "./_lib/rateLimiter.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate limit by IP to prevent scraping (durable, cross-instance)
    const clientIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
    await rateLimitAsync(`questions_${clientIp}`, 1000);

    let { limit = 50, subject, difficulty, exam, seen_ids = [] } = req.body;

    // ── 1. Validation & Capping ──
    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Hard cap for production safety

    if (!Array.isArray(seen_ids)) seen_ids = [];
    if (seen_ids.length > 300) seen_ids = seen_ids.slice(-300); // Cap history array

    // ── 2. Sanitize Filters ──
    subject = subject === 'all' ? null : (subject || null);
    difficulty = difficulty === 'all' ? null : (difficulty || null);
    exam = exam === 'all' ? null : (exam || null);

    // ── 3. Execute Optimized RPC ──
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

    // ── 4. Shuffle the chunk for intra-chunk randomness ──
    const questions = data || [];
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // ── 5. Standardized Response ──
    return res.status(200).json({ 
      success: true, 
      questions: questions,
      next_cursor: null // Placeholder for future cursor pagination
    });

  } catch (err) {
    console.error("[API] /questions crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
