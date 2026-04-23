// rateLimiter.js – simple in-memory per-user rate limiter
// NOTE: In serverless (Vercel), this resets per cold start.
// For true production, replace with Upstash Redis / Vercel KV.

const requests = {};

/**
 * Throws if the user has made a request within `windowMs` milliseconds.
 * @param {string} userId
 * @param {number} windowMs – minimum gap between requests (default 3s)
 */
export function rateLimit(userId, windowMs = 3000) {
  const now = Date.now();
  const last = requests[userId];

  if (last && now - last < windowMs) {
    throw new Error("Too many requests — wait a moment");
  }

  requests[userId] = now;

  // Housekeeping: prune entries older than 60s to avoid memory leak
  if (Object.keys(requests).length > 500) {
    for (const uid of Object.keys(requests)) {
      if (now - requests[uid] > 60000) delete requests[uid];
    }
  }
}
