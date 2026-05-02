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

function mapDBToUI(data) {
  if (!Array.isArray(data)) return [];

  const isHi = typeof Lang !== 'undefined' && Lang.current === "hi";

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

    return {
      id: q.id,
      subject: (q.subject || "general").toLowerCase(),
      correct: correctIndex,

      // Bilingual storage (for language toggle)
      questionEN: q.question_en,
      questionHI: q.question_hi || q.question_en,
      optionsEN,
      optionsHI,

      // Active display (changes on language toggle)
      question: isHi ? (q.question_hi || q.question_en) : q.question_en,
      options: isHi ? optionsHI : optionsEN
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

// ── RESULTS (DB) ──────────────────────────

async function saveResultToDB(result) {
  try {
    const testId = crypto.randomUUID();
    const user_id = Storage.getUserId();
    const username = Storage.getUsername();

    if (!user_id || !username) {
      console.warn("Skipping submission: No username/identity found.");
      return;
    }

    // ── Guard: ensure questionResults exists ──
    const questionResults = result.questionResults || [];
    if (questionResults.length === 0) {
      console.warn("Skipping submission: No questionResults in result object.");
      return;
    }

    // Format payload for secure API
    const payload = {
      testId,
      questionIds: questionResults.map(qr => qr.question?.id).filter(Boolean),
      answers: questionResults.reduce((acc, qr) => {
        if (qr.question?.id && qr.selectedAnswer !== null && qr.selectedAnswer !== undefined) {
          acc[qr.question.id] = qr.selectedAnswer;
        }
        return acc;
      }, {}),
      timeTaken: result.timeTaken || 0,
      isDaily: (result.config && result.config.isDaily) || false,
      user_id,
      username,
      examId: (result.config && result.config.examId) || null,
      examName: (result.config && result.config.examName) || null
    };

    console.log("📤 Sending data to secure API:", payload);

    // Get auth token from Supabase session for secure API call
    const headers = { "Content-Type": "application/json" };
    try {
      const { data: sessionData } = await client.auth.getSession();
      if (sessionData?.session?.access_token) {
        headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
      }
    } catch (authErr) {
      console.warn("Could not get auth token, submitting without:", authErr);
    }

    const resp = await fetch("/api/submit", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("❌ Save failed:", data.error);
    } else {
      console.log("✅ Result saved securely:", data);

      if (window.trackEvent) {
        window.trackEvent("test_submit", {
          score: result.accuracy || result.scorePercent || 0
        });
      }
    }

  } catch (err) {
    console.error("🔥 Unexpected error in saveResultToDB:", err);
  }
}

// syncFallbackQueue removed — dead code (never called)

// ── SESSION STABILIZATION ─────────────────

async function initSession() {
  try {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      console.log("Initializing new anonymous session...");
      await client.auth.signInAnonymously();
    } else {
      console.log("Session stabilized:", sessionData.session.user.id);
    }
  } catch (err) {
    console.error("Session init error:", err);
  }
}



// ── API WRAPPER (Pre-Backend) ─────────────

async function fetchUserResultsAPI(userId) {
  return await client
    .from("results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
}

// ── GET RESULTS ───────────────────────────

async function getUserResults() {
  try {
    const { data: userData } = await client.auth.getUser();
    if (!userData || !userData.user) {
      console.warn("Cannot fetch results: No authenticated user");
      return [];
    }

    const userId = userData.user.id;
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
    const { data: userData } = await client.auth.getUser();
    if (!userData || !userData.user) return;
    const userId = userData.user.id;

    resultsChannel = client
      .channel('results_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'results', filter: `user_id=eq.${userId}` },
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

// ── LEADERBOARD (Direct Supabase) ─────────

async function fetchLeaderboard() {
  try {
    const { data, error } = await client
      .from("results")
      .select("user_id, username, score_percent")
      .order("score_percent", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Aggregate: best score per user
    const userBest = {};
    data.forEach(row => {
      const key = row.username || row.user_id;
      if (!userBest[key] || row.score_percent > userBest[key].best_score) {
        userBest[key] = {
          username: row.username || 'Anonymous',
          best_score: row.score_percent
        };
      }
    });

    // Sort and rank
    const sorted = Object.values(userBest)
      .sort((a, b) => b.best_score - a.best_score)
      .slice(0, 50)
      .map((user, idx) => ({ ...user, rank: idx + 1 }));

    return sorted;
  } catch (err) {
    console.error("Leaderboard CRASH:", err);
    return [];
  }
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
window.supabaseClient = client;
