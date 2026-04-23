export default async function handler(req, res) {
  try {
    const { question } = req.body;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyAHTDUaffkhmaFxaROpRs10BNbzWLLrUos",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Explain this in simple Hinglish:\n" + question
            }]
          }]
        })
      }
    );

    const data = await response.json();

    const explanation =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation";

    res.json({ explanation });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed" });
  }
}
