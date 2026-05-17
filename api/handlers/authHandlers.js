// ═══════════════════════════════════════════════
// AUTH HANDLERS — User login/verify/logout
// ═══════════════════════════════════════════════

import {
  createUserSession, verifyUserSession, destroyUserSession,
  extractUserToken, buildUserCookie, clearUserCookie
} from "../_lib/userSession.js";

export async function handleUserLogin(supabase, req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { username, action } = req.body || {};
    if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Valid username required (3-20 chars, letters/numbers/underscore)" });
    }

    const normalized = username.toLowerCase().trim();
    const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const { data: existing } = await supabase
      .from("users").select("id, username").eq("id", normalized).single();

    let userId, displayName;

    if (action === "create" && !existing) {
      const { data: newUser, error: insertErr } = await supabase
        .from("users")
        .insert([{ id: normalized, username: normalized, total_tests: 0, total_score: 0 }])
        .select().single();

      if (insertErr) return res.status(500).json({ error: "Could not create user: " + insertErr.message });
      userId = newUser.id;
      displayName = newUser.username;
    } else if (existing) {
      userId = existing.id;
      displayName = existing.username;
    } else if (action === "login") {
      return res.status(404).json({ error: "User not found" });
    } else {
      const { data: autoUser, error: autoErr } = await supabase
        .from("users")
        .upsert([{ id: normalized, username: normalized }], { onConflict: "id" })
        .select().single();

      if (autoErr) return res.status(500).json({ error: autoErr.message });
      userId = autoUser.id;
      displayName = autoUser.username;
    }

    const session = await createUserSession(supabase, { userId, username: displayName, ip, userAgent });
    if (!session) return res.status(500).json({ error: "Session creation failed" });

    res.setHeader("Set-Cookie", buildUserCookie(session.token));
    return res.json({ success: true, user: { id: userId, username: displayName }, expiresAt: session.expiresAt });
  } catch (err) {
    console.error("[USER LOGIN] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleUserVerify(supabase, req, res) {
  try {
    const token = extractUserToken(req);
    if (!token) return res.json({ valid: false });

    const session = await verifyUserSession(supabase, token);
    if (!session.valid) {
      res.setHeader("Set-Cookie", clearUserCookie());
      return res.json({ valid: false, expired: session.expired || false });
    }

    return res.json({ valid: true, user: { id: session.userId, username: session.username } });
  } catch (err) {
    console.error("[USER VERIFY] Crash:", err);
    return res.json({ valid: false });
  }
}

export async function handleUserLogout(supabase, req, res) {
  try {
    const token = extractUserToken(req);
    if (token) await destroyUserSession(supabase, token);
    res.setHeader("Set-Cookie", clearUserCookie());
    return res.json({ success: true });
  } catch (err) {
    console.error("[USER LOGOUT] Crash:", err);
    return res.json({ success: true });
  }
}
