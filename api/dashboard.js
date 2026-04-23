// dashboard.js – Rich Dashboard Aggregation (Vercel Serverless)
import supabase from "./_lib/supabaseAdmin.js";
import { verifyUser } from "./_lib/auth.js";

export default async function handler(req, res) {
  try {
    const user = await verifyUser(req);

    const { data, error } = await supabase
      .from("results")
      .select("score_percent, topic_wise_accuracy, time_taken, correct, wrong, skipped, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const total = data.length;
    if (total === 0) {
      return res.json({
        total: 0, avgScore: 0, bestScore: 0,
        improvementRate: 0, weakTopic: null,
        accuracy: 0, streak: 0, trendData: [], recent: []
      });
    }

    // ── Basic aggregates ─────────────────────
    const scores = data.map(r => r.score_percent);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);
    const bestScore = Math.max(...scores);

    // ── Improvement rate (last 5 vs previous 5) ─
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const last5  = scores.slice(0, 5);
    const prev5  = scores.slice(5, 10);
    const prevAvg = avg(prev5);
    const improvementRate = prevAvg > 0
      ? Math.round(((avg(last5) - prevAvg) / prevAvg) * 100)
      : 0;

    // ── Overall accuracy ─────────────────────
    const totalCorrect = data.reduce((a, r) => a + (r.correct || 0), 0);
    const totalWrong   = data.reduce((a, r) => a + (r.wrong || 0), 0);
    const totalAttempted = totalCorrect + totalWrong;
    const accuracy = totalAttempted > 0
      ? Math.round((totalCorrect / totalAttempted) * 100)
      : 0;

    // ── Weak topic detection ─────────────────
    const topicAgg = {};
    data.forEach(r => {
      const topics = r.topic_wise_accuracy || {};
      Object.entries(topics).forEach(([topic, stats]) => {
        if (!topicAgg[topic]) topicAgg[topic] = { correct: 0, wrong: 0, total: 0 };
        topicAgg[topic].correct += stats.correct || 0;
        topicAgg[topic].wrong   += stats.wrong || 0;
        topicAgg[topic].total   += (stats.correct || 0) + (stats.wrong || 0);
      });
    });
    const weakTopic = Object.entries(topicAgg)
      .filter(([, s]) => s.total >= 3) // need at least 3 attempts
      .map(([name, s]) => ({
        name,
        acc: s.total ? Math.round((s.correct / s.total) * 100) : 0,
        total: s.total
      }))
      .sort((a, b) => a.acc - b.acc)[0] || null;

    // ── Streak (consecutive days with tests) ─
    const uniqueDays = [...new Set(
      data.map(r => new Date(r.created_at).toISOString().slice(0, 10))
    )].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (uniqueDays[i] === expected.toISOString().slice(0, 10)) {
        streak++;
      } else if (i === 0 && uniqueDays[i] !== today) {
        // allow starting from yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (uniqueDays[i] === yesterday.toISOString().slice(0, 10)) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // ── Accuracy trend (last 10) ─────────────
    const trendData = data.slice(0, 10).reverse().map(r => ({
      x: r.created_at,
      y: r.score_percent
    }));

    return res.json({
      total,
      avgScore,
      bestScore,
      improvementRate,
      accuracy,
      weakTopic,
      streak,
      trendData,
      recent: data.slice(0, 10)
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
