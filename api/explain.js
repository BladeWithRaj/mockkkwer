// explain.js – AI Explanation API (Gemini + Supabase Cache)
// ─────────────────────────────────────────────────────────
// Flow:
//   1. POST { question } →
//   2. Hash question → check Supabase cache
//   3. Cache hit → return immediately
//   4. Cache miss → Gemini API → save to Supabase → return
// ─────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function hashQuestion(q) {
  // Normalize: trim, lowercase, collapse whitespace
  const normalized = q.trim().toLowerCase().replace(/\s+/g, " ");
  return Buffer.from(normalized).toString("base64");
}

export default async function handler(req, res) {
  try {
    // ── Only POST ──
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { question } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question required" });
    }

    const qHash = hashQuestion(question);
    console.log("[EXPLAIN] Question hash:", qHash.slice(0, 20) + "...");

    // ── STEP 1: Check Supabase cache ──
    const { data: cached } = await supabase
      .from("ai_explanations")
      .select("explanation")
      .eq("question_hash", qHash)
      .single();

    if (cached && cached.explanation) {
      console.log("[EXPLAIN] Cache HIT");
      return res.status(200).json({
        explanation: cached.explanation,
        cached: true,
      });
    }

    console.log("[EXPLAIN] Cache MISS → calling Gemini");

    // ── STEP 2: Groq API call ──
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      console.error("[EXPLAIN] GROQ_API_KEY not set!");
      return res.status(500).json({ error: "API key not configured" });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: `Explain this question simply in Hinglish (Hindi + English mix). Be concise and clear:\n\n${question}`
          }
        ]
      })
    });

    const groqData = await groqRes.json();

    let explanation = groqData?.choices?.[0]?.message?.content || "";

    // fallback
    if (!explanation || explanation.trim() === "") {
      console.error("[EXPLAIN] Groq FULL response:", JSON.stringify(groqData));
      explanation = "Simple explanation not available. Try again.";
    }

    // ── STEP 3: Save to Supabase cache ──
    const { error: insertError } = await supabase.from("ai_explanations").insert([
      {
        question_hash: qHash,
        question,
        explanation
      }
    ]);

    if (insertError) {
      console.error("[EXPLAIN] Supabase insert error:", insertError.message);
      // Don't fail the request — explanation was generated successfully
    } else {
      console.log("[EXPLAIN] Cached to Supabase");
    }

    return res.status(200).json({ explanation, cached: false });
  } catch (err) {
    console.error("[EXPLAIN] Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
