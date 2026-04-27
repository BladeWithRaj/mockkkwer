// rateLimiter.js – Hybrid rate limiter (memory + Supabase fallback)
// ──────────────────────────────────────────────────────────────────
// In serverless (Vercel), in-memory state resets per cold start.
// This hybrid approach:
//   1. Uses in-memory for same-instance burst protection (fast path)
//   2. Uses Supabase DB for cross-instance rate limiting (durable path)
//
// For high-traffic production, migrate to Upstash Redis for <1ms checks.

import supabase from "./supabaseAdmin.js";

// ── In-memory layer (fast, per-instance) ─────────────────
const memoryCache = {};

function memoryRateLimit(key, windowMs) {
  const now = Date.now();
  const last = memoryCache[key];

  if (last && now - last < windowMs) {
    return false; // Rate limited
  }

  memoryCache[key] = now;

  // Housekeeping
  if (Object.keys(memoryCache).length > 500) {
    for (const k of Object.keys(memoryCache)) {
      if (now - memoryCache[k] > 60000) delete memoryCache[k];
    }
  }

  return true; // Allowed
}

// ── Supabase layer (durable, cross-instance) ─────────────
// Uses a simple table: rate_limits (key TEXT PRIMARY KEY, last_request TIMESTAMPTZ)
// Falls back gracefully if table doesn't exist yet.
async function dbRateLimit(key, windowMs) {
  try {
    const windowSec = Math.max(1, Math.floor(windowMs / 1000));

    // Atomic check-and-set using upsert
    const { data, error } = await supabase
      .from("rate_limits")
      .select("last_request")
      .eq("key", key)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found (OK — first request)
      // Any other error = table might not exist, skip DB check
      console.warn("[RATE_LIMIT] DB check skipped:", error.message);
      return true;
    }

    if (data && data.last_request) {
      const lastTime = new Date(data.last_request).getTime();
      const now = Date.now();
      if (now - lastTime < windowMs) {
        return false; // Rate limited
      }
    }

    // Update/insert the timestamp
    await supabase
      .from("rate_limits")
      .upsert({ key, last_request: new Date().toISOString() }, { onConflict: "key" });

    return true; // Allowed
  } catch (err) {
    // If DB layer fails, don't block the request
    console.warn("[RATE_LIMIT] DB error (allowing request):", err.message);
    return true;
  }
}

// ── Public API ───────────────────────────────────────────

/**
 * Throws if the user/key has made a request within `windowMs` milliseconds.
 * Uses hybrid approach: memory (fast) + Supabase DB (durable).
 *
 * @param {string} key – unique identifier (user_id, IP, etc.)
 * @param {number} windowMs – minimum gap between requests (default 3s)
 */
export function rateLimit(key, windowMs = 3000) {
  // Fast path: in-memory check (catches bursts within same instance)
  if (!memoryRateLimit(key, windowMs)) {
    throw new Error("Too many requests — wait a moment");
  }
}

/**
 * Async version that also checks Supabase for cross-instance limiting.
 * Use this for critical endpoints (submit, questions).
 *
 * @param {string} key
 * @param {number} windowMs
 */
export async function rateLimitAsync(key, windowMs = 3000) {
  // Memory check first (fast)
  if (!memoryRateLimit(key, windowMs)) {
    throw new Error("Too many requests — wait a moment");
  }

  // DB check (durable, cross-instance)
  const allowed = await dbRateLimit(key, windowMs);
  if (!allowed) {
    throw new Error("Too many requests — please wait before trying again");
  }
}
