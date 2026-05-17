// ═══════════════════════════════════════════════
// ADMIN AUTH MIDDLEWARE — Server-side session verification
// CSRF + IP Rate Limiting + Brute-force protection
// ═══════════════════════════════════════════════

import bcrypt from "bcryptjs";
import crypto from "crypto";

// ── Constants ──
const MAX_FAILED_ATTEMPTS = 3;
const BAN_DURATION_HOURS = 1;
const SESSION_DURATION_HOURS = 24;  // 24h session lifetime
const BCRYPT_ROUNDS = 12;
const IP_RATE_WINDOW_MS = 60 * 1000; // 1 minute window
const IP_RATE_MAX_REQUESTS = 10;     // max 10 login attempts per IP per minute

// ── IP Rate Limiter (in-memory sliding window) ──
const ipBuckets = {};

function checkIPRateLimit(ip) {
  if (!ip || ip === 'unknown') return true;
  const now = Date.now();
  if (!ipBuckets[ip]) ipBuckets[ip] = [];
  // Remove entries outside window
  ipBuckets[ip] = ipBuckets[ip].filter(ts => now - ts < IP_RATE_WINDOW_MS);
  if (ipBuckets[ip].length >= IP_RATE_MAX_REQUESTS) return false;
  ipBuckets[ip].push(now);
  // Housekeeping: cleanup old IPs every 100 calls
  if (Object.keys(ipBuckets).length > 200) {
    for (const k of Object.keys(ipBuckets)) {
      if (!ipBuckets[k].length || now - ipBuckets[k][0] > IP_RATE_WINDOW_MS * 5) delete ipBuckets[k];
    }
  }
  return true;
}

// ── CSRF Token Generator ──
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify admin login credentials against database.
 * Handles: password verification, brute-force protection, ban logic.
 * Returns: { success, token?, error?, retryAfter? }
 */
export async function verifyAdminLogin(supabase, { username, password, ip, userAgent }) {
  if (!username || !password) {
    return { success: false, error: "Username and password required" };
  }

  const normalizedUsername = username.toLowerCase().trim();

  // ── 1. Lookup admin user ──
  const { data: admin, error: lookupErr } = await supabase
    .from("admin_users")
    .select("id, username, password_hash, failed_attempts, banned_until")
    .eq("username", normalizedUsername)
    .single();

  if (lookupErr || !admin) {
    // Log failed attempt (user not found)
    await logLoginAttempt(supabase, normalizedUsername, false, ip, userAgent, "user_not_found");
    // Return generic error (don't reveal if user exists)
    return { success: false, error: "Invalid credentials" };
  }

  // ── 2. Check ban status ──
  if (admin.banned_until) {
    const bannedUntil = new Date(admin.banned_until);
    const now = new Date();

    if (bannedUntil > now) {
      const retryAfterMs = bannedUntil.getTime() - now.getTime();
      const retryAfterMinutes = Math.ceil(retryAfterMs / 60000);

      await logLoginAttempt(supabase, normalizedUsername, false, ip, userAgent, "banned");

      return {
        success: false,
        error: `Too many failed attempts. Try again in ${retryAfterMinutes} minute(s).`,
        retryAfter: retryAfterMinutes,
        banned: true
      };
    }

    // Ban expired — reset
    await supabase
      .from("admin_users")
      .update({ failed_attempts: 0, banned_until: null })
      .eq("id", admin.id);
  }

  // ── 3. Verify password (bcrypt) ──
  let passwordValid = false;
  try {
    passwordValid = await bcrypt.compare(password, admin.password_hash);
  } catch (err) {
    console.error("[ADMIN AUTH] bcrypt error:", err.message);
    return { success: false, error: "Authentication error" };
  }

  if (!passwordValid) {
    // Increment failed attempts
    const newAttempts = (admin.failed_attempts || 0) + 1;
    const updateData = { failed_attempts: newAttempts };

    // Ban if threshold reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const banUntil = new Date(Date.now() + BAN_DURATION_HOURS * 60 * 60 * 1000);
      updateData.banned_until = banUntil.toISOString();

      await supabase
        .from("admin_users")
        .update(updateData)
        .eq("id", admin.id);

      await logLoginAttempt(supabase, normalizedUsername, false, ip, userAgent, "max_attempts_banned");

      return {
        success: false,
        error: `Too many failed attempts. Account locked for ${BAN_DURATION_HOURS} hour(s).`,
        retryAfter: BAN_DURATION_HOURS * 60,
        banned: true,
        attemptsRemaining: 0
      };
    }

    await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", admin.id);

    await logLoginAttempt(supabase, normalizedUsername, false, ip, userAgent, "invalid_password");

    return {
      success: false,
      error: "Invalid credentials",
      attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttempts
    };
  }

  // ── 4. IP Rate Limit check ──
  if (!checkIPRateLimit(ip)) {
    await logLoginAttempt(supabase, normalizedUsername, false, ip, userAgent, "ip_rate_limited");
    return { success: false, error: "Too many requests from this IP. Try again in 1 minute.", banned: true, retryAfter: 1 };
  }

  // ── 5. Password valid — create session + CSRF token ──
  const sessionToken = crypto.randomBytes(48).toString("hex");
  const csrfToken = generateCSRFToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  // Reset failed attempts + update last login
  await supabase
    .from("admin_users")
    .update({
      failed_attempts: 0,
      banned_until: null,
      last_login: new Date().toISOString(),
      last_ip: ip || null
    })
    .eq("id", admin.id);

  // Create session with CSRF token
  const { error: sessionErr } = await supabase
    .from("admin_sessions")
    .insert({
      admin_id: admin.id,
      token: sessionToken,
      csrf_token: csrfToken,
      ip_address: ip || null,
      user_agent: userAgent || null,
      expires_at: expiresAt.toISOString()
    });

  if (sessionErr) {
    console.error("[ADMIN AUTH] Session create error:", sessionErr.message);
    return { success: false, error: "Session creation failed" };
  }

  // Log success
  await logLoginAttempt(supabase, normalizedUsername, true, ip, userAgent, "success");

  return {
    success: true,
    token: sessionToken,
    csrfToken,
    expiresAt: expiresAt.toISOString(),
    username: admin.username
  };
}

/**
 * Verify an existing admin session token.
 * Returns: { valid: true, admin } or { valid: false }
 */
export async function verifyAdminSession(supabase, token, csrfToken = null, requireCSRF = false) {
  if (!token) return { valid: false };

  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("id, admin_id, csrf_token, expires_at")
    .eq("token", token)
    .single();

  if (error || !session) return { valid: false };

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("admin_sessions").delete().eq("id", session.id);
    return { valid: false, expired: true };
  }

  // CSRF validation for mutating requests
  if (requireCSRF && csrfToken !== session.csrf_token) {
    return { valid: false, csrfMismatch: true };
  }

  // Get admin details
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, username")
    .eq("id", session.admin_id)
    .single();

  if (!admin) return { valid: false };

  return { valid: true, admin, sessionId: session.id, csrfToken: session.csrf_token };
}

/**
 * Destroy an admin session (logout).
 */
export async function destroyAdminSession(supabase, token) {
  if (!token) return false;

  const { error } = await supabase
    .from("admin_sessions")
    .delete()
    .eq("token", token);

  return !error;
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Log a login attempt for audit trail.
 */
async function logLoginAttempt(supabase, username, success, ip, userAgent, reason) {
  try {
    await supabase.from("admin_login_log").insert({
      username,
      success,
      ip_address: ip || null,
      user_agent: userAgent || null,
      reason
    });
  } catch (err) {
    console.warn("[ADMIN AUTH] Failed to log login attempt:", err.message);
  }
}
