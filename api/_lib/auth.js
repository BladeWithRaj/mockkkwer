// ═══════════════════════════════════════════════
// AUTH LIB — Username-based identity (no Clerk)
// Kept for backward compatibility with any imports
// ═══════════════════════════════════════════════

/**
 * Extract username from request.
 * Uses username from body or Authorization header.
 */
export async function verifyUser(req) {
  // Check body first (POST requests)
  if (req.body?.username) {
    return { userId: req.body.username.toLowerCase().trim() };
  }

  // Check Authorization header
  const authHeader = req.headers?.authorization || "";
  const userId = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!userId) {
    throw new Error("No user identity provided");
  }

  return { userId };
}
