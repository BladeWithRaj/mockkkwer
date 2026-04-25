import supabase from "./_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    // last 7 days
    const { data: events, error } = await supabase
      .from("events")
      .select("event, data, created_at")
      .gte("created_at", new Date(Date.now() - 7*24*60*60*1000).toISOString());

    if (error) throw error;
    if (!events) return res.json({});

    const count = (name) => events.filter(e => e.event === name).length;

    const pageViews = count("page_view");
    const ctaClicks = count("cta_click");
    const starts = count("test_start");
    const submits = count("test_submit");

    // A/B split with actual conversions
    const variants = {};
    events.forEach(e => {
      const v = e.data?.variant;
      if (!v) return;
      if (!variants[v]) {
        variants[v] = { views: 0, submits: 0 };
      }
      if (e.event === "page_view") variants[v].views++;
      if (e.event === "test_submit") variants[v].submits++;
    });

    Object.keys(variants).forEach(v => {
      const { views, submits } = variants[v];
      variants[v].conversion = views ? ((submits / views) * 100).toFixed(1) + "%" : "0%";
    });

    return res.json({
      pageViews,
      ctaClicks,
      starts,
      submits,
      ctr: pageViews ? ((ctaClicks / pageViews) * 100).toFixed(1) : 0,
      startRate: ctaClicks ? ((starts / ctaClicks) * 100).toFixed(1) : 0,
      completion: starts ? ((submits / starts) * 100).toFixed(1) : 0,
      variants
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
