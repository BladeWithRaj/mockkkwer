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

// ── MAKE GLOBAL ───────────────────────────
window.fetchQuestions = fetchQuestions;
window.mapDBToUI = mapDBToUI;
window.addQuestionToDB = addQuestionToDB;
window.deleteQuestionFromDB = deleteQuestionFromDB;
window.bulkInsertQuestions = bulkInsertQuestions;
