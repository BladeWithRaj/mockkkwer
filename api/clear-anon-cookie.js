// clear-anon-cookie.js – Remove the anonymous token cookie
// Called after a successful merge or when user signs out.

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    res.setHeader("Set-Cookie",
      "anon_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
