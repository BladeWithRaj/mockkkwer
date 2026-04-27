// ============================================
// SUPABASE CLIENT
// ============================================

const SUPABASE_URL = "https://ygzqmcmiroomjajoxezt.supabase.co";
const SUPABASE_KEY = "sb_publishable_f9j2KF0lNdMVts6i4bFPzw_jXAvJaqV";

// IMPORTANT: renamed to 'client' to avoid conflict with window.supabase
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── FETCH ──────────────────────────────────

async function fetchRandomQuestions(config = {}) {
  const { limit = 50, subject, difficulty, exam, seenIds = [] } = config;
  try {
    const resp = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit, subject, difficulty, exam, seen_ids: seenIds })
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
  if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
  
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

// ── DATA MAPPING (DB → UI) ────────────────

function mapDBToUI(data) {
  if (!Array.isArray(data)) return [];

  return data.map(q => {
    // Guard: skip malformed questions
    if (!q || !q.id) {
      console.warn("⚠️ Skipping malformed question (no ID):", q);
      return null;
    }

    const options = [
      q.option_a || "",
      q.option_b || "",
      q.option_c || "",
      q.option_d || ""
    ];

    // Edge case: null or empty correct_answer
    if (!q.correct_answer || q.correct_answer.trim() === "") {
      console.warn(`⚠️ Question ID ${q.id}: correct_answer is null/empty — marking as unanswerable`);
      return {
        id: String(q.id),
        question: q.question || "",
        options: options,
        correct: -1,
        subject: q.subject || "General",
        topic: q.subject || "General",
        difficulty: (q.difficulty || "medium").toLowerCase(),
        exam: q.exam ? q.exam.split(",").map(e => e.trim()).filter(Boolean) : [],
        _hasError: true
      };
    }

    // Find correct answer index (handles duplicates — takes first match)
    const correctIdx = options.findIndex(opt => opt === q.correct_answer);

    if (correctIdx === -1) {
      console.warn(`⚠️ Question ID ${q.id}: correct_answer "${q.correct_answer}" does not match any option.`, options);
    }

    // Edge case: check for duplicate options
    const uniqueOptions = new Set(options.filter(o => o !== ""));
    if (uniqueOptions.size < options.filter(o => o !== "").length) {
      console.warn(`⚠️ Question ID ${q.id}: has duplicate options.`, options);
    }

    // Edge case: check for empty options (not all 4 filled)
    const emptyCount = options.filter(o => o === "").length;
    if (emptyCount > 0) {
      console.warn(`⚠️ Question ID ${q.id}: has ${emptyCount} empty option(s).`);
    }

    return {
      id: String(q.id),
      question: q.question || "",
      options: options,
      correct: correctIdx >= 0 ? correctIdx : -1,
      subject: q.subject || "General",
      topic: q.subject || "General",
      difficulty: (q.difficulty || "medium").toLowerCase(),
      exam: q.exam ? q.exam.split(",").map(e => e.trim()).filter(Boolean) : []
    };
  }).filter(q => q !== null); // Remove skipped malformed questions
}

// ── ADD QUESTION (Admin → DB) ─────────────

async function addQuestionToDB(q) {
  if (!q.question || !q.question.trim()) {
    return { success: false, error: "Question text is required" };
  }
  if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) {
    return { success: false, error: "All 4 options are required" };
  }
  const validOptions = [q.option_a, q.option_b, q.option_c, q.option_d];
  if (!validOptions.includes(q.correct_answer)) {
    return { success: false, error: "Correct answer must match one of the options" };
  }

  const { data, error } = await client
    .from("questions")
    .insert([{
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      subject: q.subject,
      exam: q.exam,
      difficulty: q.difficulty
    }])
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
