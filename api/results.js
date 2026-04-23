// results.js – Vercel Serverless Function
import supabase from "./_lib/supabaseAdmin.js";
import { verifyUser } from "./_lib/auth.js";

export default async function handler(req, res) {
  try {
    const user = await verifyUser(req);

    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
