// ═══════════════════════════════════════════════
// USER SESSION — Cookie-based identity
// No more trusting username from request body.
// Every authenticated request verified via DB.
// ═══════════════════════════════════════════════

import crypto from "crypto";

const USER_SESSION_HOURS = 72;  // 3 days

/**
 * Create a new user session.
 * Returns session token to be set as httpOnly cookie.
 */
export async function createUserSession(supabase, { userId, username, ip, userAgent }) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + USER_SESSION_HOURS * 60 * 60 * 1000);

  const { error } = await supabase
    .from("user_sessions")
    .insert({
      user_id: userId,
      session_token: token,
      ip_address: ip || null,
      user_agent: userAgent || null,
      expires_at: expiresAt.toISOString()
    });

  if (error) {
    console.error("[USER SESSION] Create error:", error.message);
    return null;
  }

  return { token, expiresAt: expiresAt.toISOString() };
}

/**
 * Verify a user session from cookie.
 * Returns: { valid: true, userId, username } or { valid: false }
 */
export async function verifyUserSession(supabase, token) {
  if (!token) return { valid: false };

  const { data: session, error } = await supabase
    .from("user_sessions")
    .select("id, user_id, expires_at")
    .eq("session_token", token)
    .single();

  if (error || !session) return { valid: false };

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("user_sessions").delete().eq("id", session.id);
    return { valid: false, expired: true };
  }

  // Fetch username from users table
  let username = session.user_id;
  const { data: user } = await supabase
    .from("users").select("username").eq("id", session.user_id).single();
  if (user) username = user.username;

  return {
    valid: true,
    userId: session.user_id,
    username,
    sessionId: session.id
  };
}

/**
 * Destroy a user session (logout).
 */
export async function destroyUserSession(supabase, token) {
  if (!token) return;
  await supabase.from("user_sessions").delete().eq("session_token", token);
}

/**
 * Extract user session token from cookie header.
 */
export function extractUserToken(req) {
  const cookie = req.headers?.cookie || "";
  const match = cookie.match(/user_session=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Build httpOnly cookie string for user session.
 */
export function buildUserCookie(token, maxAgeHours = USER_SESSION_HOURS) {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return [
    `user_session=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,   // Lax (not Strict) so cookies work on navigation
    `Max-Age=${maxAgeHours * 60 * 60}`,
    isProduction ? `Secure` : ""
  ].filter(Boolean).join("; ");
}

/**
 * Clear user session cookie.
 */
export function clearUserCookie() {
  return "user_session=; Path=/; HttpOnly; Max-Age=0";
}
