// ═══════════════════════════════════════════════
// EXAM HANDLERS — Config-driven exam definitions
// Public API: ONLY serves published exams
// ═══════════════════════════════════════════════

export async function handleExams(supabase, req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const slug = url.searchParams.get("slug");
    const board = url.searchParams.get("board");

    let query = supabase
      .from("exam_configs")
      .select("*")
      .eq("is_active", true)
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (slug) query = query.eq("slug", slug);
    if (board) query = query.eq("board", board);

    const { data, error } = await query;

    if (error) {
      console.warn("[EXAMS] DB query failed:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // Single exam lookup
    if (slug && data?.length === 1) {
      return res.json({ success: true, exam: data[0] });
    }

    return res.json({ success: true, exams: data || [] });
  } catch (err) {
    console.error("[EXAMS] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
