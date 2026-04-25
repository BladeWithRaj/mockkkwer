import supabase from "./_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
      return res.status(400).json({ error: "Empty array" });
    }

    const payload = items.map(item => ({
      event: item.event,
      data: item.data || {},
      created_at: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString()
    }));

    await supabase.from("events").insert(payload);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
