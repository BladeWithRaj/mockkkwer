import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function hashQuestion(q) {
  return Buffer.from(q.trim().toLowerCase()).toString("base64");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const qHash = hashQuestion(question);

    // 🔁 CACHE CHECK
    const { data: cached } = await supabase
      .from("ai_explanations")
      .select("explanation")
      .eq("question_hash", qHash)
      .single();

    if (cached?.explanation) {
      return res.json({ explanation: cached.explanation, cached: true });
    }

    // 🚀 GROQ CALL
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: `Explain simply in Hinglish:\n${question}`
          }
        ]
      })
    });

    const data = await groqRes.json();

    console.log("GROQ RAW:", JSON.stringify(data)); // 🔥 IMPORTANT

    const explanation = data?.choices?.[0]?.message?.content;

    if (!explanation) {
      return res.json({
        explanation: "Simple explanation not available. Try again.",
        cached: false
      });
    }

    // 💾 SAVE CACHE
    await supabase.from("ai_explanations").insert([
      {
        question_hash: qHash,
        question,
        explanation
      }
    ]);

    return res.json({ explanation, cached: false });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
