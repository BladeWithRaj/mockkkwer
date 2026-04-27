import supabase from "./_lib/supabaseAdmin.js";

// Whitelist of valid event names — reject anything else
const VALID_EVENTS = new Set([
  "page_view", "cta_click", "test_start", "test_submit",
  "nav_click", "setup_change", "question_answer",
  "question_review", "test_resume"
]);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
      return res.status(400).json({ error: "Empty array" });
    }

    // Cap batch size to prevent spam
    if (items.length > 50) {
      return res.status(400).json({ error: "Max 50 events per batch" });
    }

    // Validate and filter events
    const payload = [];
    for (const item of items) {
      if (!item.event || typeof item.event !== "string") continue;
      if (!VALID_EVENTS.has(item.event)) continue; // Silently drop invalid events

      payload.push({
        event: item.event,
        data: typeof item.data === "object" ? item.data : {},
        created_at: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString()
      });
    }

    if (payload.length === 0) {
      return res.status(400).json({ error: "No valid events" });
    }

    await supabase.from("events").insert(payload);

    return res.json({ success: true, tracked: payload.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

