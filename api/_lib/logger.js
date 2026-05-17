// ═══════════════════════════════════════════════
// LOGGER — Structured backend logging
// Adds request IDs for traceability
// ═══════════════════════════════════════════════

let reqCounter = 0;

/**
 * Generate a short request ID for tracing.
 */
export function getRequestId() {
  return `r${(++reqCounter).toString(36)}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Log an API request with structured data.
 */
export function logRequest(req, extra = {}) {
  const rid = extra.rid || getRequestId();
  const method = req.method || "?";
  const url = req.url || "?";
  const ip = req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "?";
  console.log(`[API] ${rid} ${method} ${url} ip=${ip}`, extra.msg || "");
  return rid;
}

/**
 * Log an API error with context.
 */
export function logError(rid, handler, error) {
  console.error(`[ERR] ${rid} [${handler}]`, error?.message || error, error?.stack?.split("\n")[1]?.trim() || "");
}

/**
 * Build a safe error response (no stack traces in prod).
 */
export function errorResponse(res, status, error, rid = null) {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const body = {
    error: typeof error === "string" ? error : (error?.message || "Internal server error"),
    ...(rid ? { requestId: rid } : {}),
    ...(!isProd && error?.stack ? { debug: error.stack.split("\n").slice(0, 3) } : {})
  };
  return res.status(status).json(body);
}
