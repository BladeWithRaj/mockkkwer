import supabase from "./_lib/supabaseAdmin.js";
import { verifyUser } from "./_lib/auth.js";
import { getUTCDateString } from "./_lib/dailyUtils.js";

export default async function handler(req, res) {
  try {
    const user = await verifyUser(req);
    const today = getUTCDateString();

    // 1. Fetch Streak
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_challenge_date")
      .eq("user_id", user.id)
      .single();

    // 2. Check if already done today
    const { data: todayResult } = await supabase
      .from("results")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_daily", true)
      .gte("created_at", `${today}T00:00:00Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .limit(1);

    const isCompletedToday = !!(todayResult && todayResult.length > 0);

    // 3. Compute active streak
    let activeStreak = 0;
    if (streakData) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (streakData.last_challenge_date === today || streakData.last_challenge_date === yesterday) {
        activeStreak = streakData.current_streak;
      }
    }

    return res.json({
      streak: activeStreak,
      completedToday: isCompletedToday
    });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
