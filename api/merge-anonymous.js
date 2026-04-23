// merge-anonymous.js – Secure Account Merge (Vercel Serverless)
// ─────────────────────────────────────────────────────────────
// Flow:
//   1. Read the OLD anonymous token from http-only cookie (NOT from body)
//   2. Validate the old token via Supabase and confirm it has no email
//   3. Verify the NEW (email) user from the Authorization header
//   4. Call RPC merge_anonymous_results(old_uid, new_uid) — atomic DB update
//   5. Clear the anonymous cookie
// ─────────────────────────────────────────────────────────────

import supabase from "./_lib/supabaseAdmin.js";
import { verifyUser } from "./_lib/auth.js";
import { rateLimit } from "./_lib/rateLimiter.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ── 1. Verify the NEW user (must have email) ──
    const newUser = await verifyUser(req);
    rateLimit(newUser.id, 5000); // stricter rate limit for merge

    if (!newUser.email) {
      return res.status(400).json({ error: "You must sign up with email before merging" });
    }

    // ── 2. Extract old anonymous token from cookie ──
    const cookies = parseCookies(req.headers.cookie || "");
    const anonToken = cookies["anon_token"];

    if (!anonToken) {
      return res.json({ success: true, merged: 0, message: "No anonymous session to merge" });
    }

    // ── 3. Validate the anonymous token ──
    const { createClient } = await import("@supabase/supabase-js");
    const anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: anonData, error: anonErr } = await anonClient.auth.getUser(anonToken);

    if (anonErr || !anonData?.user) {
      // Token expired or invalid — clear the cookie, nothing to merge
      clearAnonCookie(res);
      return res.json({ success: true, merged: 0, message: "Anonymous token expired — nothing to merge" });
    }

    const anonUid = anonData.user.id;

    // ── 4. Guard: ensure old user is truly anonymous ──
    if (anonData.user.email) {
      clearAnonCookie(res);
      return res.status(400).json({ error: "Provided cookie belongs to a verified user, not anonymous" });
    }

    // ── 5. Guard: don't merge into self ──
    if (anonUid === newUser.id) {
      clearAnonCookie(res);
      return res.json({ success: true, merged: 0, message: "Same user — no merge needed" });
    }

    // ── 6. Atomic merge via RPC ──
    console.log("[MERGE] Attempting", { oldUid: anonUid, newUid: newUser.id });
    const { data: mergedCount, error: rpcErr } = await supabase.rpc(
      "merge_anonymous_results",
      { old_uid: anonUid, new_uid: newUser.id }
    );

    if (rpcErr) {
      console.error("[MERGE] RPC error:", rpcErr);
      throw rpcErr;
    }
    console.log("[MERGE] Success", { oldUid: anonUid, newUid: newUser.id, mergedCount });

    // ── 7. Clear the anonymous cookie ──
    clearAnonCookie(res);

    return res.json({
      success: true,
      merged: mergedCount || 0,
      message: mergedCount > 0
        ? `Merged ${mergedCount} test result(s) into your account`
        : "Already merged or no anonymous data found"
    });

  } catch (err) {
    console.error("[MERGE] Error:", err.message);
    const status = err.message.includes("Too many") ? 429 : 500;
    return res.status(status).json({ error: err.message });
  }
}

// ── Helpers ──────────────────────────────────

function parseCookies(cookieStr) {
  const obj = {};
  cookieStr.split(";").forEach(pair => {
    const [key, ...rest] = pair.trim().split("=");
    if (key) obj[key] = decodeURIComponent(rest.join("="));
  });
  return obj;
}

function clearAnonCookie(res) {
  res.setHeader("Set-Cookie",
    "anon_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
  );
}
