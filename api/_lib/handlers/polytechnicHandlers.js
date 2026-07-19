// ═══════════════════════════════════════════════
// POLYTECHNIC HANDLERS — Paper Generation Engine
// Routes: /api/polytechnic/*
// ═══════════════════════════════════════════════

import { generatePaper, savePaper } from "../paperGenerator.js";
import { renderPaperHTML } from "../paperRenderer.js";

/**
 * Master polytechnic handler — routes sub-paths
 */
export async function handlePolytechnic(supabase, req, res) {
  const url = req.url || "";
  const path = url.split("?")[0];

  try {
    // Sub-routing
    if (path.includes("/polytechnic/subjects"))  return await handleSubjects(supabase, req, res);
    if (path.includes("/polytechnic/syllabus"))  return await handleSyllabus(supabase, req, res);
    if (path.includes("/polytechnic/patterns"))  return await handlePatterns(supabase, req, res);
    if (path.includes("/polytechnic/questions")) return await handleQuestions(supabase, req, res);
    if (path.includes("/polytechnic/generate"))  return await handleGenerate(supabase, req, res);
    if (path.includes("/polytechnic/papers"))    return await handlePapers(supabase, req, res);
    if (path.includes("/polytechnic/notes"))     return await handleNotes(supabase, req, res);

    return res.status(404).json({ error: "Polytechnic route not found", path });
  } catch (err) {
    console.error("[POLYTECHNIC] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Subjects CRUD ──
async function handleSubjects(supabase, req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("polytechnic_subjects")
      .select("*")
      .eq("is_active", true)
      .order("branch, semester, sort_order");
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ subjects: data });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { data, error } = await supabase
      .from("polytechnic_subjects")
      .insert(body)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, subject: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Syllabus (Units) CRUD ──
async function handleSyllabus(supabase, req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const subjectId = url.searchParams.get("subject_id");

  if (req.method === "GET") {
    let query = supabase
      .from("polytechnic_syllabus")
      .select("*")
      .eq("is_active", true)
      .order("unit_no");
    if (subjectId) query = query.eq("subject_id", subjectId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ syllabus: data });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { data, error } = await supabase
      .from("polytechnic_syllabus")
      .insert(body)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, units: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Paper Patterns ──
async function handlePatterns(supabase, req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const subjectId = url.searchParams.get("subject_id");

  if (req.method === "GET") {
    let query = supabase
      .from("polytechnic_paper_patterns")
      .select("*")
      .order("created_at", { ascending: false });
    if (subjectId) query = query.eq("subject_id", subjectId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ patterns: data });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { data, error } = await supabase
      .from("polytechnic_paper_patterns")
      .insert(body)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, pattern: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Questions CRUD ──
async function handleQuestions(supabase, req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const subjectId = url.searchParams.get("subject_id");
  const status = url.searchParams.get("status") || "approved";
  const unitNo = url.searchParams.get("unit");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  if (req.method === "GET") {
    let query = supabase
      .from("polytechnic_questions")
      .select("*", { count: "exact" })
      .eq("moderation_status", status)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (subjectId) query = query.eq("subject_id", subjectId);
    if (unitNo) query = query.eq("unit_no", parseInt(unitNo));

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ questions: data, total: count, page, limit });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Handle both single and batch inserts
    const isArray = Array.isArray(body);
    const items = isArray ? body : [body];

    // Ensure moderation_status defaults to pending
    items.forEach(item => { if (!item.moderation_status) item.moderation_status = "pending"; });

    const { data, error } = await supabase
      .from("polytechnic_questions")
      .insert(items)
      .select("id");
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, imported: data?.length || 0, question: isArray ? undefined : data?.[0] });
  }

  // Bulk approve/reject
  if (req.method === "PATCH") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { ids, action, approved_by } = body;

    if (!ids?.length || !["approved", "rejected", "flagged"].includes(action)) {
      return res.status(400).json({ error: "Provide ids[] and action (approved|rejected|flagged)" });
    }

    const update = { moderation_status: action };
    if (action === "approved") {
      update.approved_by = approved_by || "superadmin";
      update.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("polytechnic_questions")
      .update(update)
      .in("id", ids);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, updated: ids.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Paper Generation ──
async function handleGenerate(supabase, req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { subject_id, pattern_id, title, language, show_answer_key, watermark, exclude_recent_days } = body;

  if (!subject_id) {
    return res.status(400).json({ error: "subject_id is required" });
  }

  // Generate paper
  const paper = await generatePaper(supabase, {
    subjectId: subject_id,
    patternId: pattern_id || null,
    excludeRecentDays: exclude_recent_days || 30
  });

  // Get subject info for header
  const { data: subjectInfo } = await supabase
    .from("polytechnic_subjects")
    .select("*")
    .eq("id", subject_id)
    .single();

  // Render HTML
  const html = renderPaperHTML(paper, subjectInfo, {
    showAnswerKey: show_answer_key !== false,
    language: language || "bilingual",
    watermark: watermark || ""
  });

  // Save paper to DB
  const paperId = await savePaper(supabase, paper, title || `${subjectInfo?.subject_name || "Exam"} Paper`, null);

  // Return both HTML and paper data
  return res.json({
    success: true,
    paper_id: paperId,
    total_questions: paper.total_questions,
    total_marks: paper.total_marks,
    time_minutes: paper.time_minutes,
    sections_summary: paper.sections.map(s => ({
      name: s.name,
      questions: s.questions.length,
      marks: s.questions.length * s.marks_each
    })),
    html,
    answer_key: show_answer_key !== false ? paper.answer_key : undefined,
    generation_config: paper.generation_config
  });
}

// ── List Generated Papers ──
async function handlePapers(supabase, req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("generated_papers")
      .select("id, title, subject_id, paper_type, created_at, is_public, paper_structure")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ papers: data });
  }

  // Get specific paper HTML
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { paper_id } = body;
    if (!paper_id) return res.status(400).json({ error: "paper_id required" });

    const { data: paper } = await supabase
      .from("generated_papers")
      .select("*")
      .eq("id", paper_id)
      .single();

    if (!paper) return res.status(404).json({ error: "Paper not found" });
    return res.json({ paper });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Notes CRUD ──
async function handleNotes(supabase, req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const subjectId = url.searchParams.get("subject_id");
  const unitNo = url.searchParams.get("unit");
  const noteType = url.searchParams.get("type");
  const search = url.searchParams.get("search");
  const noteId = url.searchParams.get("id");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  // GET — List notes or fetch single note
  if (req.method === "GET") {
    // Single note by id
    if (noteId) {
      const { data, error } = await supabase
        .from("polytechnic_notes")
        .select("*, polytechnic_note_attachments(*)")
        .eq("id", parseInt(noteId))
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Increment view count (fire-and-forget)
      supabase
        .from("polytechnic_notes")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id)
        .then(() => {});

      return res.json({ note: data });
    }

    // List notes with filters
    let query = supabase
      .from("polytechnic_notes")
      .select("id, subject_id, unit_no, title, title_hi, note_type, sort_order, view_count, created_at, updated_at", { count: "exact" })
      .eq("is_active", true)
      .order("unit_no", { ascending: true })
      .order("sort_order", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (subjectId) query = query.eq("subject_id", parseInt(subjectId));
    if (unitNo) query = query.eq("unit_no", parseInt(unitNo));
    if (noteType) query = query.eq("note_type", noteType);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ notes: data, total: count, page, limit });
  }

  // POST — Create note (admin)
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { subject_id, unit_no, title, title_hi, content, content_hi, note_type, sort_order, attachments } = body;

    if (!subject_id || !unit_no || !title || !content) {
      return res.status(400).json({ error: "subject_id, unit_no, title, and content are required" });
    }

    const { data: note, error } = await supabase
      .from("polytechnic_notes")
      .insert({
        subject_id: parseInt(subject_id),
        unit_no: parseInt(unit_no),
        title,
        title_hi: title_hi || null,
        content,
        content_hi: content_hi || null,
        note_type: note_type || "theory",
        sort_order: sort_order || 0,
        created_by: body.created_by || "admin"
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Insert attachments if provided
    if (attachments?.length && note) {
      const attachRows = attachments.map(a => ({
        note_id: note.id,
        file_url: a.file_url,
        file_name: a.file_name,
        file_type: a.file_type || "pdf",
        file_size_bytes: a.file_size_bytes || null
      }));
      await supabase.from("polytechnic_note_attachments").insert(attachRows);
    }

    return res.json({ success: true, note });
  }

  // PATCH — Update note
  if (req.method === "PATCH") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, ...updates } = body;

    if (!id) {
      return res.status(400).json({ error: "id is required for update" });
    }

    // Only allow safe fields
    const allowed = ["title", "title_hi", "content", "content_hi", "note_type", "sort_order", "is_active"];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data, error } = await supabase
      .from("polytechnic_notes")
      .update(safeUpdates)
      .eq("id", parseInt(id))
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, note: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
