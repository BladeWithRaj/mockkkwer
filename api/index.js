// ═══════════════════════════════════════════════
// UNIFIED API ROUTER — Thin dispatcher
// Logic lives in /handlers/*.js modules.
// ═══════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import "./_lib/env.js";  // Fail-fast env validation on cold start
import { logRequest, logError, errorResponse } from "./_lib/logger.js";

// Handler modules
import { handleSubmit } from "./handlers/attemptHandlers.js";
import { handleTrack, handleAnalytics } from "./handlers/trackingHandlers.js";
import { handleLeaderboard, handleAvatar, handleProfile, handleStreak, handleWallet, handleRewards, handleProfileSummary } from "./handlers/profileHandlers.js";
import { handleUserLogin, handleUserVerify, handleUserLogout } from "./handlers/authHandlers.js";
import { handleAdminLogin, handleAdminVerify, handleAdminLogout, handleAdminData, handleTOTPSetup, handleTOTPStatus, handleAdminResetTOTP } from "./handlers/adminHandlers.js";
import { handleExams } from "./handlers/examHandlers.js";
import { handlePolytechnic } from "./handlers/polytechnicHandlers.js";
import { handleGeneratePolytechnicPaper } from "./handlers/geminiPaperHandler.js";

// ── Supabase Admin (service role) ─────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
  console.error("❌ MISSING ENV VARS — supabase client not created");
}

// ═══════════════════════════════════════════════
// ROUTER — single entry point
// ═══════════════════════════════════════════════

export default async function handler(req, res) {
  // CORS — MUST use exact origin (not *) when credentials: 'include' is used
  // Wildcard + credentials = browser REFUSES to send cookies
  const origin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '') || "";
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");  // Required when origin is dynamic
  if (req.method === "OPTIONS") return res.status(200).end();

  // Env check
  if (!supabase) {
    return res.status(500).json({
      error: "Server misconfigured — missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      hint: "Set these in Vercel → Project Settings → Environment Variables"
    });
  }

  // Route
  const url = req.url || "";
  const path = url.split("?")[0];
  const rid = logRequest(req);

  try {
    // ── Admin routes ──
    if (path.includes("/admin-login"))     return await handleAdminLogin(supabase, req, res);
    if (path.includes("/admin-verify"))    return await handleAdminVerify(supabase, req, res);
    if (path.includes("/admin-logout"))    return await handleAdminLogout(supabase, req, res);
    if (path.includes("/totp-status"))     return await handleTOTPStatus(supabase, req, res);
    if (path.includes("/totp-setup"))      return await handleTOTPSetup(supabase, req, res);
    if (path.includes("/admin-reset-totp")) return await handleAdminResetTOTP(supabase, req, res);
    if (path.includes("/admin-data"))      return await handleAdminData(supabase, req, res);

    // ── User auth routes ──
    if (path.includes("/user-login"))      return await handleUserLogin(supabase, req, res);
    if (path.includes("/user-verify"))     return await handleUserVerify(supabase, req, res);
    if (path.includes("/user-logout"))     return await handleUserLogout(supabase, req, res);

    // ── Polytechnic engine routes ──
    if (path.includes("/generate-polytechnic-paper")) return await handleGeneratePolytechnicPaper(supabase, req, res);
    if (path.includes("/polytechnic"))     return await handlePolytechnic(supabase, req, res);

    // ── Exam config routes ──
    if (path.includes("/exams"))           return await handleExams(supabase, req, res);

    // ── Public routes ──
    if (path.includes("/submit"))          return await handleSubmit(supabase, req, res);
    if (path.includes("/track"))           return await handleTrack(supabase, req, res);
    if (path.includes("/analytics"))       return await handleAnalytics(supabase, req, res);
    if (path.includes("/leaderboard"))     return await handleLeaderboard(supabase, req, res);
    if (path.includes("/avatar"))          return await handleAvatar(supabase, req, res);
    if (path.includes("/profile-summary")) return await handleProfileSummary(supabase, req, res);
    if (path.includes("/profile"))         return await handleProfile(supabase, req, res);
    if (path.includes("/streak"))          return await handleStreak(supabase, req, res);
    if (path.includes("/wallet"))          return await handleWallet(supabase, req, res);
    if (path.includes("/rewards"))         return await handleRewards(supabase, req, res);

    return res.status(404).json({ error: "Route not found", path });
  } catch (err) {
    logError(rid, "ROUTER", err);
    return errorResponse(res, 500, err, rid);
  }
}
