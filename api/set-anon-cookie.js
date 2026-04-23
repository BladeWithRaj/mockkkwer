// set-anon-cookie.js – Store anonymous token as http-only cookie
// Called once when a new anonymous session is created on the frontend.
// The token is stored in a cookie the client cannot read or tamper with.

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Missing token" });
    }

    // Set http-only cookie (30 days expiry — matches Supabase refresh cycle)
    // HttpOnly = JS can't read it, Secure = HTTPS only, SameSite=Strict = no CSRF
    res.setHeader("Set-Cookie",
      `anon_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
    );
    console.log("[ANON-COOKIE] Set for session");

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
