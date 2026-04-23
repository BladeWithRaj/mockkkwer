import supabase from "./_lib/supabaseAdmin.js";
import { getUTCDateString, generateDailyChallenge } from "./_lib/dailyUtils.js";

export default async function handler(req, res) {
  try {
    const todayStr = getUTCDateString();

    // 1. Fetch all questions to generate seed (only IDs needed for seed generation)
    // Actually we need the question contents to return to frontend.
    const { data: allQuestions, error } = await supabase
      .from("questions")
      .select("*");

    if (error) throw error;

    // 2. Generate deterministic set
    const stableQuestions = [...allQuestions].sort((a, b) => a.id.localeCompare(b.id));
    const dailyIds = generateDailyChallenge(stableQuestions, todayStr); // This returns IDs or we can modify it

    // 3. Extract the actual question objects
    const dailyQuestions = dailyIds.map(id => stableQuestions.find(q => q.id === id));

    return res.json({
      success: true,
      questions: dailyQuestions
    });

  } catch (err) {
    console.error("[DAILY] Error fetching daily questions:", err);
    return res.status(500).json({ error: "Failed to load daily challenge" });
  }
}
