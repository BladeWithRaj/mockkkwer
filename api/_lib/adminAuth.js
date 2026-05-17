// ═══════════════════════════════════════════════
// ADMIN AUTH — TOTP Authenticator + Bearer Token
// No cookies. No passwords. No CSRF. No sessions table.
// 
// Flow: Authenticator 6-digit code → verify → token → localStorage
// ═══════════════════════════════════════════════

import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import crypto from "crypto";

const TOKEN_EXPIRY_HOURS = 72; // 3 days
const APP_NAME = "MockTestPro Admin";

// ── In-memory rate limiter ──
const ipBuckets = {};
const IP_WINDOW_MS = 60_000;
const IP_MAX = 5;

function checkIPRate(ip) {
  if (!ip || ip === "unknown") return true;
  const now = Date.now();
  if (!ipBuckets[ip]) ipBuckets[ip] = [];
  ipBuckets[ip] = ipBuckets[ip].filter(ts => now - ts < IP_WINDOW_MS);
  if (ipBuckets[ip].length >= IP_MAX) return false;
  ipBuckets[ip].push(now);
  if (Object.keys(ipBuckets).length > 200) {
    for (const k of Object.keys(ipBuckets)) {
      if (!ipBuckets[k].length || now - ipBuckets[k][0] > IP_WINDOW_MS * 5) delete ipBuckets[k];
    }
  }
  return true;
}

/**
 * TOTP Setup — generates secret + QR code for first-time setup.
 * Called once, then admin scans QR in Google Authenticator.
 */
export async function setupTOTP(supabase, adminId) {
  // Check if already set up
  const { data: existing } = await supabase
    .from("admin_totp")
    .select("id, setup_complete")
    .eq("admin_id", adminId)
    .single();

  if (existing?.setup_complete) {
    return { success: false, error: "TOTP already configured. Use reset flow." };
  }

  const secret = authenticator.generateSecret();

  // Get admin username for QR label
  const { data: admin } = await supabase
    .from("admin_users")
    .select("username")
    .eq("id", adminId)
    .single();

  const otpauthUrl = authenticator.keyuri(
    admin?.username || "admin",
    APP_NAME,
    secret
  );

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Upsert secret (not yet verified)
  await supabase.from("admin_totp").upsert({
    admin_id: adminId,
    secret,
    enabled: true,
    setup_complete: false
  }, { onConflict: "admin_id" });

  return {
    success: true,
    secret, // Show as backup code
    qrCode: qrDataUrl,
    otpauthUrl
  };
}

/**
 * Verify TOTP setup — admin enters first code to confirm setup.
 */
export async function verifyTOTPSetup(supabase, adminId, code) {
  const { data: totp } = await supabase
    .from("admin_totp")
    .select("secret")
    .eq("admin_id", adminId)
    .eq("setup_complete", false)
    .single();

  if (!totp) return { success: false, error: "No pending setup found" };

  const isValid = authenticator.check(code, totp.secret);
  if (!isValid) return { success: false, error: "Invalid code. Try again." };

  // Mark setup complete
  await supabase.from("admin_totp")
    .update({ setup_complete: true })
    .eq("admin_id", adminId);

  return { success: true };
}

/**
 * Verify TOTP code for login.
 * Returns { success, token, username, error }
 */
export async function verifyTOTPLogin(supabase, code, ip, userAgent) {
  if (!code || code.length !== 6) {
    return { success: false, error: "Enter 6-digit code from Authenticator" };
  }

  // Rate limit
  if (!checkIPRate(ip)) {
    await logAttempt(supabase, "admin", false, ip, userAgent, "ip_rate_limited");
    return { success: false, error: "Too many attempts. Wait 1 minute.", banned: true, retryAfter: 1 };
  }

  // Get admin (single-admin system — first row)
  const { data: admin, error: lookupErr } = await supabase
    .from("admin_users")
    .select("id, username, failed_attempts, banned_until")
    .limit(1)
    .single();

  if (lookupErr || !admin) {
    return { success: false, error: "System not configured" };
  }

  // Check ban
  if (admin.banned_until && new Date(admin.banned_until) > new Date()) {
    const retryMin = Math.ceil((new Date(admin.banned_until) - new Date()) / 60000);
    await logAttempt(supabase, admin.username, false, ip, userAgent, "banned");
    return { success: false, error: `Locked. Retry in ${retryMin} min.`, banned: true, retryAfter: retryMin };
  }

  // Get TOTP secret
  const { data: totp } = await supabase
    .from("admin_totp")
    .select("secret, setup_complete")
    .eq("admin_id", admin.id)
    .eq("enabled", true)
    .single();

  if (!totp || !totp.setup_complete) {
    return { success: false, error: "TOTP not set up. Visit setup page first.", needsSetup: true };
  }

  // Verify TOTP
  const isValid = authenticator.check(code, totp.secret);

  if (!isValid) {
    const attempts = (admin.failed_attempts || 0) + 1;
    const update = { failed_attempts: attempts };
    if (attempts >= 5) {
      update.banned_until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    }
    await supabase.from("admin_users").update(update).eq("id", admin.id);
    await logAttempt(supabase, admin.username, false, ip, userAgent, "wrong_totp");
    return {
      success: false,
      error: attempts >= 5 ? "Too many fails. Locked for 1 hour." : "Invalid code",
      attemptsRemaining: Math.max(0, 5 - attempts),
      banned: attempts >= 5
    };
  }

  // TOTP valid → generate token
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600000).toISOString();

  await supabase.from("admin_users").update({
    failed_attempts: 0, banned_until: null,
    session_token: token, session_expires: expiresAt,
    last_login: new Date().toISOString(), last_ip: ip || null
  }).eq("id", admin.id);

  await logAttempt(supabase, admin.username, true, ip, userAgent, "totp_success");

  return { success: true, token, username: admin.username, expiresAt };
}

/**
 * Verify admin token from Authorization header.
 */
export async function verifyAdminToken(supabase, token) {
  if (!token) return { valid: false };

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, username, session_token, session_expires")
    .eq("session_token", token)
    .single();

  if (error || !admin) return { valid: false };
  if (new Date(admin.session_expires) < new Date()) return { valid: false, expired: true };

  return { valid: true, admin: { id: admin.id, username: admin.username } };
}

/**
 * Logout — clear token.
 */
export async function adminLogout(supabase, token) {
  if (!token) return;
  await supabase.from("admin_users")
    .update({ session_token: null, session_expires: null })
    .eq("session_token", token);
}

/**
 * Log login attempt.
 */
async function logAttempt(supabase, username, success, ip, userAgent, reason) {
  try {
    await supabase.from("admin_login_log").insert({
      username, success, ip_address: ip || null, user_agent: userAgent || null, reason
    });
  } catch (e) { console.warn("[AUTH] Log failed:", e.message); }
}
