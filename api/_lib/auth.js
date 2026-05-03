// ============================================
// AUTH LIB — Clerk Token Verification (Backend)
// ============================================

import { verifyToken } from "@clerk/backend";

/**
 * Verify Clerk session token from Authorization header.
 * Returns the Clerk user ID (payload.sub).
 * Throws on invalid/missing token.
 */
export async function verifyClerkUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("No authentication token provided");
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Server misconfigured: CLERK_SECRET_KEY not set");
  }

  const payload = await verifyToken(token, { secretKey });

  if (!payload || !payload.sub) {
    throw new Error("Invalid token: no user ID found");
  }

  return {
    clerkId: payload.sub,
    sessionId: payload.sid || null,
    email: payload.email || null
  };
}

// Legacy export name for backward compat
export const verifyUser = verifyClerkUser;
