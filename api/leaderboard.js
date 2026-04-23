// leaderboard.js – Anti-Cheat Global Leaderboard v3 (Vercel Serverless)
// ──────────────────────────────────────────────────────────────────────
// Ranking v3 (hardened):
//   - Median-based scoring: 60% median + 40% recent-5 avg
//   - Dynamic question-count weighting (adapts to max in dataset)
//   - Persistent flags from user_flags table (not just in-memory)
//   - Seasonal support: ?season=weekly|monthly|alltime
//   - Flagged users get explicit "under review" status (not silent)
//   - Pagination: ?page=1&limit=20
//   - 60s in-memory cache per season (MVP — migrate to KV for scale)
// ──────────────────────────────────────────────────────────────────────

import supabase from "./_lib/supabaseAdmin.js";
import { verifyUser } from "./_lib/auth.js";

const MIN_TESTS = 10;
const CACHE_TTL = 60000;
const cache = {}; // keyed by season

export default async function handler(req, res) {
  try {
    // ── Auth (optional) ──
    let currentUserId = null;
    try {
      const user = await verifyUser(req);
      currentUserId = user.id;
    } catch (_) { }

    // ── Query params ──
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const season = (url.searchParams.get("season") || "alltime").toLowerCase();

    if (!["weekly", "monthly", "alltime"].includes(season)) {
      return res.status(400).json({ error: "Invalid season. Use: weekly, monthly, alltime" });
    }

    // ── Rebuild if cache stale ──
    const cacheKey = season;
    if (!cache[cacheKey] || Date.now() - cache[cacheKey].ts > CACHE_TTL) {
      console.log(`[LEADERBOARD] Rebuilding ${season} ranking...`);

      // ── 1. Date filter for seasonal (UTC) ──
      const now = new Date();
      let dateFilter = null;
      if (season === "weekly") {
        dateFilter = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
      } else if (season === "monthly") {
        dateFilter = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
      }

      // ── 2. Fetch results (excluding daily tests) ──
      let query = supabase
        .from("results")
        .select("user_id, score_percent, time_taken, correct, wrong, skipped, created_at, is_daily")
        .eq("is_daily", false) // Exclude daily challenges from leaderboard
        .order("created_at", { ascending: false });

      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // ── 3. Fetch persistent flags & check expiration ──
      const { data: flaggedUsers } = await supabase
        .from("user_flags")
        .select("user_id, created_at")
        .eq("is_flagged", true);

      // Ignore flags older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeFlags = (flaggedUsers || []).filter(f => new Date(f.created_at) > sevenDaysAgo);
      const flaggedSet = new Set(activeFlags.map(f => f.user_id));

      // ── 4. Aggregate per user ──
      const users = {};
      let globalMaxQCount = 1;

      (data || []).forEach(r => {
        if (!users[r.user_id]) {
          users[r.user_id] = { tests: [], flagged: flaggedSet.has(r.user_id), lastTestDate: null };
        }
        const totalQs = (r.correct || 0) + (r.wrong || 0) + (r.skipped || 0);
        if (totalQs > globalMaxQCount) globalMaxQCount = totalQs;

        const testDate = new Date(r.created_at);
        if (!users[r.user_id].lastTestDate || testDate > users[r.user_id].lastTestDate) {
          users[r.user_id].lastTestDate = testDate;
        }

        users[r.user_id].tests.push({
          score: r.score_percent,
          time: r.time_taken || 0,
          questions: totalQs || 1
        });
      });

      // ── 5. Build ranking ──
      const ranking = Object.entries(users)
        .filter(([, u]) => {
          // Minimum 10 tests
          if (u.tests.length < MIN_TESTS) return false;

          // Activity filter: Seasonal leaderboards require activity within last 7 days
          if (season !== "alltime" && u.lastTestDate < sevenDaysAgo) return false;

          return true;
        })
        .map(([uid, u]) => {
          const allScores = u.tests.map(t => t.score);
          const recent10 = u.tests.slice(0, 10).map(t => t.score);
          const recent5 = u.tests.slice(0, 5).map(t => t.score);

          // Median (safest against outlier manipulation)
          const medianScore = median(allScores);
          const recentAvg = avg(recent5);

          // Exponential decay for last 10 tests (weight = e^(-k * index))
          // More recent = higher weight
          const k = 0.3; // decay constant
          let decaySum = 0;
          let weightSum = 0;
          recent10.forEach((score, index) => {
            const weight = Math.exp(-k * index);
            decaySum += score * weight;
            weightSum += weight;
          });
          const expDecayScore = weightSum > 0 ? decaySum / weightSum : 0;

          // Hybrid: 50% median + 30% recent-5 avg + 20% exp-decay recent-10
          const hybridScore = Math.round(medianScore * 0.5 + recentAvg * 0.3 + expDecayScore * 0.2);

          // Dynamic question-count weighting
          const avgQCount = avg(u.tests.map(t => t.questions));
          const qBonus = Math.min(1.2, Math.log2(avgQCount + 1) / Math.log2(globalMaxQCount + 1));
          const adjustedScore = Math.min(100, Math.round(hybridScore * Math.max(0.8, qBonus)));

          // Best score
          const bestScore = Math.max(...allScores);

          // Suspicious detection (in-memory, supplements persistent flags)
          const avgTimePerQ = avg(u.tests.map(t => t.questions > 0 ? t.time / t.questions : 999));
          const perfectCount = allScores.filter(s => s === 100).length;
          const runtimeFlagged =
            avgTimePerQ < 8 ||
            (perfectCount > 3 && u.tests.length < 20);

          const isFlagged = u.flagged || runtimeFlagged;

          return {
            user_id: uid,
            adjustedScore,
            hybridScore,
            medianScore: Math.round(medianScore),
            avgScore: Math.round(avg(allScores)),
            recentAvg: Math.round(recentAvg),
            bestScore,
            totalTests: u.tests.length,
            avgQuestions: Math.round(avgQCount),
            flagged: isFlagged,
            rank: 0
          };
        })
        .sort((a, b) => b.adjustedScore - a.adjustedScore);

      // Assign ranks (only unflagged users get visible ranks)
      let rankCounter = 0;
      ranking.forEach((entry, i) => {
        if (entry.flagged) {
          entry.rank = -1; // under review
        } else {
          rankCounter++;
          if (i > 0 && !ranking[i - 1].flagged &&
            entry.adjustedScore === ranking[i - 1].adjustedScore) {
            entry.rank = ranking[i - 1].rank; // tie
          } else {
            entry.rank = rankCounter;
          }
        }
      });

      cache[cacheKey] = { ts: Date.now(), ranking, season };

      const unflagged = ranking.filter(e => !e.flagged).length;
      const flagged = ranking.filter(e => e.flagged).length;
      console.log(`[LEADERBOARD] ${season}: ${unflagged} ranked, ${flagged} flagged, ${Object.keys(users).length - ranking.length} unqualified`);
    } else {
      console.log(`[LEADERBOARD] Serving ${season} from cache`);
    }

    // ── Paginate (unflagged only for public view) ──
    const { ranking } = cache[cacheKey];
    const publicRanking = ranking.filter(e => !e.flagged);
    const start = (page - 1) * limit;
    const pageData = publicRanking.slice(start, start + limit);
    const totalPages = Math.ceil(publicRanking.length / limit);

    // ── Your rank ──
    let myRank = null;
    let myStatus = null;
    if (currentUserId) {
      const me = ranking.find(r => r.user_id === currentUserId);
      if (me) {
        if (me.flagged) {
          myStatus = "under_review";
          myRank = {
            rank: -1,
            adjustedScore: me.adjustedScore,
            medianScore: me.medianScore,
            bestScore: me.bestScore,
            totalTests: me.totalTests,
            status: "under_review",
            message: "Your performance is under review. Keep taking tests consistently to resolve this."
          };
        } else {
          myStatus = "ranked";
          myRank = {
            rank: me.rank,
            adjustedScore: me.adjustedScore,
            medianScore: me.medianScore,
            bestScore: me.bestScore,
            totalTests: me.totalTests,
            status: "ranked"
          };
        }
      } else {
        // User exists but not qualified
        const userData = Object.entries(cache[cacheKey].ranking.length ? {} : {});
        myStatus = "unqualified";
      }
    }

    return res.json({
      leaderboard: pageData,
      pagination: { page, limit, totalPages, totalQualified: publicRanking.length },
      season,
      minTestsRequired: MIN_TESTS,
      myRank,
      myStatus
    });

  } catch (err) {
    console.error("[LEADERBOARD] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Math helpers ──

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
