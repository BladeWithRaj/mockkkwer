// ============================================
// SUPABASE CLIENT
// ============================================

const SUPABASE_URL = "https://ygzqmcmiroomjajoxezt.supabase.co";
const SUPABASE_KEY = "sb_publishable_f9j2KF0lNdMVts6i4bFPzw_jXAvJaqV";

// IMPORTANT: renamed to 'client' to avoid conflict with window.supabase
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── FETCH (Direct Supabase — ONLY source) ──────

async function fetchRandomQuestions(config = {}) {
  const { subjects = [], limit = 25 } = config;

  try {
    let query = client.from("questions").select("*, options(*)");

    // Subject filter — "all" or empty = no filter
    if (subjects.includes("all") || subjects.length === 0) {
      // no filter — fetch from all subjects
    } else {
      query = query.in("subject", subjects.map(s => s.toLowerCase()));
    }

    const { data, error } = await query;

    if (error) {
      console.error("DB ERROR:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ DB returned 0 questions.");
      return [];
    }

    // Lightweight dedupe — prefer unseen questions
    const used = JSON.parse(localStorage.getItem("used_ids") || "[]");
    const fresh = data.filter(q => !used.includes(q.id));
    const base = fresh.length >= limit ? fresh : data;

    // Shuffle (Fisher-Yates)
    const shuffled = [...base];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Exact count
    const selected = shuffled.slice(0, limit);

    // Save used IDs (cap at 200)
    const newUsed = [...used, ...selected.map(q => q.id)].slice(-200);
    localStorage.setItem("used_ids", JSON.stringify(newUsed));

    console.log("TOTAL DB:", data.length, "FRESH:", fresh.length, "SELECTED:", selected.length);

    if (data.length < limit) {
      console.warn("DB has fewer questions than requested:", data.length, "<", limit);
    }

    const mapped = mapDBToUI(selected);

    if (mapped.length < selected.length) {
      console.warn("Dropped", selected.length - mapped.length, "bad questions during mapping");
    }

    return mapped;
  } catch (err) {
    console.error("fetchRandomQuestions CRASH:", err);
    return [];
  }
}

// ── SECTION-WISE FETCH (Exam Preset Driven) ──────

async function fetchSectionWiseQuestions(config = {}) {
  const { sections = [], totalQuestions = 50, subjects = [] } = config;

  // If no sections defined, fallback to regular fetch
  if (!sections || sections.length === 0) {
    return fetchRandomQuestions({ subjects, limit: totalQuestions });
  }

  try {
    const used = JSON.parse(localStorage.getItem("used_ids") || "[]");
    let allSelected = [];

    for (const section of sections) {
      const subjectFilter = section.subject;
      const needed = section.questions || 25;

      // Skip 'all' subject — handled differently
      if (subjectFilter === 'all') {
        const { data } = await client.from("questions").select("*, options(*)");
        if (data && data.length > 0) {
          const fresh = data.filter(q => !used.includes(q.id));
          const base = fresh.length >= needed ? fresh : data;
          const shuffled = _shuffle(base);
          allSelected.push(...shuffled.slice(0, needed));
        }
        continue;
      }

      let query = client.from("questions").select("*, options(*)");
      query = query.eq("subject", subjectFilter.toLowerCase());

      const { data, error } = await query;

      if (error) {
        console.error(`Section fetch error (${subjectFilter}):`, error);
        continue;
      }

      if (!data || data.length === 0) {
        console.warn(`No questions found for section: ${subjectFilter}`);
        continue;
      }

      // Prefer unseen questions
      const fresh = data.filter(q => !used.includes(q.id));
      const base = fresh.length >= needed ? fresh : data;
      const shuffled = _shuffle(base);
      const selected = shuffled.slice(0, needed);

      allSelected.push(...selected);
      console.log(`Section ${subjectFilter}: ${selected.length}/${needed} questions`);
    }

    if (allSelected.length === 0) {
      console.warn("Section-wise fetch returned 0 questions, falling back");
      return fetchRandomQuestions({ subjects, limit: totalQuestions });
    }

    // Save used IDs
    const newUsed = [...used, ...allSelected.map(q => q.id)].slice(-300);
    localStorage.setItem("used_ids", JSON.stringify(newUsed));

    console.log(`SECTION FETCH: ${allSelected.length} total (target: ${totalQuestions})`);

    const mapped = mapDBToUI(allSelected);
    return mapped;

  } catch (err) {
    console.error("fetchSectionWiseQuestions CRASH:", err);
    return fetchRandomQuestions({ subjects, limit: totalQuestions });
  }
}

/** Fisher-Yates shuffle helper */
function _shuffle(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function fetchAdminQuestions(page = 1, searchQuery = '') {
  let query = client.from("questions").select("*");
  if (searchQuery) query = query.ilike('question_en', `%${searchQuery}%`);

  // Hard limit to 1000 for simple admin UI (pagination later)
  query = query.range((page - 1) * 1000, page * 1000 - 1);

  const { data, error } = await query;
  if (error) {
    console.error("Admin fetch error:", error);
    return [];
  }
  return data;
}

async function checkAdminRole(userId) {
  try {
    const { data } = await client.from('user_roles').select('role').eq('user_id', userId).single();
    return data && data.role === 'admin';
  } catch (err) {
    return false;
  }
}

// ── MAP DB → UI ──────────────────────────────
// Supports BOTH schemas:
//   Normalized: questions + options table (joined via select("*, options(*)"))
//   Flat: options_en/options_hi/correct_index in questions table
//
// ★ OPTION SHUFFLE — 3-layer defence:
//   Layer 1: DB stored pre-shuffled at INSERT time (adminHandlers)
//   Layer 2: Per-attempt seeded shuffle here (different order every attempt)
//   Layer 3: Balanced distribution — A/B/C/D roughly equal across paper
//
// REVIEW SCREEN: q.correct is always POST-SHUFFLE index.
//   analysis.js:   if (oi === q.correct)   ← ✅ correct
//   testEngine.js: answer === q.correct    ← ✅ correct

// ── Seeded PRNG (mulberry32, inline — no import needed in browser) ──
function _createRNG(seed) {
  let s = (seed >>> 0);
  return function () {
    s += 0x6D2B79F5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

function _makeSeed(attemptId, questionId) {
  let hash = 5381;
  const str = String(attemptId) + ':' + String(questionId);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) ^ ((questionId * 1000003) & 0x7FFFFFFF);
}

// ── Per-attempt ID (stable within tab session, new each test) ──
function _getAttemptId() {
  let id = sessionStorage.getItem('_cbt_attempt_id');
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem('_cbt_attempt_id', id);
  }
  return id;
}

// Call this at test START to rotate the attemptId so same question
// gets a fresh shuffle on next attempt.
function rotateAttemptId() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  sessionStorage.setItem('_cbt_attempt_id', id);
  return id;
}
window.rotateAttemptId = rotateAttemptId;

// ── Core seeded Fisher-Yates (inline — browser has no import) ──
//
// Distribution balance — TOLERANCE-BASED (not hard-swap):
//   Only corrects when imbalance delta > MAX_BALANCE_DELTA.
//   Prevents overcorrection on small papers and entropy loss.
//   Disabled entirely for papers < MIN_BALANCE_SIZE questions.
//
const MAX_BALANCE_DELTA  = 2;  // allow ±2 before correcting
const MIN_BALANCE_SIZE   = 12; // disable balancing for tiny papers

function _seededBalancedShuffle(optionsEN, optionsHI, correctIndex, rng, distCounts, totalQuestions) {
  const n = optionsEN.length;
  const hi = Array.isArray(optionsHI) && optionsHI.length === n ? optionsHI : optionsEN;

  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  let newEN      = indices.map(i => optionsEN[i]);
  let newHI      = indices.map(i => hi[i]);
  let newCorrect = indices.indexOf(correctIndex);

  // ── TOLERANCE-BASED distribution balance ──
  // Skip: small paper OR no tracker
  const useBalance = distCounts && (totalQuestions || Infinity) >= MIN_BALANCE_SIZE;
  if (useBalance) {
    const sorted = [0, 1, 2, 3].sort((a, b) => distCounts[a] - distCounts[b]);
    const mostUnder  = sorted[0];
    const mostOver   = sorted[sorted.length - 1];
    const delta      = distCounts[mostOver] - distCounts[mostUnder];

    // Only correct if imbalance exceeds tolerance threshold
    if (delta > MAX_BALANCE_DELTA && newCorrect !== mostUnder) {
      [newEN[newCorrect],  newEN[mostUnder]]  = [newEN[mostUnder],  newEN[newCorrect]];
      [newHI[newCorrect],  newHI[mostUnder]]  = [newHI[mostUnder],  newHI[newCorrect]];
      newCorrect = mostUnder;
    }
    distCounts[newCorrect]++;
  }

  return { newEN, newHI, newCorrect };
}


function mapDBToUI(data) {
  if (!Array.isArray(data)) return [];

  const isHi         = typeof Lang !== 'undefined' && Lang.current === "hi";
  const attemptId    = _getAttemptId();
  const distCounts   = [0, 0, 0, 0]; // A/B/C/D usage counter
  const totalQuestions = data.length; // used for small-paper balance decision

  return data.map(q => {
    if (!q || !q.id) return null;

    let optionsEN, optionsHI, correctIndex;

    // ── NORMALIZED SCHEMA (options table joined) ──
    if (Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0].option_text_en !== undefined) {
      const opts = q.options;
      optionsEN = opts.map(o => o.option_text_en);
      optionsHI = opts.map(o => o.option_text_hi || o.option_text_en);
      correctIndex = opts.findIndex(o => o.is_correct === true);

      if (correctIndex === -1) {
        console.warn("No correct option marked for Q:", q.id);
        return null;
      }

      if (optionsEN.length < 2) {
        console.warn("Too few options for Q:", q.id);
        return null;
      }
    }
    // ── FLAT SCHEMA (options_en/correct_index in row) ──
    else if (q.options_en != null) {
      try {
        optionsEN = Array.isArray(q.options_en)
          ? q.options_en
          : JSON.parse(q.options_en || "[]");
      } catch {
        console.warn("BAD JSON options_en:", q.id);
        return null;
      }

      try {
        optionsHI = Array.isArray(q.options_hi)
          ? q.options_hi
          : JSON.parse(q.options_hi || "[]");
      } catch {
        optionsHI = optionsEN;
      }

      correctIndex = q.correct_index;

      if (!optionsEN || optionsEN.length < 2 || correctIndex == null) {
        console.warn("BAD QUESTION:", q.id);
        return null;
      }
    }
    // ── NO OPTIONS AT ALL ──
    else {
      console.warn("No options found for Q:", q.id);
      return null;
    }

    if (!optionsHI || optionsHI.length === 0) optionsHI = optionsEN;

    // ★ SEEDED BALANCED SHUFFLE — per question, per attempt
    //   seed = f(attemptId, questionId) → different each attempt, stable within attempt
    //   totalQuestions → disable balancing for small papers (< 12)
    const seed = _makeSeed(attemptId, q.id);
    const rng  = _createRNG(seed);
    const { newEN, newHI, newCorrect } = _seededBalancedShuffle(
      optionsEN, optionsHI, correctIndex, rng, distCounts, totalQuestions
    );


    return {
      id: q.id,
      subject: (q.subject || "general").toLowerCase(),
      correct: newCorrect,          // ← post-shuffle correct index

      // Bilingual storage (for language toggle)
      questionEN: q.question_en,
      questionHI: q.question_hi || q.question_en,
      optionsEN: newEN,
      optionsHI: newHI,

      // Active display (changes on language toggle)
      question: isHi ? (q.question_hi || q.question_en) : q.question_en,
      options: isHi ? newHI : newEN
    };
  }).filter(Boolean);
}


// ── ADD QUESTION (Admin → DB) ─────────────

async function addQuestionToDB(q) {
  if (!q.question_en || !q.question_en.trim()) {
    return { success: false, error: "Question text (EN) is required" };
  }
  if (!Array.isArray(q.options_en) || q.options_en.length < 2) {
    return { success: false, error: "At least 2 options required" };
  }
  if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index >= q.options_en.length) {
    return { success: false, error: "correct_index must be 0-" + (q.options_en.length - 1) };
  }

  const row = {
    question_en: q.question_en.trim(),
    question_hi: (q.question_hi || "").trim() || null,
    options_en: q.options_en,
    options_hi: Array.isArray(q.options_hi) ? q.options_hi : null,
    correct_index: q.correct_index,
    subject: (q.subject || "general").toLowerCase(),
    difficulty: (q.difficulty || "medium").toLowerCase()
  };

  const { data, error } = await client
    .from("questions")
    .insert([row])
    .select();

  if (error) {
    console.error("Insert Error:", error);
    return { success: false, error: error.message };
  }

  console.log("Question added:", data);
  return { success: true, data };
}

// ── DELETE QUESTION (Admin → DB) ──────────

async function deleteQuestionFromDB(id) {
  const { error } = await client
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }

  console.log("Question deleted:", id);
  return { success: true };
}

// ── BULK INSERT (Admin → DB) ──────────────

async function bulkInsertQuestions(questions) {
  const { data, error } = await client
    .from("questions")
    .insert(questions)
    .select();

  if (error) {
    console.error("Bulk Insert Error:", error);
    return { success: false, error: error.message };
  }

  console.log("Bulk inserted", data.length, "questions");
  return { success: true, data };
}

// ── RESULTS (Direct Supabase → test_attempts) ──────────────────────────

async function saveResultToDB(result) {
  // ── DOUBLE-SUBMIT GUARD ──
  if (window.__submitted) {
    console.warn("⚠️ Duplicate submit blocked");
    return;
  }
  window.__submitted = true;

  try {
    const user = Auth.getUser();
    if (!user || !user.id) {
      console.warn("Skipping submission: No user session.");
      window.__submitted = false;
      return;
    }

    // ── Guard: ensure questionResults exists ──
    const questionResults = result.questionResults || [];
    if (questionResults.length === 0) {
      console.warn("Skipping submission: No questionResults.");
      window.__submitted = false;
      return;
    }

    // ── Calculate attempt metrics ──
    const totalQuestions = result.totalQuestions || questionResults.length;
    const attempted = totalQuestions - (result.skipped || 0);
    const accuracy = result.accuracy || 0;
    const score = result.totalMarks || 0;
    const correctCount = result.correct || 0;
    const wrongCount = result.wrong || 0;
    const timeTaken = result.timeTaken || 0;

    // Weak topics → JSON array of subject names
    const weakTopics = (result.weakTopics || [])
      .map(wt => wt.subject || wt.name)
      .filter(Boolean);

    // Exam type from config
    const examType = (result.config && result.config.examName)
      || (result.config && result.config.examId)
      || 'Custom Test';

    // Current streak
    const currentStreak = (typeof DailySystem !== 'undefined')
      ? (DailySystem.getStreak().current || 0)
      : 0;

    // ── INSERT into test_attempts ──
    const row = {
      user_id: user.id,
      exam_type: examType,
      total_questions: totalQuestions,
      attempted,
      correct_count: correctCount,
      wrong_count: wrongCount,
      score,
      accuracy,
      time_taken: timeTaken,
      weak_topics: weakTopics,
      coins_earned: 0,
      streak_at_time: currentStreak
    };

    console.log("📤 Saving attempt to test_attempts:", row);

    const { data, error } = await client
      .from("test_attempts")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("❌ Attempt save failed:", error);
      // Fallback: save to local queue for retry
      Storage.addToFallbackQueue(row);
    } else {
      console.log("✅ Attempt saved:", data.id);

      // ── UPDATE USER STATS ──
      try {
        // Increment tests_given on users table
        const { error: updateErr } = await client
          .from("users")
          .update({
            tests_given: (user.tests_given || 0) + 1,
            streak: currentStreak
          })
          .eq("id", user.id);

        if (updateErr) {
          console.warn("User stats update failed:", updateErr.message);
        } else {
          // Update local session
          const session = Auth._getSession();
          if (session) {
            session.tests_given = (session.tests_given || 0) + 1;
            session.streak = currentStreak;
            Auth._saveSession(session);
          }
        }
      } catch (updateCrash) {
        console.warn("User stats update crash:", updateCrash);
      }

      // Track event
      if (window.trackEvent) {
        window.trackEvent("test_submit", {
          score: accuracy
        });
      }
    }

  } catch (err) {
    console.error("🔥 Unexpected error in saveResultToDB:", err);
  } finally {
    // Reset guard after 3s cooldown
    setTimeout(() => { window.__submitted = false; }, 3000);
  }
}

// syncFallbackQueue removed — dead code (never called)

// ── SESSION STABILIZATION (Legacy — no-op with username auth) ──

async function initSession() {
  // Username auth uses localStorage session. This is kept for backward compatibility.
  console.log("initSession: no-op (username auth handles sessions)");
}



// ── API WRAPPER (Direct Supabase → test_attempts) ─────────────

async function fetchUserResultsAPI(userId) {
  return await client
    .from("test_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
}

// ── GET RESULTS ───────────────────────────

async function getUserResults() {
  try {
    const user = Auth.getUser();
    if (!user || !user.id) {
      console.warn("Cannot fetch results: No authenticated user");
      return [];
    }

    const userId = user.id;
    const { data, error } = await fetchUserResultsAPI(userId);

    if (error) {
      console.error("Fetch Results Error:", error);
      return [];
    }

    return data;
  } catch (err) {
    console.error("Fetch Results Unexpected Error:", err);
    return [];
  }
}

// ── REALTIME SUBSCRIPTION ─────────────────

let resultsChannel = null;

async function subscribeToResults(callback) {
  if (resultsChannel) return; // Singleton: Already subscribed

  try {
    const user = Auth.getUser();
    if (!user || !user.id) return;
    const userId = user.id;

    resultsChannel = client
      .channel('attempts_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_attempts', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("🔔 Real-time result inserted!", payload);
          callback(payload);
        })
      .subscribe();

    console.log("📡 Real-time subscription active for user:", userId);
  } catch (err) {
    console.error("Subscription Error:", err);
  }
}

// ── LEADERBOARD (Direct Supabase — test_attempts + users) ─────────

async function fetchLeaderboard(mode = 'alltime') {
  try {
    // Build time filter
    let timeFilter = null;
    const now = new Date();

    if (mode === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      timeFilter = today.toISOString();
    } else if (mode === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      timeFilter = weekAgo.toISOString();
    }

    // Query test_attempts
    let query = client
      .from("test_attempts")
      .select("user_id, score, accuracy, time_taken, total_questions, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (timeFilter) {
      query = query.gte("created_at", timeFilter);
    }

    const { data: attempts, error: attErr } = await query;

    if (attErr) {
      console.error("Leaderboard attempts fetch error:", attErr);
      return [];
    }

    if (!attempts || attempts.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(attempts.map(a => a.user_id))].filter(Boolean);
    if (userIds.length === 0) return [];

    // Fetch usernames
    const { data: users, error: usrErr } = await client
      .from("users")
      .select("id, username, streak")
      .in("id", userIds);

    if (usrErr) {
      console.error("Leaderboard users fetch error:", usrErr);
      return [];
    }

    const userMap = {};
    (users || []).forEach(u => {
      userMap[u.id] = { username: u.username, streak: u.streak || 0 };
    });

    // Aggregate: best score per user
    const userBest = {};
    attempts.forEach(row => {
      const userInfo = userMap[row.user_id];
      if (!userInfo) return;

      const key = row.user_id;
      const score = row.accuracy || 0;

      if (!userBest[key] || score > userBest[key].best_score) {
        userBest[key] = {
          user_id: row.user_id,
          username: userInfo.username || 'Anonymous',
          best_score: score,
          best_raw_score: row.score || 0,
          best_time: row.time_taken || 0,
          total_questions: row.total_questions || 0,
          streak: userInfo.streak || 0,
          total_tests: 0,
          avatar: 'default'
        };
      }

      // Count total tests
      if (!userBest[key].total_tests) userBest[key].total_tests = 0;
      userBest[key].total_tests++;
    });

    // Sort: best accuracy → best raw score → fastest time
    const sorted = Object.values(userBest)
      .sort((a, b) => {
        if (b.best_score !== a.best_score) return b.best_score - a.best_score;
        if (b.best_raw_score !== a.best_raw_score) return b.best_raw_score - a.best_raw_score;
        return a.best_time - b.best_time;
      })
      .slice(0, 50)
      .map((user, idx) => ({ ...user, rank: idx + 1 }));

    return sorted;
  } catch (err) {
    console.error("Leaderboard CRASH:", err);
    return [];
  }
}

// ── AVATAR UPDATE ─────────────────────────

async function updateAvatar(avatar) {
  const username = Storage.getUsername();
  if (!username || !avatar) return;

  try {
    const resp = await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar })
    });
    const data = await resp.json();
    if (data.success) {
      localStorage.setItem('mocktest_avatar', avatar);
      console.log("✅ Avatar updated:", avatar);
    }
  } catch (err) {
    console.warn("Avatar update failed:", err);
  }
}

// One-time avatar sync (called after first submit)
async function syncAvatarOnce() {
  if (localStorage.getItem('mocktest_avatar_synced')) return;
  const avatar = localStorage.getItem('mocktest_avatar') || 'default';
  await updateAvatar(avatar);
  localStorage.setItem('mocktest_avatar_synced', 'true');
}

// ── MAKE GLOBAL ───────────────────────────
window.fetchRandomQuestions = fetchRandomQuestions;
window.fetchSectionWiseQuestions = fetchSectionWiseQuestions;
window.fetchAdminQuestions = fetchAdminQuestions;
window.checkAdminRole = checkAdminRole;
window.mapDBToUI = mapDBToUI;
window.addQuestionToDB = addQuestionToDB;
window.deleteQuestionFromDB = deleteQuestionFromDB;
window.bulkInsertQuestions = bulkInsertQuestions;
window.saveResultToDB = saveResultToDB;
window.getUserResults = getUserResults;
window.initSession = initSession;
window.subscribeToResults = subscribeToResults;
window.fetchLeaderboard = fetchLeaderboard;
window.updateAvatar = updateAvatar;
window.syncAvatarOnce = syncAvatarOnce;
window.supabaseClient = client;

