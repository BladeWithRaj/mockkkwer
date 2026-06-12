// ═══════════════════════════════════════════════
// TRACKING HANDLERS — Events + Analytics
// ═══════════════════════════════════════════════

const VALID_EVENTS = new Set([
  "page_view", "cta_click", "test_start", "test_submit",
  "nav_click", "setup_change", "question_answer",
  "question_review", "test_resume"
]);

export async function handleTrack(supabase, req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    if (items.length === 0) return res.status(400).json({ error: "Empty" });
    if (items.length > 50) return res.status(400).json({ error: "Max 50" });

    const payload = [];
    for (const item of items) {
      if (!item.event || typeof item.event !== "string") continue;
      if (!VALID_EVENTS.has(item.event)) continue;
      payload.push({
        event: item.event,
        data: typeof item.data === "object" ? item.data : {},
        created_at: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString()
      });
    }

    if (payload.length === 0) return res.status(400).json({ error: "No valid events" });

    const { error } = await supabase.from("events").insert(payload);
    if (error) console.warn("[TRACK] Insert error:", error.message);

    return res.json({ success: true, tracked: payload.length });
  } catch (err) {
    console.error("[TRACK] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleAnalytics(supabase, req, res) {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("event, data, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

    if (error) return res.status(500).json({ error: error.message });
    if (!events) return res.json({});

    const count = (n) => events.filter(e => e.event === n).length;
    const pv = count("page_view"), cc = count("cta_click");
    const st = count("test_start"), su = count("test_submit");

    return res.json({
      pageViews: pv, ctaClicks: cc, starts: st, submits: su,
      ctr: pv ? ((cc / pv) * 100).toFixed(1) : 0,
      startRate: cc ? ((st / cc) * 100).toFixed(1) : 0,
      completion: st ? ((su / st) * 100).toFixed(1) : 0
    });
  } catch (err) {
    console.error("[ANALYTICS] Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
