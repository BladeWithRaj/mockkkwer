import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question missing" });
    }

    console.log("[API] HIT:", question);

    // 🔐 ENV KEY
    const API_KEY = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Explain this question simply in Hinglish:\n${question}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No explanation";

    return res.status(200).json({ explanation: text });
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
