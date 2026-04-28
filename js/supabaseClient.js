// ============================================
// SUPABASE CLIENT
// ============================================

const SUPABASE_URL = "https://ygzqmcmiroomjajoxezt.supabase.co";
const SUPABASE_KEY = "sb_publishable_f9j2KF0lNdMVts6i4bFPzw_jXAvJaqV";

// IMPORTANT: renamed to 'client' to avoid conflict with window.supabase
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── FETCH ──────────────────────────────────

async function fetchRandomQuestions(config = {}) {
  const { limit = 50, subjects = [], seenIds = [] } = config;
  try {
    const resp = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit, subjects, seen_ids: seenIds })
    });
    
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || "Network error");
    }
    
    const result = await resp.json();
    if (!result.success) throw new Error(result.error);
    
    return mapDBToUI(result.questions || []);
  } catch (err) {
    console.error("fetchRandomQuestions Error:", err);
    return { error: err.message };
  }
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

// ── MAP API RESPONSE → UI FORMAT ─────────────
// API returns: { id, question_en, question_hi, options_en[], options_hi[], correct_index, subject }

function mapDBToUI(data) {
  if (!Array.isArray(data)) return [];

  const isHi = typeof Lang !== 'undefined' && Lang.isHindi();

  return data.map(q => {
    // ── GUARD ──
    if (!q || !q.id) {
      console.warn("⚠️ Skipping malformed question (no ID):", q);
      return null;
    }

    // ── PARSE OPTIONS (handle string or array from API) ──
    let optionsEN = typeof q.options_en === "string" ? JSON.parse(q.options_en) : (q.options_en || []);
    let optionsHI = typeof q.options_hi === "string" ? JSON.parse(q.options_hi) : (q.options_hi || null);

    // ── TYPE SAFETY: coerce each to string ──
    optionsEN = Array.isArray(optionsEN) ? optionsEN.map(o => o != null ? String(o) : "") : [];

    // ── VALIDATION: need at least 2 options ──
    const filledEN = optionsEN.filter(o => o !== "").length;
    if (filledEN < 2) {
      console.error(`❌ Q${q.id}: only ${filledEN} options. Skipping.`);
      return null;
    }

    // ── HINDI: per-option fallback to English ──
    if (Array.isArray(optionsHI)) {
      optionsHI = optionsHI.map((o, i) => (o != null && String(o).trim()) ? String(o) : optionsEN[i]);
    } else {
      optionsHI = [...optionsEN];
    }

    // ── QUESTION TEXT ──
    const questionEN = (q.question_en || "").trim();
    const questionHI = (q.question_hi || "").trim() || questionEN;

    if (!questionEN) {
      console.error(`❌ Q${q.id}: empty question text. Skipping.`);
      return null;
    }

    // ── CORRECT INDEX (direct from API, no findIndex needed!) ──
    let correctIdx = typeof q.correct_index === "number" ? q.correct_index : parseInt(q.correct_index, 10);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= optionsEN.length) {
      console.error(`❌ Q${q.id}: bad correct_index=${q.correct_index}. Defaulting 0.`);
      correctIdx = 0;
    }

    // ── DISPLAY ──
    const questionText = isHi ? questionHI : questionEN;
    const options = isHi ? [...optionsHI] : [...optionsEN];

    return {
      id: String(q.id),
      question: questionText,
      options: options,
      correct: correctIdx,
      subject: (q.subject || "general").toLowerCase(),
      topic: (q.subject || "general").toLowerCase(),
      difficulty: (q.difficulty || "medium").toLowerCase(),
      _raw: { questionEN, questionHI, optionsEN, optionsHI }
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
    
    // Format payload for secure API
    const payload = {
      testId,
      questionIds: result.questionResults.map(qr => qr.question.id),
      answers: result.questionResults.reduce((acc, qr) => {
        if (qr.selectedAnswer !== null && qr.selectedAnswer !== undefined) {
          acc[qr.question.id] = qr.selectedAnswer;
        }
        return acc;
      }, {}),
      timeTaken: result.timeTaken,
      isDaily: result.config.isDaily || false,
      user_id,
      username
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
          score: result.scorePercent || result.accuracy
        });
      }
    }

  } catch (err) {
    console.error("🔥 Unexpected error:", err);
  }
}

async function syncFallbackQueue() {
  const queue = Storage.getFallbackQueue();
  if (queue.length === 0) return;

  console.log(`Attempting to sync ${queue.length} offline results...`);
  const { data, error } = await client
    .from("results")
    .insert(queue)
    .select();

  if (error) {
    console.error("Sync Failed:", error);
  } else {
    console.log("Sync Successful!", data);
    Storage.clearFallbackQueue();
  }
}

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

// ── MAKE GLOBAL ───────────────────────────
window.fetchRandomQuestions = fetchRandomQuestions;
window.fetchAdminQuestions = fetchAdminQuestions;
window.checkAdminRole = checkAdminRole;
window.mapDBToUI = mapDBToUI;
window.addQuestionToDB = addQuestionToDB;
window.deleteQuestionFromDB = deleteQuestionFromDB;
window.bulkInsertQuestions = bulkInsertQuestions;
window.saveResultToDB = saveResultToDB;
window.getUserResults = getUserResults;
window.syncFallbackQueue = syncFallbackQueue;
window.initSession = initSession;
window.subscribeToResults = subscribeToResults;
window.supabaseClient = client;
