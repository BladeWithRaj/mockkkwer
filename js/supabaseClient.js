// ============================================
// SUPABASE CLIENT
// ============================================

const SUPABASE_URL = "https://ygzqmcmiroomjajoxezt.supabase.co";
const SUPABASE_KEY = "sb_publishable_f9j2KF0lNdMVts6i4bFPzw_jXAvJaqV";

// IMPORTANT: renamed to 'client' to avoid conflict with window.supabase
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── FETCH ──────────────────────────────────

async function fetchQuestions() {
  const { data, error } = await client
    .from("questions")
    .select("*");

  if (error) {
    console.error("Supabase Error:", error);
    return [];
  }

  console.log("Loaded questions:", data);
  return data;
}

// ── DATA MAPPING (DB → UI) ────────────────

function mapDBToUI(data) {
  return data.map(q => {
    const options = [
      q.option_a || "",
      q.option_b || "",
      q.option_c || "",
      q.option_d || ""
    ];

    const correctIdx = options.indexOf(q.correct_answer);

    return {
      id: String(q.id),
      question: q.question || "",
      options: options,
      correct: correctIdx >= 0 ? correctIdx : 0,
      subject: q.subject || "General",
      topic: q.subject || "General",
      difficulty: (q.difficulty || "medium").toLowerCase(),
      exam: q.exam ? q.exam.split(",").map(e => e.trim()).filter(Boolean) : []
    };
  });
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
    const { data: sessionData } = await client.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    // Fallback if no session (should be handled by Auth.init but just in case)
    if (!token) {
      console.warn("No session token found, logging in anonymously...");
      const { data } = await client.auth.signInAnonymously();
      if (!data.session) return;
    }

    const testId = crypto.randomUUID();
    
    // Format payload for secure API
    const payload = {
      testId,
      questionIds: result.questionResults.map(qr => qr.question.id),
      answers: result.questionResults.reduce((acc, qr, i) => {
        acc[i] = qr.selectedAnswer;
        return acc;
      }, {}),
      timeTaken: result.timeTaken,
      isDaily: result.config.isDaily || false
    };

    console.log("📤 Sending data to secure API:", payload);

    const headers = { "Content-Type": "application/json" };
    const latestSession = await client.auth.getSession();
    if (latestSession.data?.session?.access_token) {
      headers["Authorization"] = "Bearer " + latestSession.data.session.access_token;
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
      if (data.streak) {
        console.log(`🔥 Streak updated: ${data.streak.current_streak}`);
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

async function getUserResults() {
  try {
    const { data: userData } = await client.auth.getUser();
    if (!userData || !userData.user) {
      console.warn("Cannot fetch results: No authenticated user");
      return [];
    }
    
    const userId = userData.user.id;

    const { data, error } = await client
      .from("results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

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
window.fetchQuestions = fetchQuestions;
window.mapDBToUI = mapDBToUI;
window.addQuestionToDB = addQuestionToDB;
window.deleteQuestionFromDB = deleteQuestionFromDB;
window.bulkInsertQuestions = bulkInsertQuestions;
window.saveResultToDB = saveResultToDB;
window.getUserResults = getUserResults;
window.syncFallbackQueue = syncFallbackQueue;
window.initSession = initSession;
window.subscribeToResults = subscribeToResults;
