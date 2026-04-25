// api/leaderboard.js
import supabase from "./_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { data, error } = await supabase.rpc('get_leaderboard_lite');

    if (error) {
      console.error("Leaderboard Error:", error);
      throw new Error("Failed to fetch leaderboard");
    }

    // Add rank manually
    const rankedData = (data || []).map((row, index) => ({
      ...row,
      rank: index + 1
    }));

    return res.status(200).json({ success: true, leaderboard: rankedData });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
